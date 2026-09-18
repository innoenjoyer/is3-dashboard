/**
 * Status derivation. A device's status is always DERIVED from its data —
 * never stored, never randomly assigned.
 *
 * Rule: a device whose last message is older than its expected reporting
 * interval is 'offline'. Otherwise the status comes from kind-specific
 * thresholds on the latest metrics.
 */

import type {
  CameraMetrics,
  Device,
  DeviceKind,
  DeviceMetrics,
  DeviceStatus,
  FridgeMetrics,
  IntercomMetrics,
  Reading,
  SwitchMetrics,
  ThermostatMetrics,
} from './types'

export function latestReading(device: Device): Reading | undefined {
  return device.history[device.history.length - 1]
}

/** Status from metrics alone (no staleness check). */
export function metricStatus(
  kind: DeviceKind,
  metrics: DeviceMetrics,
  device?: Device,
): DeviceStatus {
  switch (kind) {
    case 'camera': {
      const m = metrics as CameraMetrics
      if (m.uptimePct < 94 || m.bitrateMbps < 1) return 'critical'
      if (m.uptimePct < 97 || m.bitrateMbps < 2) return 'serious'
      if (m.uptimePct < 99 || m.bitrateMbps < 3) return 'warning'
      return 'good'
    }
    case 'switch': {
      const m = metrics as SwitchMetrics
      const rated = device?.ratedAmps ?? 16
      const ratio = m.loadAmps / rated
      if (ratio > 0.98) return 'critical'
      if (ratio > 0.9) return 'serious'
      if (ratio > 0.8) return 'warning'
      return 'good'
    }
    case 'fridge': {
      const m = metrics as FridgeMetrics
      if (m.temperatureC > 9) return 'critical'
      if (m.temperatureC > 7) return 'serious'
      if (m.temperatureC > 5) return 'warning'
      return 'good'
    }
    case 'thermostat': {
      const m = metrics as ThermostatMetrics
      const deviation = Math.abs(m.actualC - m.setpointC)
      if (deviation > 4) return 'critical'
      if (deviation > 2.5) return 'serious'
      if (deviation > 1) return 'warning'
      return 'good'
    }
    case 'intercom': {
      const m = metrics as IntercomMetrics
      if (m.signalDbm < -85) return 'critical'
      if (m.signalDbm < -75) return 'serious'
      if (m.signalDbm < -65) return 'warning'
      return 'good'
    }
  }
}

/**
 * Derive the current status of a device at time `now` (epoch ms).
 * Pure: same inputs always give the same status.
 */
export function deriveStatus(
  device: Device,
  reading: Reading | undefined,
  now: number,
): DeviceStatus {
  if (!reading) return 'offline'
  const ageSec = (now - reading.timestamp) / 1000
  if (ageSec > device.expectedIntervalSec) return 'offline'
  return metricStatus(device.kind, reading.metrics, device)
}
