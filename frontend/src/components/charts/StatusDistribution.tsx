/**
 * StatusDistribution — the fleet's composition by status right now: one
 * horizontal stacked bar, worst status first (matching the Fleet Pulse
 * ordering). Statuses use the reserved status tokens, and every segment is
 * backed by an icon + label + count legend entry — identity never rests on
 * colour alone (BRIEF §3/§4).
 *
 * Rule notes: segment data-ends are rounded 4px with a 2px surface-coloured
 * gap between adjacent fills (rule 4); each segment has its own hover and
 * keyboard-focus tooltip (rule 6); counts print only on segments wide enough
 * to hold them (rule 10); the table view lists the same numbers (rule 9).
 */

import { useMemo, useState } from 'react'
import {
  DEVICE_STATUS_LABELS,
  deriveStatus,
  latestReading,
  type Device,
  type DeviceStatus,
} from '../../data'
import ChartCard from './ChartCard'
import StatusBadge from '../StatusBadge'
import { useContainerWidth } from './chartUtils'

/** Worst first, matching the Fleet Pulse strip. */
const STATUS_ORDER: readonly DeviceStatus[] = [
  'critical',
  'serious',
  'warning',
  'offline',
  'good',
]

const STATUS_FILL: Record<DeviceStatus, string> = {
  critical: 'var(--status-critical)',
  serious: 'var(--status-serious)',
  warning: 'var(--status-warning)',
  offline: 'var(--status-offline)',
  good: 'var(--status-good)',
}

const BAR_H = 28
/** A count prints inside a segment only when it fits honestly (rule 10). */
const MIN_LABEL_W = 44

interface StatusDistributionProps {
  devices: Device[]
  now: number
}

export default function StatusDistribution({ devices, now }: StatusDistributionProps) {
  const [containerRef, width] = useContainerWidth<HTMLDivElement>()
  const [active, setActive] = useState<DeviceStatus | null>(null)

  const counts = useMemo(() => {
    const map = new Map<DeviceStatus, number>(STATUS_ORDER.map((s) => [s, 0]))
    for (const device of devices) {
      const status = deriveStatus(device, latestReading(device), now)
      map.set(status, (map.get(status) ?? 0) + 1)
    }
    return map
  }, [devices, now])

  const total = devices.length

  const segments = useMemo(() => {
    if (total === 0 || width === 0) return []
    let acc = 0
    return STATUS_ORDER.filter((s) => (counts.get(s) ?? 0) > 0).map((status) => {
      const count = counts.get(status) ?? 0
      const w = (count / total) * width
      // 2px surface gap between adjacent fills: inset 1px each side.
      const seg = {
        status,
        count,
        x: acc + 1,
        w: Math.max(0, w - 2),
        share: (count / total) * 100,
      }
      acc += w
      return seg
    })
  }, [counts, total, width])

  const activeSeg = segments.find((s) => s.status === active) ?? null

  return (
    <ChartCard
      title="Fleet by status"
      subtitle={`${total} devices by current status`}
      columns={[
        { label: 'Status' },
        { label: 'Devices', numeric: true },
        { label: 'Share', numeric: true },
      ]}
      rows={STATUS_ORDER.map((s) => [
        DEVICE_STATUS_LABELS[s],
        String(counts.get(s) ?? 0),
        total > 0 ? `${(((counts.get(s) ?? 0) / total) * 100).toFixed(1)} %` : '—',
      ])}
      tableCaption="Fleet composition by status"
      empty={total === 0}
      emptyMessage="No devices match the current filters."
    >
      <div ref={containerRef} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={BAR_H}
            className="block"
            role="img"
            aria-label={`Fleet by status: ${STATUS_ORDER.map(
              (s) => `${DEVICE_STATUS_LABELS[s]} ${counts.get(s) ?? 0}`,
            ).join(', ')}.`}
          >
            {segments.map((seg) => (
              <g key={seg.status}>
                <rect
                  x={seg.x}
                  y={0}
                  width={seg.w}
                  height={BAR_H}
                  rx={4}
                  fill={STATUS_FILL[seg.status]}
                  tabIndex={0}
                  role="img"
                  aria-label={`${DEVICE_STATUS_LABELS[seg.status]}: ${seg.count} devices, ${seg.share.toFixed(1)} percent`}
                  onMouseEnter={() => setActive(seg.status)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(seg.status)}
                  onBlur={() => setActive(null)}
                >
                  <title>
                    {`${DEVICE_STATUS_LABELS[seg.status]}: ${seg.count} devices (${seg.share.toFixed(1)} %)`}
                  </title>
                </rect>
                {seg.w >= MIN_LABEL_W && (
                  <text
                    x={seg.x + seg.w / 2}
                    y={BAR_H / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill="var(--page-plane)"
                    className="tnums pointer-events-none font-data"
                  >
                    {seg.count}
                  </text>
                )}
              </g>
            ))}
          </svg>
        )}

        {activeSeg && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-[110%] rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs shadow-lg"
            style={{
              left: Math.min(Math.max(activeSeg.x + activeSeg.w / 2, 70), Math.max(70, width - 70)),
            }}
            aria-hidden="true"
          >
            <span className="whitespace-nowrap text-text-secondary">
              {DEVICE_STATUS_LABELS[activeSeg.status]}{' '}
              <span className="tnums font-data text-text-primary">
                {activeSeg.count} · {activeSeg.share.toFixed(1)} %
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Legend: icon + label + colour + count — never colour alone. */}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5" aria-label="Status legend">
        {STATUS_ORDER.map((s) => (
          <li key={s} className="flex items-baseline gap-2">
            <StatusBadge status={s} />
            <span className="tnums font-data text-xs text-text-primary">
              {counts.get(s) ?? 0}
            </span>
            <span className="tnums font-data text-xs text-text-muted">
              {total > 0 ? `${(((counts.get(s) ?? 0) / total) * 100).toFixed(1)} %` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  )
}
