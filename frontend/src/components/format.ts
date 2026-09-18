/**
 * Display formatting helpers. Copy style follows BRIEF §8: written from the
 * technician's side of the screen ("Last reported 4 min ago").
 */

import { latestReading } from '../data'
import type {
  CameraMetrics,
  Device,
  FridgeMetrics,
  IntercomMetrics,
  SwitchMetrics,
  ThermostatMetrics,
} from '../data'

/** "just now" / "12 s ago" / "4 min ago" / "3 h ago" / "never". */
export function relativeAge(now: number, timestamp: number | undefined): string {
  if (timestamp === undefined) return 'never'
  const sec = Math.max(0, Math.round((now - timestamp) / 1000))
  if (sec < 10) return 'just now'
  if (sec < 60) return `${sec} s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hours = Math.floor(min / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

/** HH:MM for history lists. */
export function timeOfDay(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export interface MetricDisplay {
  label: string
  value: string
}

/** The one number a technician checks first for this kind of device. */
export function primaryMetric(device: Device): MetricDisplay {
  const reading = latestReading(device)
  if (!reading) return { label: 'No readings yet', value: '—' }
  return metricDisplay(device, reading.metrics)
}

/** All metrics of a reading, labelled, for the drawer's current readings. */
export function metricDisplay(device: Device, metrics: Device['history'][number]['metrics']): MetricDisplay {
  switch (device.kind) {
    case 'camera': {
      const m = metrics as CameraMetrics
      return { label: 'Bitrate', value: `${m.bitrateMbps.toFixed(1)} Mbps` }
    }
    case 'switch': {
      const m = metrics as SwitchMetrics
      const rated = device.ratedAmps ?? 16
      return { label: 'Load', value: `${m.loadAmps.toFixed(1)} A of ${rated} A` }
    }
    case 'fridge': {
      const m = metrics as FridgeMetrics
      return { label: 'Temperature', value: `${m.temperatureC.toFixed(1)} °C` }
    }
    case 'thermostat': {
      const m = metrics as ThermostatMetrics
      return {
        label: 'Actual vs setpoint',
        value: `${m.actualC.toFixed(1)} °C / ${m.setpointC.toFixed(0)} °C`,
      }
    }
    case 'intercom': {
      const m = metrics as IntercomMetrics
      return { label: 'Signal', value: `${m.signalDbm.toFixed(0)} dBm` }
    }
  }
}

/** Every metric of the latest reading, for the drawer. */
export function allMetrics(device: Device): MetricDisplay[] {
  const reading = latestReading(device)
  if (!reading) return []
  const m = reading.metrics
  switch (device.kind) {
    case 'camera': {
      const c = m as CameraMetrics
      return [
        { label: 'Uptime', value: `${c.uptimePct.toFixed(1)} %` },
        { label: 'Bitrate', value: `${c.bitrateMbps.toFixed(1)} Mbps` },
      ]
    }
    case 'switch': {
      const s = m as SwitchMetrics
      const rated = device.ratedAmps ?? 16
      return [
        { label: 'Load', value: `${s.loadAmps.toFixed(1)} A` },
        { label: 'Rated capacity', value: `${rated} A` },
      ]
    }
    case 'fridge': {
      const f = m as FridgeMetrics
      return [{ label: 'Temperature', value: `${f.temperatureC.toFixed(1)} °C` }]
    }
    case 'thermostat': {
      const t = m as ThermostatMetrics
      return [
        { label: 'Actual', value: `${t.actualC.toFixed(1)} °C` },
        { label: 'Setpoint', value: `${t.setpointC.toFixed(0)} °C` },
      ]
    }
    case 'intercom': {
      const i = m as IntercomMetrics
      return [
        { label: 'Calls last hour', value: `${i.callsLastHour}` },
        { label: 'Signal', value: `${i.signalDbm.toFixed(0)} dBm` },
      ]
    }
  }
}
