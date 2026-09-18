/**
 * UptimeTimeline — one row per site, the site's status over the last 24h as
 * horizontal segments. A bucket's status is the worst status shared by at
 * least two of the site's devices: a single faulty device is already visible
 * in the Fleet Pulse, the grid and the drawer, while a site row should show
 * site-wide conditions. (Verified against the seeded fleet: worst-of-1 pins
 * five of six sites at critical for all 48 buckets — zero time information;
 * the two-device floor surfaces episodes, flicker and recovery.)
 *
 * Rule notes: segment ends are rounded 4px with a 2px surface gap between
 * adjacent fills (rule 4); every segment has a tooltip, reachable by mouse
 * and by keyboard (one tab stop, arrow keys move the cursor — rule 6); the
 * status legend is icon + label + colour (rules 7/8); the grid and time axis
 * stay recessive (rule 5); the table view lists the same 48 × sites grid of
 * statuses (rule 9).
 */

import { useMemo, useState } from 'react'
import {
  DEVICE_STATUS_LABELS,
  SITES,
  type Device,
  type DeviceStatus,
} from '../../data'
import ChartCard from './ChartCard'
import StatusBadge from '../StatusBadge'
import {
  bucketWindow,
  statusAt,
  tickTime,
  timeTickCount,
  timeTicks,
  useContainerWidth,
} from './chartUtils'

/** A status must be shared by this many devices at a site to set its row. */
const MIN_DEVICES_PER_STATUS = 2

const ROW_H = 18
const ROW_GAP = 10
const MARGIN_TOP = 4
const MARGIN_BOTTOM = 22
const LABEL_W = 118

const STATUS_FILL: Record<DeviceStatus, string> = {
  critical: 'var(--status-critical)',
  serious: 'var(--status-serious)',
  warning: 'var(--status-warning)',
  offline: 'var(--status-offline)',
  good: 'var(--status-good)',
}

interface Segment {
  status: DeviceStatus
  /** Inclusive bucket range. */
  from: number
  to: number
}

interface Row {
  siteId: string
  name: string
  segments: Segment[]
}

interface UptimeTimelineProps {
  devices: Device[]
  now: number
}

export default function UptimeTimeline({ devices, now }: UptimeTimelineProps) {
  const [containerRef, width] = useContainerWidth<HTMLDivElement>()
  const [cursor, setCursor] = useState<{ row: number; seg: number } | null>(null)

  const win = useMemo(() => bucketWindow(now), [now])

  const rows = useMemo<Row[]>(() => {
    const bySite = new Map<string, Device[]>()
    for (const device of devices) {
      const list = bySite.get(device.siteId)
      if (list) list.push(device)
      else bySite.set(device.siteId, [device])
    }

    return SITES.filter((site) => (bySite.get(site.id)?.length ?? 0) > 0).map((site) => {
      const group = bySite.get(site.id) ?? []
      // Worst status shared by >= MIN_DEVICES_PER_STATUS devices per bucket;
      // merge equal neighbours into segments.
      const segments: Segment[] = []
      for (let b = 0; b < win.edges.length - 1; b += 1) {
        const t = win.edges[b + 1]
        const counts = new Map<DeviceStatus, number>()
        for (const device of group) {
          const s = statusAt(device, t)
          counts.set(s, (counts.get(s) ?? 0) + 1)
        }
        let worst: DeviceStatus = 'good'
        for (const s of ['critical', 'serious', 'warning', 'offline'] as const) {
          if ((counts.get(s) ?? 0) >= MIN_DEVICES_PER_STATUS) {
            worst = s
            break
          }
        }
        const last = segments[segments.length - 1]
        if (last && last.status === worst) last.to = b
        else segments.push({ status: worst, from: b, to: b })
      }
      return { siteId: site.id, name: site.name, segments }
    })
  }, [devices, win])

  const presentStatuses = useMemo(() => {
    const seen = new Set<DeviceStatus>()
    for (const row of rows) for (const seg of row.segments) seen.add(seg.status)
    return (['critical', 'serious', 'warning', 'offline', 'good'] as const).filter((s) =>
      seen.has(s),
    )
  }, [rows])

  const plotW = Math.max(1, width - LABEL_W)
  const bucketW = plotW / (win.edges.length - 1)
  const height = MARGIN_TOP + rows.length * (ROW_H + ROW_GAP) - ROW_GAP + MARGIN_BOTTOM
  const bucketX = (b: number) => LABEL_W + b * bucketW
  const rowY = (r: number) => MARGIN_TOP + r * (ROW_H + ROW_GAP)

  const xTicks = useMemo(() => timeTicks(win.start, win.end, timeTickCount(plotW)), [win, plotW])

  const active =
    cursor && rows[cursor.row]
      ? { row: rows[cursor.row], seg: rows[cursor.row].segments[cursor.seg] ?? null }
      : null

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (rows.length === 0) return
    const cur = cursor ?? { row: 0, seg: 0 }
    let next: { row: number; seg: number } | null = null
    if (event.key === 'ArrowRight') {
      const max = rows[cur.row].segments.length - 1
      next = { row: cur.row, seg: Math.min(max, cur.seg + 1) }
    } else if (event.key === 'ArrowLeft') {
      next = { row: cur.row, seg: Math.max(0, cur.seg - 1) }
    } else if (event.key === 'ArrowDown') {
      next = { row: Math.min(rows.length - 1, cur.row + 1), seg: cur.seg }
    } else if (event.key === 'ArrowUp') {
      next = { row: Math.max(0, cur.row - 1), seg: cur.seg }
    } else if (event.key === 'Home') {
      next = { row: 0, seg: 0 }
    } else if (event.key === 'End') {
      next = { row: rows.length - 1, seg: rows[rows.length - 1].segments.length - 1 }
    }
    if (next) {
      event.preventDefault()
      // Clamp the segment index into the target row.
      next.seg = Math.min(next.seg, rows[next.row].segments.length - 1)
      setCursor(next)
    }
  }

  const tableRows = useMemo(
    () =>
      win.edges.slice(1).map((t, b) => [
        tickTime(t),
        ...rows.map((row) => {
          const seg = row.segments.find((s) => b >= s.from && b <= s.to)
          return seg ? DEVICE_STATUS_LABELS[seg.status] : '—'
        }),
      ]),
    [win, rows],
  )

  return (
    <ChartCard
      title="Site status — last 24 hours"
      subtitle="Worst status shared by 2+ devices at a site, per 30-minute bucket"
      columns={[{ label: 'Time' }, ...rows.map((r) => ({ label: r.name }))]}
      rows={tableRows}
      tableCaption="Worst status per site per 30-minute bucket, last 24 hours"
      empty={rows.length === 0}
      emptyMessage="No devices match the current filters."
    >
      {/* Status legend: icon + label + colour, worst first (rules 7/8). */}
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Status legend">
        {presentStatuses.map((s) => (
          <li key={s}>
            <StatusBadge status={s} />
          </li>
        ))}
      </ul>

      <div
        ref={containerRef}
        className="relative rounded-sm"
        tabIndex={0}
        role="figure"
        aria-label="Site status timeline, one row per site over the last 24 hours. Use the arrow keys to move between status segments."
        onKeyDown={onKeyDown}
        onBlur={() => setCursor(null)}
      >
        {width > 0 && (
          <svg width={width} height={height} className="block" role="presentation">
            {rows.map((row, r) => (
              <g key={row.siteId}>
                <text
                  x={LABEL_W - 8}
                  y={rowY(r) + ROW_H / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={12}
                  fill="var(--text-secondary)"
                >
                  {row.name}
                </text>
                {row.segments.map((seg, si) => {
                  // 2px surface gap between adjacent fills: inset 1px each side.
                  const sx = bucketX(seg.from) + 1
                  const sw = Math.max(1, (seg.to - seg.from + 1) * bucketW - 2)
                  const isActive =
                    cursor !== null && cursor.row === r && cursor.seg === si
                  return (
                    <g key={`${seg.from}-${seg.to}`}>
                      <rect
                        x={sx}
                        y={rowY(r)}
                        width={sw}
                        height={ROW_H}
                        rx={4}
                        fill={STATUS_FILL[seg.status]}
                        onMouseEnter={() => setCursor({ row: r, seg: si })}
                        onMouseLeave={() => setCursor(null)}
                      >
                        <title>
                          {`${row.name} — ${DEVICE_STATUS_LABELS[seg.status]}, ${tickTime(win.edges[seg.from])} to ${tickTime(win.edges[seg.to + 1])}`}
                        </title>
                      </rect>
                      {isActive && (
                        <rect
                          x={sx - 1.5}
                          y={rowY(r) - 1.5}
                          width={sw + 3}
                          height={ROW_H + 3}
                          rx={5}
                          fill="none"
                          stroke="var(--text-primary)"
                          strokeWidth={1.5}
                          className="pointer-events-none"
                        />
                      )}
                    </g>
                  )
                })}
                {/* Hairline separator between rows keeps the grid recessive. */}
                {r < rows.length - 1 && (
                  <line
                    x1={0}
                    x2={width}
                    y1={rowY(r) + ROW_H + ROW_GAP / 2}
                    y2={rowY(r) + ROW_H + ROW_GAP / 2}
                    stroke="var(--gridline)"
                    strokeWidth={1}
                  />
                )}
              </g>
            ))}
            {/* Shared time axis (five ticks across 24h). */}
            {xTicks.map((tick, i) => (
              <text
                key={tick}
                x={bucketX(((tick - win.start) / (win.end - win.start)) * (win.edges.length - 1))}
                y={height - 6}
                textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
                fontSize={11}
                fill="var(--text-muted)"
                className="font-data"
              >
                {tickTime(tick)}
              </text>
            ))}
          </svg>
        )}

        {active?.seg && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-[115%] rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs shadow-lg"
            style={{
              left: Math.min(
                Math.max(bucketX(active.seg.from) + ((active.seg.to - active.seg.from + 1) * bucketW) / 2, 80),
                Math.max(80, width - 80),
              ),
              top: rowY(cursor?.row ?? 0),
            }}
            aria-hidden="true"
          >
            <span className="whitespace-nowrap text-text-secondary">
              {active.row.name}{' '}
              <span className="text-text-primary">
                {DEVICE_STATUS_LABELS[active.seg.status]}
              </span>{' '}
              <span className="tnums font-data text-text-muted">
                {tickTime(win.edges[active.seg.from])}–{tickTime(win.edges[active.seg.to + 1])}
              </span>
            </span>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {active?.seg
          ? `${active.row.name}, ${DEVICE_STATUS_LABELS[active.seg.status]}, ${tickTime(win.edges[active.seg.from])} to ${tickTime(win.edges[active.seg.to + 1])}`
          : ''}
      </p>
    </ChartCard>
  )
}
