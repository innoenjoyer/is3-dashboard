/**
 * Core data shapes for the Is3 fleet dashboard.
 *
 * The system is read-only: these types describe status pushed from devices in
 * the field. There is deliberately no shape here for creating, editing,
 * deleting or commanding a device.
 */

export type DeviceStatus = 'good' | 'warning' | 'serious' | 'critical' | 'offline'

export type DeviceKind = 'camera' | 'switch' | 'fridge' | 'thermostat' | 'intercom'

export const DEVICE_KIND_LABELS: Record<DeviceKind, string> = {
  camera: 'Camera',
  switch: 'Switch',
  fridge: 'Fridge',
  thermostat: 'Thermostat',
  intercom: 'Intercom',
}

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  good: 'Good',
  warning: 'Warning',
  serious: 'Serious',
  critical: 'Critical',
  offline: 'Offline',
}

export interface Site {
  id: string
  name: string
}

/** Primary metrics per kind. Each kind reports its own plausible set. */
export interface CameraMetrics {
  uptimePct: number
  bitrateMbps: number
}

export interface SwitchMetrics {
  loadAmps: number
}

export interface FridgeMetrics {
  temperatureC: number
}

export interface ThermostatMetrics {
  setpointC: number
  actualC: number
}

export interface IntercomMetrics {
  callsLastHour: number
  signalDbm: number
}

export type DeviceMetrics =
  | CameraMetrics
  | SwitchMetrics
  | FridgeMetrics
  | ThermostatMetrics
  | IntercomMetrics

/** A single stateless status message pushed by a device. */
export interface Reading {
  deviceId: string
  /** Unix epoch milliseconds. */
  timestamp: number
  metrics: DeviceMetrics
}

export interface Device {
  id: string
  name: string
  kind: DeviceKind
  siteId: string
  /** How often the device is expected to report, in seconds. */
  expectedIntervalSec: number
  /** Rated capacity in amps; switches only. */
  ratedAmps?: number
  /** Chronological history, oldest first. */
  history: Reading[]
}
