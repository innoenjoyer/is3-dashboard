/**
 * Pre-defined queries — the only "input" the user has (BRIEF §1).
 *
 * Each query is a data object with a pure predicate over the fleet. There is
 * no free-form query builder and no way for a query to write anything.
 * `now` is the feed's lastUpdated timestamp (epoch ms).
 */

import { SITES } from './fleet'
import { deriveStatus, latestReading, metricStatus } from './status'
import type {
  CameraMetrics,
  Device,
  FridgeMetrics,
  IntercomMetrics,
  SwitchMetrics,
  ThermostatMetrics,
} from './types'

export interface FleetQuery {
  id: string
  label: string
  description: string
  /** Pure predicate: same device and `now` always give the same answer. */
  predicate: (device: Device, now: number) => boolean
}

const MIN = 60_000
const HOUR = 3_600_000

/** "This site" for the critical-at-site query: the head-office site. */
const HQ_SITE_ID = SITES[0].id

function statusOf(device: Device, now: number) {
  return deriveStatus(device, latestReading(device), now)
}

/** Safe fridge holding temperature is at or below 5 °C. */
const FRIDGE_SAFE_MAX_C = 5
const CAMERA_DEGRADED_BITRATE_MBPS = 2
const INTERCOM_WEAK_SIGNAL_DBM = -75
const THERMOSTAT_OFF_TARGET_C = 2.5
const SWITCH_WARN_RATIO = 0.9

export const QUERIES: readonly FleetQuery[] = [
  {
    id: 'offline-over-15m',
    label: 'Silent over 15 minutes',
    description: 'Devices that stopped reporting more than 15 minutes ago.',
    predicate: (device, now) => {
      const latest = latestReading(device)
      if (!latest) return true
      return now - latest.timestamp > 15 * MIN
    },
  },
  {
    id: 'fridges-above-safe-temp',
    label: 'Fridges above safe temperature',
    description: `Fridges whose last reported temperature is above ${FRIDGE_SAFE_MAX_C} °C.`,
    predicate: (device) => {
      if (device.kind !== 'fridge') return false
      const latest = latestReading(device)
      return !!latest && (latest.metrics as FridgeMetrics).temperatureC > FRIDGE_SAFE_MAX_C
    },
  },
  {
    id: 'critical-at-hq',
    label: 'Critical at Northgate Tower',
    description: 'Devices reporting critical at the head-office site right now.',
    predicate: (device, now) =>
      device.siteId === HQ_SITE_ID && statusOf(device, now) === 'critical',
  },
  {
    id: 'cameras-degraded-bitrate',
    label: 'Cameras with degraded bitrate',
    description: `Cameras still reporting but streaming below ${CAMERA_DEGRADED_BITRATE_MBPS} Mbps.`,
    predicate: (device, now) => {
      if (device.kind !== 'camera') return false
      const latest = latestReading(device)
      if (!latest || statusOf(device, now) === 'offline') return false
      return (latest.metrics as CameraMetrics).bitrateMbps < CAMERA_DEGRADED_BITRATE_MBPS
    },
  },
  {
    id: 'recovered-last-hour',
    label: 'Recovered in the last hour',
    description:
      'Devices that reported serious or critical within the last hour and are back to good.',
    predicate: (device, now) => {
      if (statusOf(device, now) !== 'good') return false
      const hourAgo = now - HOUR
      for (const reading of device.history) {
        if (reading.timestamp < hourAgo) continue
        const s = metricStatus(device.kind, reading.metrics, device)
        if (s === 'serious' || s === 'critical') return true
      }
      return false
    },
  },
  {
    id: 'intercoms-weak-signal',
    label: 'Intercoms with weak signal',
    description: `Intercoms reporting signal below ${INTERCOM_WEAK_SIGNAL_DBM} dBm.`,
    predicate: (device) => {
      if (device.kind !== 'intercom') return false
      const latest = latestReading(device)
      return !!latest && (latest.metrics as IntercomMetrics).signalDbm < INTERCOM_WEAK_SIGNAL_DBM
    },
  },
  {
    id: 'switches-near-rated-load',
    label: 'Switches near their rated load',
    description: `Switches drawing over ${SWITCH_WARN_RATIO * 100}% of their rated amps.`,
    predicate: (device) => {
      if (device.kind !== 'switch') return false
      const latest = latestReading(device)
      if (!latest) return false
      const rated = device.ratedAmps ?? 16
      return (latest.metrics as SwitchMetrics).loadAmps / rated > SWITCH_WARN_RATIO
    },
  },
  {
    id: 'thermostats-off-target',
    label: 'Thermostats off target',
    description: `Thermostats more than ${THERMOSTAT_OFF_TARGET_C} °C away from their setpoint.`,
    predicate: (device) => {
      if (device.kind !== 'thermostat') return false
      const latest = latestReading(device)
      if (!latest) return false
      const m = latest.metrics as ThermostatMetrics
      return Math.abs(m.actualC - m.setpointC) > THERMOSTAT_OFF_TARGET_C
    },
  },
]
