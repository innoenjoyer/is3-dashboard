/**
 * Shared chart utilities: 24h bucket windows, historical status lookup,
 * axis tick maths and container measuring. All charts cover the same
 * end-aligned 24h window at 30-minute resolution.
 *
 * Tokens only — no colour values live here (BRIEF §3/§4).
 */

import { useEffect, useRef, useState } from 'react'
import { HISTORY_STEP_SEC, metricStatus, type Device, type DeviceStatus } from '../../data'

export const CHART_HOURS = 24
export const BUCKET_MIN = 30
export const BUCKET_MS = BUCKET_MIN * 60_000
export const BUCKET_COUNT = (CHART_HOURS * 60) / BUCKET_MIN

export interface BucketWindow {
  start: number
  end: number
  /** Status for bucket i is sampled at edges[i + 1]. */
  edges: number[]
}

/** The 24h window ending at `now`, split into 30-minute buckets. */
export function bucketWindow(now: number): BucketWindow {
  const end = now
  const start = now - CHART_HOURS * 3_600_000
  const edges: number[] = []
  for (let i = 0; i <= BUCKET_COUNT; i += 1) edges.push(start + i * BUCKET_MS)
  return { start, end, edges }
}

/**
 * A device's status at time `t`, derived from history alone (BRIEF: status is
 * derived, never stored). Offline means the newest reading at or before `t`
 * is older than the device's expected reporting interval — with a floor of
 * the history resolution (5 min): sub-grid gaps cannot be told apart from
 * normal reporting cadence in backfilled history, so reading them as offline
 * would paint the past as dark when devices were fine.
 */
export function statusAt(device: Device, t: number): DeviceStatus {
  const history = device.history
  // Binary search: last reading with timestamp <= t.
  let lo = 0
  let hi = history.length - 1
  let idx = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const ts = history[mid].timestamp
    if (ts <= t) {
      idx = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  if (idx < 0) return 'offline'
  const reading = history[idx]
  const staleSec = Math.max(device.expectedIntervalSec, HISTORY_STEP_SEC)
  if ((t - reading.timestamp) / 1000 > staleSec) return 'offline'
  return metricStatus(device.kind, reading.metrics, device)
}

/**
 * Evenly spaced "nice" axis ticks inside [min, max]. The endpoints are data
 * values, not necessarily ticks — ticks land on round steps only.
 */
export function niceTicks(min: number, max: number, count = 4): number[] {
  let lo = min
  let hi = max
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const span = hi - lo
  const step0 = span / count
  const mag = 10 ** Math.floor(Math.log10(step0))
  const norm = step0 / mag
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag
  const first = Math.ceil(lo / step) * step
  const ticks: number[] = []
  for (let v = first; v <= hi + 1e-9; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6)
  }
  return ticks
}

/** Measure the chart container; redraw on resize (never squash, BRIEF §7). */
export function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0]?.contentRect.width ?? 0)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/** HH:MM (24-hour) for axis ticks and tooltips — compact and unambiguous. */
export function tickTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** End-aligned time ticks; the caller caps the count to the plot width. */
export function timeTicks(start: number, end: number, count = 5): number[] {
  const ticks: number[] = []
  for (let i = 0; i < count; i += 1) ticks.push(start + ((end - start) * i) / (count - 1))
  return ticks
}

/** As many time ticks as the plot width honestly holds (never colliding). */
export function timeTickCount(plotWidth: number): number {
  return Math.max(2, Math.min(5, Math.floor(plotWidth / 90)))
}
