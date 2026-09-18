/**
 * DeviceGrid — cards for the filtered fleet, worst first. The empty state is
 * an invitation, not a shrug (BRIEF §8).
 */

import { deriveStatus, latestReading, type Device, type DeviceStatus } from '../data'
import DeviceCard from './DeviceCard'

/** Attention first: critical → serious → warning → offline → good. */
const SEVERITY_ORDER: Record<DeviceStatus, number> = {
  critical: 0,
  serious: 1,
  warning: 2,
  offline: 3,
  good: 4,
}

interface DeviceGridProps {
  devices: Device[]
  now: number
  totalFleet: number
  anyFilterActive: boolean
  onClearFilters: () => void
  onSelect: (deviceId: string) => void
}

export default function DeviceGrid({
  devices,
  now,
  totalFleet,
  anyFilterActive,
  onClearFilters,
  onSelect,
}: DeviceGridProps) {
  const sorted = [...devices].sort((a, b) => {
    const sa = deriveStatus(a, latestReading(a), now)
    const sb = deriveStatus(b, latestReading(b), now)
    if (SEVERITY_ORDER[sa] !== SEVERITY_ORDER[sb]) return SEVERITY_ORDER[sa] - SEVERITY_ORDER[sb]
    return a.name.localeCompare(b.name)
  })

  if (sorted.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface-1 px-6 py-12 text-center">
        <p className="text-sm text-text-secondary">
          No devices match these filters. Clear them to see all {totalFleet}.
        </p>
        {anyFilterActive && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            Clear filters
          </button>
        )}
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {sorted.map((device) => (
        <li key={device.id}>
          <DeviceCard
            device={device}
            status={deriveStatus(device, latestReading(device), now)}
            now={now}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  )
}
