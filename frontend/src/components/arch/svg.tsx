/**
 * Shared SVG diagram primitives for the architecture page.
 *
 * Colour comes only from Tailwind classes bound to the CSS custom property
 * tokens (BRIEF §3) — no hex values here. Status tokens are deliberately
 * unused: nothing in these diagrams is a device status, so neutral diagram
 * elements wear surface/text/series tokens only.
 *
 * Diagrams render at a fixed pixel width inside a horizontally scrolling
 * frame, so text never shrinks below legibility on narrow screens (BRIEF §7).
 */

import { useId, type ReactNode } from 'react'

interface DiagramFrameProps {
  /** Accessible name for the diagram. */
  title: string
  /** Longer accessible description. */
  description: string
  width: number
  height: number
  children: ReactNode
}

export function DiagramFrame({ title, description, width, height, children }: DiagramFrameProps) {
  const titleId = useId()
  const descId = useId()
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface-1 p-4">
      <svg
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
      >
        <title id={titleId}>{title}</title>
        <desc id={descId}>{description}</desc>
        {children}
      </svg>
    </div>
  )
}

interface DBoxProps {
  x: number
  y: number
  w: number
  h: number
  label: string
  /** Secondary line, set in the mono data face — usually the technology. */
  sub?: string
  /** Accent stroke (series-1) for the box the reader should find first. */
  accent?: boolean
}

/** A C4 node: rounded rect, centred label, optional technology sub-label. */
export function DBox({ x, y, w, h, label, sub, accent = false }: DBoxProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        strokeWidth={accent ? 1.5 : 1}
        className={`fill-surface-2 ${accent ? 'stroke-series-1' : 'stroke-border'}`}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 3 : y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-text-primary font-sans text-[12px] font-medium"
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 12}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-text-muted font-data text-[10px]"
        >
          {sub}
        </text>
      )}
    </g>
  )
}

/** A dashed system boundary with a small caps label in the top-left corner. */
export function Boundary({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label: string }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        strokeDasharray="6 4"
        className="fill-none stroke-gridline"
      />
      <text
        x={x + 12}
        y={y + 14}
        dominantBaseline="central"
        className="fill-text-muted font-display text-[10px] font-semibold uppercase tracking-wider"
      >
        {label}
      </text>
    </g>
  )
}

interface ArrowProps {
  x1: number
  y1: number
  x2: number
  y2: number
  dashed?: boolean
}

/** A one-way arrow: shaft plus an explicit triangular head (no markers, so
 *  nothing depends on per-SVG ids). Arrows in these diagrams always point in
 *  the direction data actually flows. */
export function Arrow({ x1, y1, x2, y2, dashed = false }: ArrowProps) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 1) return null
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  // Stop the shaft just short of the tip so the head sits cleanly on it.
  const ex = x2 - ux * 8
  const ey = y2 - uy * 8
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={ex}
        y2={ey}
        strokeWidth={1.5}
        strokeDasharray={dashed ? '4 3' : undefined}
        className="stroke-text-muted"
      />
      <polygon
        points="0,0 -9,-4 -9,4"
        transform={`translate(${x2} ${y2}) rotate(${angle})`}
        className="fill-text-muted"
      />
    </g>
  )
}

interface DLabelProps {
  x: number
  y: number
  lines: string[]
  anchor?: 'start' | 'middle' | 'end'
  /** Mono face for protocol / latency annotations. */
  mono?: boolean
}

/** Small multi-line annotation text, one tspan per line. */
export function DLabel({ x, y, lines, anchor = 'middle', mono = false }: DLabelProps) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      className={`fill-text-muted text-[10px] ${mono ? 'font-data' : 'font-sans'}`}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  )
}
