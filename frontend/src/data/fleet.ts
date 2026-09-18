/**
 * Deterministic mock fleet generator and live-feed advancer.
 *
 * generateFleet(seed, now) builds 240 devices across 6 sites and 5 kinds with
 * 24h of backfilled history. The same seed (and `now`) always produces the
 * same fleet — all randomness flows through the seeded PRNG, never
 * Math.random.
 *
 * advanceFleet() is the simulation internals used by useLiveFeed to push new
 * readings. It is not a user-facing action: nothing here creates, edits,
 * deletes or commands a real device.
 */

import { int, mulberry32, normal, pick, range, shuffle, type Rng } from './prng'
import type {
  CameraMetrics,
  Device,
  DeviceKind,
  DeviceMetrics,
  FridgeMetrics,
  IntercomMetrics,
  Reading,
  Site,
  SwitchMetrics,
  ThermostatMetrics,
} from './types'
import { DEVICE_KIND_LABELS } from './types'

export const FLEET_SEED = 20260918
export const FLEET_SIZE = 240
export const HISTORY_HOURS = 24
/** History is stored at 5-minute resolution. */
export const HISTORY_STEP_SEC = 300
/** Simulated seconds advanced per live-feed tick. */
export const LIVE_STEP_SEC = 30

export const SITES: readonly Site[] = [
  { id: 'northgate-tower', name: 'Northgate Tower' },
  { id: 'harbour-quay', name: 'Harbour Quay' },
  { id: 'depot-4', name: 'Depot 4' },
  { id: 'riverside-annex', name: 'Riverside Annex' },
  { id: 'old-mill-works', name: 'Old Mill Works' },
  { id: 'central-plant', name: 'Central Plant' },
]

const SITE_SHORT: Record<string, string> = {
  'northgate-tower': 'NT',
  'harbour-quay': 'HQ',
  'depot-4': 'D4',
  'riverside-annex': 'RA',
  'old-mill-works': 'OM',
  'central-plant': 'CP',
}

/** Device counts per site; sums to FLEET_SIZE. */
const SITE_COUNTS = [56, 48, 40, 36, 32, 28]

/** Device counts per kind; sums to FLEET_SIZE. */
const KIND_PLAN: ReadonlyArray<readonly [DeviceKind, number]> = [
  ['camera', 72],
  ['switch', 60],
  ['fridge', 36],
  ['thermostat', 42],
  ['intercom', 30],
]

/** Typical reporting interval per kind, in seconds. */
const BASE_INTERVAL_SEC: Record<DeviceKind, number> = {
  camera: 30,
  switch: 60,
  fridge: 300,
  thermostat: 120,
  intercom: 60,
}

const KIND_PREFIX: Record<DeviceKind, string> = {
  camera: 'cam',
  switch: 'swt',
  fridge: 'frg',
  thermostat: 'thm',
  intercom: 'int',
}

/** Fleet health mix: a few devices must be in genuinely bad shape. */
type ProfileMode = 'healthy' | 'flaky' | 'degraded' | 'recovered' | 'offline'

/** Numeric targets the random walk reverts to. Extra keys (phase, ratedAmps,
 * setpointC, callsBase) parameterise the walk. */
interface MetricTarget {
  [key: string]: number
}

interface Baselines {
  healthy: MetricTarget
  degraded: MetricTarget
}

interface SimState {
  mode: ProfileMode
  baselines: Baselines
  /** Chance a flaky device skips a due report. */
  missRate: number
  /** Next simulated report time (ms); Infinity for silent devices. */
  nextDueAt: number
  /** Offline devices stop reporting at this time. */
  cutoffAt: number
  /** Recovered devices run degraded inside [patchStart, patchEnd]. */
  patchStart: number
  patchEnd: number
}

/** Simulation internals keyed by device id (survives immutable updates that
 * replace device objects); never user-facing. */
const simStates = new Map<string, SimState>()

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}

/** Mean-reverting random walk step. */
function walk(prev: number, target: number, sd: number, rng: Rng): number {
  return prev + (target - prev) * 0.08 + normal(rng, 0, sd)
}

/** Daily cycle in [-1, 1]; phase is per-device. */
function dayCycle(t: number, phase: number): number {
  return Math.sin((t / 86_400_000) * Math.PI * 2 + phase)
}

function baselinesFor(kind: DeviceKind, rng: Rng): Baselines {
  switch (kind) {
    case 'camera':
      return {
        healthy: { uptimePct: range(rng, 99.2, 99.9), bitrateMbps: range(rng, 4, 8) },
        degraded: { uptimePct: range(rng, 91, 96), bitrateMbps: range(rng, 0.5, 1.8) },
      }
    case 'switch': {
      const rated = pick(rng, [16, 16, 32])
      return {
        healthy: { loadAmps: rated * range(rng, 0.2, 0.65), ratedAmps: rated },
        degraded: { loadAmps: rated * range(rng, 0.92, 1.05), ratedAmps: rated },
      }
    }
    case 'fridge':
      return {
        healthy: { temperatureC: range(rng, 2.5, 4.5), phase: range(rng, 0, Math.PI * 2) },
        degraded: { temperatureC: range(rng, 8, 12), phase: range(rng, 0, Math.PI * 2) },
      }
    case 'thermostat': {
      const setpoint = int(rng, 19, 23)
      const direction = pick(rng, [-1, 1])
      return {
        healthy: { setpointC: setpoint, actualC: setpoint + range(rng, -0.5, 0.5) },
        degraded: { setpointC: setpoint, actualC: setpoint + direction * range(rng, 4.5, 7) },
      }
    }
    case 'intercom':
      return {
        healthy: { callsBase: range(rng, 2, 8), signalDbm: range(rng, -68, -55) },
        degraded: { callsBase: range(rng, 2, 8), signalDbm: range(rng, -92, -78) },
      }
  }
}

function initialMetrics(kind: DeviceKind, target: MetricTarget): DeviceMetrics {
  switch (kind) {
    case 'camera':
      return { uptimePct: target.uptimePct, bitrateMbps: target.bitrateMbps }
    case 'switch':
      return { loadAmps: target.loadAmps }
    case 'fridge':
      return { temperatureC: target.temperatureC }
    case 'thermostat':
      return { setpointC: target.setpointC, actualC: target.actualC }
    case 'intercom':
      return { callsLastHour: Math.round(target.callsBase), signalDbm: target.signalDbm }
  }
}

/** Advance one kind's metrics by one step, reverting toward `target`. */
function stepMetrics(
  kind: DeviceKind,
  prev: DeviceMetrics,
  target: MetricTarget,
  rng: Rng,
  t: number,
): DeviceMetrics {
  switch (kind) {
    case 'camera': {
      const p = prev as CameraMetrics
      return {
        uptimePct: round2(clamp(walk(p.uptimePct, target.uptimePct, 0.15, rng), 0, 100)),
        bitrateMbps: round2(clamp(walk(p.bitrateMbps, target.bitrateMbps, 0.3, rng), 0.1, 12)),
      }
    }
    case 'switch': {
      const p = prev as SwitchMetrics
      return {
        loadAmps: round2(clamp(walk(p.loadAmps, target.loadAmps, 0.4, rng), 0, target.ratedAmps * 1.2)),
      }
    }
    case 'fridge': {
      const p = prev as FridgeMetrics
      const cycled = target.temperatureC + 0.4 * dayCycle(t, target.phase)
      return { temperatureC: round2(clamp(walk(p.temperatureC, cycled, 0.15, rng), -10, 20)) }
    }
    case 'thermostat': {
      const p = prev as ThermostatMetrics
      return {
        setpointC: target.setpointC,
        actualC: round2(clamp(walk(p.actualC, target.actualC, 0.2, rng), 5, 35)),
      }
    }
    case 'intercom': {
      const p = prev as IntercomMetrics
      const hour = new Date(t).getUTCHours()
      const business = hour >= 8 && hour <= 18 ? 1 : 0.15
      return {
        callsLastHour: Math.max(0, Math.round(normal(rng, target.callsBase * business, 1))),
        signalDbm: round2(clamp(walk(p.signalDbm, target.signalDbm, 1.5, rng), -100, -30)),
      }
    }
  }
}

function rollMode(rng: Rng): ProfileMode {
  const roll = rng()
  if (roll < 0.78) return 'healthy'
  if (roll < 0.86) return 'flaky'
  if (roll < 0.94) return 'degraded'
  if (roll < 0.97) return 'recovered'
  return 'offline'
}

/**
 * Build the fleet. Deterministic in `seed`; `now` only anchors the timeline
 * (defaults to wall clock so statuses are meaningful on load).
 */
export function generateFleet(seed: number = FLEET_SEED, now: number = Date.now()): Device[] {
  const rng = mulberry32(seed)
  const stepMs = HISTORY_STEP_SEC * 1000
  const end = Math.floor(now / stepMs) * stepMs
  const start = end - HISTORY_HOURS * 3_600_000

  const sitePool: string[] = []
  SITES.forEach((site, i) => {
    for (let k = 0; k < SITE_COUNTS[i]; k += 1) sitePool.push(site.id)
  })
  shuffle(sitePool, rng)

  const devices: Device[] = []
  const sequences = new Map<string, number>()
  let poolIndex = 0

  for (const [kind, count] of KIND_PLAN) {
    for (let n = 0; n < count; n += 1) {
      const siteId = sitePool[poolIndex]
      poolIndex += 1

      const seqKey = `${kind}@${siteId}`
      const seq = (sequences.get(seqKey) ?? 0) + 1
      sequences.set(seqKey, seq)
      const code = `${SITE_SHORT[siteId]}-${String(seq).padStart(3, '0')}`
      const id = `${KIND_PREFIX[kind]}-${code.toLowerCase()}`

      const expectedIntervalSec = Math.round(BASE_INTERVAL_SEC[kind] * range(rng, 0.8, 1.2))
      const baselines = baselinesFor(kind, rng)
      const mode = rollMode(rng)

      const state: SimState = {
        mode,
        baselines,
        missRate: mode === 'flaky' ? 0.08 : 0,
        nextDueAt: mode === 'offline' ? Number.POSITIVE_INFINITY : end + expectedIntervalSec * 1000,
        cutoffAt: end - range(rng, 20, 600) * 60_000, // silent for 20 min – 10 h
        patchStart: end - range(rng, 2, 5) * 3_600_000,
        // Bad patch clears 10–55 min ago: bad readings inside the last hour,
        // good readings since — the device recovered in the last hour.
        patchEnd: end - range(rng, 10, 55) * 60_000,
      }

      const device: Device = {
        id,
        name: `${DEVICE_KIND_LABELS[kind]} ${code}`,
        kind,
        siteId,
        expectedIntervalSec,
        ...(kind === 'switch' ? { ratedAmps: baselines.healthy.ratedAmps } : {}),
        history: [],
      }

      const liveTarget = mode === 'degraded' ? baselines.degraded : baselines.healthy
      let metrics = initialMetrics(kind, liveTarget)
      const lastT = mode === 'offline' ? state.cutoffAt : end
      let wasInPatch = false
      const history: Reading[] = []
      for (let t = start; t <= lastT; t += stepMs) {
        const inPatch = mode === 'recovered' && t >= state.patchStart && t <= state.patchEnd
        if (wasInPatch && !inPatch) {
          // Recovery: values snap back to the healthy band once the fault clears.
          metrics = initialMetrics(kind, baselines.healthy)
        }
        wasInPatch = inPatch
        const target = inPatch || mode === 'degraded' ? baselines.degraded : baselines.healthy
        metrics = stepMetrics(kind, metrics, target, rng, t)
        history.push({ deviceId: id, timestamp: t, metrics })
      }
      device.history = history
      simStates.set(device.id, state)
      devices.push(device)
    }
  }

  return devices
}

/** Latest timestamp present anywhere in the fleet. */
export function fleetEndTime(fleet: readonly Device[]): number {
  let end = 0
  for (const d of fleet) {
    const last = d.history[d.history.length - 1]
    if (last && last.timestamp > end) end = last.timestamp
  }
  return end
}

/**
 * Simulation internals: advance the fleet to `toTime`, appending due reports
 * and trimming history to the last HISTORY_HOURS. Returns a new array; devices
 * with no new reports keep their identity. Requires devices built by
 * generateFleet (their sim state is looked up internally).
 */
export function advanceFleet(fleet: readonly Device[], rng: Rng, toTime: number): Device[] {
  const cutoff = toTime - HISTORY_HOURS * 3_600_000
  return fleet.map((device) => {
    const state = simStates.get(device.id)
    if (!state || state.nextDueAt > toTime) return device

    const history = [...device.history]
    let latest = history[history.length - 1]
    let changed = false

    while (state.nextDueAt <= toTime) {
      const misses = state.mode === 'flaky' && rng() < state.missRate
      if (!misses && latest) {
        const target = state.mode === 'degraded' ? state.baselines.degraded : state.baselines.healthy
        const metrics = stepMetrics(device.kind, latest.metrics, target, rng, state.nextDueAt)
        latest = { deviceId: device.id, timestamp: state.nextDueAt, metrics }
        history.push(latest)
        changed = true
      }
      state.nextDueAt += device.expectedIntervalSec * 1000
    }

    if (!changed) return device
    let first = 0
    while (first < history.length && history[first].timestamp < cutoff) first += 1
    return { ...device, history: history.slice(first) }
  })
}
