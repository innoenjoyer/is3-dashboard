/**
 * FleetPulse — the signature element (BRIEF §3).
 *
 * A full-width dense strip of one thin vertical tick per device:
 *   tick colour = status, tick height = severity
 *   (good is a short dim tick on the baseline, warning low, serious mid,
 *   critical full height, offline a short stub in the offline grey),
 *   tick opacity = data freshness (a stale reading fades toward the
 *   surface, never to zero), ordered worst first on the left.
 *
 * Rendered as SVG so every tick is a real DOM node. Hovering (or moving the
 * keyboard cursor with arrow keys) reveals which device a tick is; clicking
 * (or Enter) opens that device's drawer. A tick that changes status gets a
 * brief highlight and nothing more — reduced-motion users get the state
 * change without the animation (index.css neutralises the keyframes).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEVICE_KIND_LABELS,
  DEVICE_STATUS_LABELS,
  deriveStatus,
  latestReading,
  type Device,
  type DeviceStatus,
} from '../data'
import { relativeAge } from './format'
import StatusBadge from './StatusBadge'

const HEIGHT = 64
const TICK_W = 3
const TICK_GAP = 2
const PITCH = TICK_W + TICK_GAP
/**
 * Tick height carries severity (BRIEF §3): good is a short tick on the
 * baseline, warning low, serious mid, critical full height; offline is a
 * distinct short stub, slightly taller than good so the two never read alike.
 */
const TICK_HEIGHT: Record<DeviceStatus, number> = {
  good: 7,
  offline: 12,
  warning: 22,
  serious: 40,
  critical: HEIGHT,
}
/** Worst-first ordering of the strip. */
const SEVERITY_RANK: Record<DeviceStatus, number> = {
  critical: 4,
  serious: 3,
  warning: 2,
  offline: 1,
  good: 0,
}
/** A reading 15 minutes old reads as fully stale. */
const FRESH_WINDOW_SEC = 15 * 60
/** Fade floor: a stale tick dims toward the surface but never vanishes. */
const MIN_OPACITY = 0.25
/** Good ticks stay dim even when fresh — the baseline should read quiet. */
const GOOD_MIN_OPACITY = 0.2
const GOOD_MAX_OPACITY = 0.45
/** Offline ticks are stale by definition; keep them at a fixed mid opacity. */
const OFFLINE_OPACITY = 0.7
/** How long a status change stays highlighted, ms. */
const FLASH_MS = 1500

const FILL_CLASS: Record<DeviceStatus, string> = {
  good: 'fill-status-good',
  warning: 'fill-status-warning',
  serious: 'fill-status-serious',
  critical: 'fill-status-critical',
  offline: 'fill-status-offline',
}

interface TickModel {
  device: Device
  status: DeviceStatus
  /** 0 (stale) – 1 (just reported). */
  freshness: number
  lastSeen: number | undefined
}

export default function FleetPulse({
  fleet,
  now,
  onSelect,
}: {
  fleet: Device[]
  now: number
  onSelect: (deviceId: string) => void
}) {
  // One tick per device, worst first; within a group, most recently seen first.
  const ticks = useMemo<TickModel[]>(() => {
    const models = fleet.map((device) => {
      const latest = latestReading(device)
      const status = deriveStatus(device, latest, now)
      const ageSec = latest ? Math.max(0, (now - latest.timestamp) / 1000) : Number.POSITIVE_INFINITY
      const freshness =
        status === 'offline' ? 0 : Math.max(0, 1 - ageSec / FRESH_WINDOW_SEC)
      return { device, status, freshness, lastSeen: latest?.timestamp }
    })
    models.sort(
      (a, b) =>
        SEVERITY_RANK[b.status] - SEVERITY_RANK[a.status] ||
        (b.lastSeen ?? 0) - (a.lastSeen ?? 0),
    )
    return models
  }, [fleet, now])

  // Fit as many ticks as the container honestly holds; never squash (BRIEF §7).
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const maxTicks = Math.max(1, Math.floor((containerWidth + TICK_GAP) / PITCH))
  const visible = ticks.slice(0, maxTicks)
  const truncated = visible.length < ticks.length

  // Brief highlight when a tick's status changes — nothing more.
  const prevStatusRef = useRef<Map<string, DeviceStatus>>(new Map())
  const [flashing, setFlashing] = useState<ReadonlySet<string>>(new Set())
  useEffect(() => {
    const changed: string[] = []
    for (const t of ticks) {
      const prev = prevStatusRef.current.get(t.device.id)
      if (prev !== undefined && prev !== t.status) changed.push(t.device.id)
      prevStatusRef.current.set(t.device.id, t.status)
    }
    if (changed.length === 0) return undefined
    setFlashing(new Set(changed))
    const timer = window.setTimeout(() => setFlashing(new Set()), FLASH_MS)
    return () => window.clearTimeout(timer)
  }, [ticks])

  // Keyboard cursor: the strip is one tab stop; arrows move along the ticks.
  const [cursor, setCursor] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)
  const activeIndex = Math.min(hovered ?? cursor, visible.length - 1)
  const active = visible[activeIndex]

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    let next: number | null = null
    if (event.key === 'ArrowRight') next = Math.min(activeIndex + 1, visible.length - 1)
    else if (event.key === 'ArrowLeft') next = Math.max(activeIndex - 1, 0)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = visible.length - 1
    else if ((event.key === 'Enter' || event.key === ' ') && active) {
      event.preventDefault()
      onSelect(active.device.id)
      return
    }
    if (next !== null) {
      event.preventDefault()
      setHovered(null)
      setCursor(next)
    }
  }

  const svgWidth = visible.length * PITCH - TICK_GAP

  return (
    <section aria-labelledby="fleet-pulse-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="fleet-pulse-heading"
          className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted"
        >
          Fleet pulse
        </h2>
        <p className="text-xs text-text-muted">
          One tick per device — height is severity, fade is staleness, worst first on the left.
        </p>
      </div>
      {/* Status legend, worst first to match the strip: tick colour is never the only carrier of meaning. */}
      <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1" aria-label="Status legend">
        {(['critical', 'serious', 'warning', 'offline', 'good'] as const).map((s) => (
          <li key={s}>
            <StatusBadge status={s} />
          </li>
        ))}
      </ul>

      <div
        ref={containerRef}
        role="listbox"
        aria-label="Fleet pulse. One tick per device. Use arrow keys to move between devices, Enter to open details."
        aria-activedescendant={active ? `fleet-pulse-tick-${active.device.id}` : undefined}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="mt-2 overflow-hidden rounded-md border border-border bg-surface-1 px-2 py-2"
      >
        <svg
          width={svgWidth > 0 ? svgWidth : 1}
          height={HEIGHT}
          className="block"
          role="presentation"
        >
          <style>
            {`@keyframes tick-flash { 0% { opacity: 0.9; } 100% { opacity: 0; } }
.tick-flash { animation: tick-flash 1.4s ease-out forwards; }`}
          </style>
          {visible.map((t, i) => {
            const h = TICK_HEIGHT[t.status]
            // Opacity carries freshness: stale fades toward the surface.
            const opacity =
              t.status === 'offline'
                ? OFFLINE_OPACITY
                : t.status === 'good'
                  ? GOOD_MIN_OPACITY + t.freshness * (GOOD_MAX_OPACITY - GOOD_MIN_OPACITY)
                  : MIN_OPACITY + t.freshness * (1 - MIN_OPACITY)
            const x = i * PITCH
            const isActive = i === activeIndex
            return (
              <g key={t.device.id}>
                <rect
                  id={`fleet-pulse-tick-${t.device.id}`}
                  role="option"
                  aria-selected={isActive}
                  aria-label={`${t.device.name}, ${DEVICE_KIND_LABELS[t.device.kind]}, status ${DEVICE_STATUS_LABELS[t.status]}, last reported ${relativeAge(now, t.lastSeen)}`}
                  x={x}
                  y={HEIGHT - h}
                  width={TICK_W}
                  height={h}
                  opacity={opacity}
                  className={`${FILL_CLASS[t.status]} cursor-pointer`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelect(t.device.id)}
                >
                  <title>
                    {`${t.device.name} — ${DEVICE_STATUS_LABELS[t.status]}, last reported ${relativeAge(now, t.lastSeen)}`}
                  </title>
                </rect>
                {flashing.has(t.device.id) && (
                  <rect
                    x={x - 1}
                    y={0}
                    width={TICK_W + 2}
                    height={HEIGHT}
                    className={`tick-flash pointer-events-none ${FILL_CLASS[t.status]}`}
                    aria-hidden="true"
                  />
                )}
                {isActive && (
                  <rect
                    x={x - 2}
                    y={Math.max(0, HEIGHT - h - 2)}
                    width={TICK_W + 4}
                    height={Math.min(HEIGHT, h + 4)}
                    fill="none"
                    stroke="var(--series-1)"
                    strokeWidth={1.5}
                    className="pointer-events-none"
                    aria-hidden="true"
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Hover or keyboard focus reveals which device a tick is. */}
      <p className="mt-1.5 flex h-5 items-baseline justify-between gap-4 text-xs" aria-live="polite">
        <span className="truncate text-text-secondary">
          {active
            ? `${active.device.name} · ${DEVICE_STATUS_LABELS[active.status]} · last reported ${relativeAge(now, active.lastSeen)}`
            : ''}
        </span>
        {truncated && (
          <span className="tnums shrink-0 font-data text-text-muted">
            Showing {visible.length} of {ticks.length} devices
          </span>
        )}
      </p>
    </section>
  )
}
