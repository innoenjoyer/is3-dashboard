/**
 * DeviceCard — name, kind icon, status (icon + label + colour, always all
 * three), primary metric, last-seen. The whole card is one button that opens
 * the device drawer; the system is read-only, so there is nothing else to do.
 */

import {
  DEVICE_KIND_LABELS,
  latestReading,
  SITES,
  type Device,
  type DeviceStatus,
} from '../data'
import { primaryMetric, relativeAge } from './format'
import { KindIcon } from './icons'
import StatusBadge from './StatusBadge'

const SITE_NAMES = new Map(SITES.map((s) => [s.id, s.name]))

interface DeviceCardProps {
  device: Device
  status: DeviceStatus
  now: number
  onSelect: (deviceId: string) => void
}

export default function DeviceCard({ device, status, now, onSelect }: DeviceCardProps) {
  const metric = primaryMetric(device)
  const lastSeen = latestReading(device)?.timestamp

  return (
    <button
      type="button"
      onClick={() => onSelect(device.id)}
      className="flex w-full flex-col gap-2 rounded-md border border-border bg-surface-1 p-4 text-left hover:bg-surface-2"
      aria-label={`${device.name}, ${DEVICE_KIND_LABELS[device.kind]}, status ${status}. Open details.`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <KindIcon kind={device.kind} className="h-4 w-4 shrink-0 text-text-muted" />
          <span className="truncate text-sm font-medium text-text-primary">{device.name}</span>
        </span>
        <StatusBadge status={status} className="shrink-0" />
      </span>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-text-muted">{metric.label}</span>
        <span className="tnums font-data text-lg font-medium text-text-primary">{metric.value}</span>
      </span>
      <span className="flex items-baseline justify-between gap-2 text-xs text-text-muted">
        <span className="truncate">{SITE_NAMES.get(device.siteId) ?? device.siteId}</span>
        <span className="tnums shrink-0">Last reported {relativeAge(now, lastSeen)}</span>
      </span>
    </button>
  )
}
