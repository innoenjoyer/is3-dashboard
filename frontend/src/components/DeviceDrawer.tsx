/**
 * DeviceDrawer — device detail, opened from a card or a Fleet Pulse tick.
 *
 * Shows identity, current readings and the 24 h sparkline of the device's
 * primary metric (T4). Closes on Escape and on overlay click, traps focus
 * while open, and returns focus to the trigger on close.
 * Read-only: the drawer presents status; there is nothing to operate.
 */

import { useEffect, useRef } from 'react'
import {
  DEVICE_KIND_LABELS,
  deriveStatus,
  latestReading,
  SITES,
  type Device,
} from '../data'
import { allMetrics, relativeAge } from './format'
import StatusBadge from './StatusBadge'
import Sparkline from './charts/Sparkline'

const SITE_NAMES = new Map(SITES.map((s) => [s.id, s.name]))

interface DeviceDrawerProps {
  device: Device
  now: number
  onClose: () => void
}

export default function DeviceDrawer({ device, now, onClose }: DeviceDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trigger =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    if (!panel) return undefined

    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))

    // Move focus into the drawer on open.
    focusables()[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      // Return focus to whatever opened the drawer.
      trigger?.focus()
    }
  }, [onClose])

  const status = deriveStatus(device, latestReading(device), now)
  const latest = latestReading(device)

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div
        className="absolute inset-0 bg-page-plane opacity-80"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-drawer-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-surface-2 p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="device-drawer-title" className="text-lg font-semibold text-text-primary">
              {device.name}
            </h2>
            <p className="tnums mt-0.5 font-data text-xs text-text-muted">{device.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close device details"
            className="rounded-md border border-border bg-surface-1 px-2.5 py-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>

        <div className="mt-3">
          <StatusBadge status={status} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-text-muted">Kind</dt>
            <dd className="text-text-primary">{DEVICE_KIND_LABELS[device.kind]}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Site</dt>
            <dd className="text-text-primary">{SITE_NAMES.get(device.siteId) ?? device.siteId}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Reports every</dt>
            <dd className="tnums font-data text-text-primary">{device.expectedIntervalSec} s</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Last reported</dt>
            <dd className="tnums font-data text-text-primary">
              {relativeAge(now, latest?.timestamp)}
            </dd>
          </div>
        </dl>

        <h3 className="mt-6 font-display text-xs font-semibold uppercase tracking-wider text-text-muted">
          Current readings
        </h3>
        {latest ? (
          <dl className="mt-2 space-y-1.5">
            {allMetrics(device).map((m) => (
              <div key={m.label} className="flex items-baseline justify-between gap-4 text-sm">
                <dt className="text-text-muted">{m.label}</dt>
                <dd className="tnums font-data text-text-primary">{m.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-text-secondary">No readings yet.</p>
        )}

        <div className="mt-6">
          <Sparkline device={device} now={now} />
        </div>
      </div>
    </div>
  )
}
