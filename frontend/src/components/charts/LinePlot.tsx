/**
 * LinePlot — the shared engine behind Sparkline and MetricLine.
 *
 * BRIEF §4 rules exercised here:
 *  - single y scale only (rule 1: two scales would become two LinePlots)
 *  - 2px lines; hover markers are 12px across with a 2px surface ring (rule 4)
 *  - recessive grid: hairline --gridline, labels in --text-muted (rule 5)
 *  - mandatory hover layer: crosshair + tooltip, mirrored to the keyboard
 *    with arrow keys (rule 6)
 *  - legend whenever there are two or more series; series are also
 *    direct-labelled at the line end when asked (rule 7)
 *  - text wears text tokens; a coloured swatch sits beside each label (rule 8)
 *  - numbers are never printed on every point — only at line ends (rule 10)
 *
 * Colours arrive as CSS variable references from the caller, which owns the
 * fixed entity → series-token assignment (rule 2). Nothing here cycles or
 * reassigns colours.
 */

import { useMemo, useState } from 'react'
import { niceTicks, tickTime, timeTickCount, timeTicks, useContainerWidth } from './chartUtils'

export interface LinePoint {
  t: number
  v: number
}

export interface LineSeries {
  id: string
  label: string
  /** CSS variable reference, e.g. 'var(--series-1)'. */
  colour: string
  points: LinePoint[]
}

interface LinePlotProps {
  series: LineSeries[]
  xDomain: [number, number]
  yDomain: [number, number]
  /** Axis tick formatting (short). */
  formatY: (v: number) => string
  /** Tooltip/end-label formatting (full). */
  formatValue: (v: number) => string
  height?: number
  ariaLabel: string
  /** Direct-label each series at its line end (rule 7). */
  directLabels?: boolean
  /** Approximate bucket size on the x axis; points farther than this from the
   * hover position read as missing. */
  snapToleranceMs: number
}

const MARGIN_TOP = 10
const MARGIN_BOTTOM = 22
const MARGIN_LEFT = 40
const MARGIN_RIGHT_PLAIN = 12
/** Min vertical gap between direct labels at the line ends. */
const LABEL_MIN_GAP = 14
/** Approximate width of an 11px IBM Plex Mono character. */
const CHAR_W = 6.6

export default function LinePlot({
  series,
  xDomain,
  yDomain,
  formatY,
  formatValue,
  height = 200,
  ariaLabel,
  directLabels = false,
  snapToleranceMs,
}: LinePlotProps) {
  const [containerRef, width] = useContainerWidth<HTMLDivElement>()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // The union of all timestamps, sorted — the hover snaps to these.
  const timeline = useMemo(() => {
    const set = new Set<number>()
    for (const s of series) for (const p of s.points) set.add(p.t)
    return Array.from(set).sort((a, b) => a - b)
  }, [series])

  // Right margin fits the longest direct label ("Cameras · 100 %").
  const marginRight = useMemo(() => {
    if (!directLabels) return MARGIN_RIGHT_PLAIN
    let longest = 0
    for (const s of series) {
      const last = s.points[s.points.length - 1]
      const text = `${s.label} · ${last ? formatValue(last.v) : '—'}`
      longest = Math.max(longest, text.length)
    }
    return Math.ceil(longest * CHAR_W) + 26
  }, [directLabels, series, formatValue])

  const [x0, x1] = xDomain
  const [y0, y1] = yDomain
  const plotW = Math.max(1, width - MARGIN_LEFT - marginRight)
  const plotH = Math.max(1, height - MARGIN_TOP - MARGIN_BOTTOM)
  const x = (t: number) => MARGIN_LEFT + ((t - x0) / (x1 - x0)) * plotW
  const y = (v: number) => MARGIN_TOP + (1 - (v - y0) / (y1 - y0)) * plotH

  const yTicks = useMemo(() => niceTicks(y0, y1, 4), [y0, y1])
  const xTicks = useMemo(() => timeTicks(x0, x1, timeTickCount(plotW)), [x0, x1, plotW])

  // Nearest point of a series to time `t`, or null when out of tolerance.
  function nearestPoint(s: LineSeries, t: number): LinePoint | null {
    const pts = s.points
    if (pts.length === 0) return null
    let lo = 0
    let hi = pts.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (pts[mid].t < t) lo = mid + 1
      else hi = mid
    }
    let best = pts[lo]
    if (lo > 0 && Math.abs(pts[lo - 1].t - t) < Math.abs(best.t - t)) best = pts[lo - 1]
    return Math.abs(best.t - t) <= snapToleranceMs ? best : null
  }

  const hoverT = hoverIndex !== null ? timeline[hoverIndex] : null
  const hoverX = hoverT !== null ? x(hoverT) : null

  function indexAt(pixelX: number): number {
    if (timeline.length === 0) return 0
    const t = x0 + ((pixelX - MARGIN_LEFT) / plotW) * (x1 - x0)
    // Binary search for nearest timeline entry.
    let lo = 0
    let hi = timeline.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (timeline[mid] < t) lo = mid + 1
      else hi = mid
    }
    if (lo > 0 && Math.abs(timeline[lo - 1] - t) < Math.abs(timeline[lo] - t)) return lo - 1
    return lo
  }

  function onPointerMove(event: React.PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
    if (!rect) return
    setHoverIndex(indexAt(event.clientX - rect.left))
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (timeline.length === 0) return
    const current = hoverIndex ?? timeline.length - 1
    let next: number | null = null
    if (event.key === 'ArrowLeft') next = Math.max(0, current - 1)
    else if (event.key === 'ArrowRight') next = Math.min(timeline.length - 1, current + 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = timeline.length - 1
    if (next !== null) {
      event.preventDefault()
      setHoverIndex(next)
    }
  }

  // Direct labels: last point per series, nudged apart so they never collide.
  const endLabels = useMemo(() => {
    if (!directLabels) return []
    const labels = series
      .map((s) => {
        const last = s.points[s.points.length - 1]
        if (!last) return null
        return { series: s, last, y: y(last.v) }
      })
      .filter((l): l is { series: LineSeries; last: LinePoint; y: number } => l !== null)
      .sort((a, b) => a.y - b.y)
    for (let i = 1; i < labels.length; i += 1) {
      if (labels[i].y - labels[i - 1].y < LABEL_MIN_GAP) {
        labels[i].y = labels[i - 1].y + LABEL_MIN_GAP
      }
    }
    // Clamp the whole stack inside the plot area.
    const overflow = labels.length > 0 ? labels[labels.length - 1].y - (MARGIN_TOP + plotH) : 0
    if (overflow > 0) for (const l of labels) l.y -= overflow
    const underflow = labels.length > 0 ? MARGIN_TOP - labels[0].y : 0
    if (underflow > 0) for (const l of labels) l.y += underflow
    return labels
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directLabels, series, plotW, plotH, y0, y1])

  // Tooltip rows for the hovered timestamp.
  const hoverRows =
    hoverT !== null
      ? series.map((s) => ({ series: s, point: nearestPoint(s, hoverT) }))
      : []

  const tooltipLeft =
    hoverX !== null ? Math.min(Math.max(hoverX, 76), Math.max(76, width - 76)) : 0

  return (
    <div>
      {series.length >= 2 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Series legend">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span
                aria-hidden="true"
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ backgroundColor: s.colour }}
              />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      <div ref={containerRef} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            className="block"
            role="img"
            aria-label={ariaLabel}
          >
            {/* Recessive horizontal grid + y labels (rule 5). */}
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN_LEFT}
                  x2={MARGIN_LEFT + plotW}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--gridline)"
                  strokeWidth={1}
                />
                <text
                  x={MARGIN_LEFT - 6}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="var(--text-muted)"
                  className="font-data"
                >
                  {formatY(tick)}
                </text>
              </g>
            ))}
            {/* Baseline. */}
            <line
              x1={MARGIN_LEFT}
              x2={MARGIN_LEFT + plotW}
              y1={MARGIN_TOP + plotH}
              y2={MARGIN_TOP + plotH}
              stroke="var(--baseline)"
              strokeWidth={1}
            />
            {/* Time axis ticks (selective: five across 24h). */}
            {xTicks.map((tick, i) => (
              <text
                key={tick}
                x={x(tick)}
                y={height - 6}
                textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
                fontSize={11}
                fill="var(--text-muted)"
                className="font-data"
              >
                {tickTime(tick)}
              </text>
            ))}

            {/* Series lines: 2px, fixed colours from the caller. */}
            {series.map((s) => {
              if (s.points.length === 0) return null
              const d = s.points
                .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(2)},${y(p.v).toFixed(2)}`)
                .join(' ')
              return (
                <path
                  key={s.id}
                  d={d}
                  fill="none"
                  stroke={s.colour}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )
            })}

            {/* Direct labels at line ends (rule 7): swatch + text-token text. */}
            {endLabels.map(({ series: s, last, y: labelY }) => (
              <g key={`label-${s.id}`}>
                <line
                  x1={MARGIN_LEFT + plotW + 4}
                  x2={MARGIN_LEFT + plotW + 10}
                  y1={labelY}
                  y2={labelY}
                  stroke={s.colour}
                  strokeWidth={2}
                />
                <text
                  x={MARGIN_LEFT + plotW + 14}
                  y={labelY}
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="var(--text-secondary)"
                  className="font-data"
                >
                  {`${s.label} · ${formatValue(last.v)}`}
                </text>
              </g>
            ))}

            {/* Hover layer: crosshair + ringed markers (rules 4 & 6). */}
            {hoverX !== null && (
              <g className="pointer-events-none">
                <line
                  x1={hoverX}
                  x2={hoverX}
                  y1={MARGIN_TOP}
                  y2={MARGIN_TOP + plotH}
                  stroke="var(--baseline)"
                  strokeWidth={1}
                />
                {hoverRows.map(
                  ({ series: s, point }) =>
                    point && (
                      <circle
                        key={s.id}
                        cx={x(point.t)}
                        cy={y(point.v)}
                        r={5}
                        fill={s.colour}
                        stroke="var(--surface-1)"
                        strokeWidth={2}
                      />
                    ),
                )}
              </g>
            )}

            {/* Pointer capture. */}
            <rect
              x={MARGIN_LEFT}
              y={MARGIN_TOP}
              width={plotW}
              height={plotH}
              fill="transparent"
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHoverIndex(null)}
            />
          </svg>
        )}

        {/* Keyboard access to the same hover layer. */}
        <div
          tabIndex={0}
          role="figure"
          aria-label={`${ariaLabel} Use the left and right arrow keys to move through time.`}
          onFocus={() => setHoverIndex(timeline.length > 0 ? timeline.length - 1 : null)}
          onBlur={() => setHoverIndex(null)}
          onKeyDown={onKeyDown}
          className="pointer-events-none absolute inset-0 rounded-sm"
        />

        {/* Tooltip: swatch carries colour, text stays on text tokens (rule 8). */}
        {hoverT !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs shadow-lg"
            style={{ left: tooltipLeft }}
            aria-hidden="true"
          >
            <p className="tnums font-data text-text-muted">{tickTime(hoverT)}</p>
            <ul className="mt-1 space-y-0.5">
              {hoverRows.map(({ series: s, point }) => (
                <li key={s.id} className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: s.colour }}
                  />
                  <span className="text-text-secondary">{s.label}</span>
                  <span className="tnums ml-auto pl-3 font-data text-text-primary">
                    {point ? formatValue(point.v) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Screen-reader mirror of the hover layer. */}
      <p className="sr-only" aria-live="polite">
        {hoverT !== null
          ? `${tickTime(hoverT)}: ${hoverRows
              .map(({ series: s, point }) => `${s.label} ${point ? formatValue(point.v) : 'no data'}`)
              .join(', ')}`
          : ''}
      </p>
    </div>
  )
}
