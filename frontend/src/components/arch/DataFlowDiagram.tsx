/**
 * Data flow — a reading's journey from device to screen (the process view in
 * docs/04-architecture.md). The one-way nature is the point: a solid spine
 * carries data rightwards, and where a return path would sit there is a
 * dashed, crossed-out line. Latency annotations are the NFR-1 budget:
 * ~900 ms of work against a 5 s allowance.
 */

import { Arrow, DBox, DiagramFrame, DLabel } from './svg'

const STAGES: { label: string; sub: string }[] = [
  { label: 'Device', sub: 'in the field' },
  { label: 'Gateway', sub: 'MQTT/TLS' },
  { label: 'Stream', sub: 'Kafka' },
  { label: 'Processor', sub: 'derive status' },
  { label: 'State store', sub: 'Redis' },
  { label: 'Push service', sub: 'notify' },
  { label: 'Dashboard', sub: 'React SPA' },
]

/** Arrow captions between stages: the verb, and its share of the NFR-1 budget. */
const HOPS: { verb: string; ms: string }[] = [
  { verb: 'publish', ms: '200 ms' },
  { verb: 'commit', ms: '100 ms' },
  { verb: 'consume', ms: '300 ms' },
  { verb: 'write', ms: '' },
  { verb: 'notify', ms: '200 ms' },
  { verb: 'SSE', ms: '100 ms' },
]

const W = 112
const GAP = 52
const X0 = 20
const Y = 60
const H = 54
const PITCH = W + GAP

export const DATA_FLOW_WIDTH = X0 * 2 + STAGES.length * W + (STAGES.length - 1) * GAP
export const DATA_FLOW_HEIGHT = 252

export default function DataFlowDiagram() {
  const spineY = Y + H + 66
  const spineX0 = X0 + 4
  const spineX1 = DATA_FLOW_WIDTH - X0 - 4

  return (
    <DiagramFrame
      title="Data flow — read-only and stateless, device to screen"
      description="A reading travels one way: the device publishes to the gateway, the gateway commits to the stream, the processor consumes and derives status, writes the current state store, the push service notifies the dashboard over SSE. About 900 milliseconds of work against the 5 second NFR-1 budget. No path runs back: the dashboard never writes."
      width={DATA_FLOW_WIDTH}
      height={DATA_FLOW_HEIGHT}
    >
      {STAGES.map((stage, i) => (
        <DBox
          key={stage.label}
          x={X0 + i * PITCH}
          y={Y}
          w={W}
          h={H}
          label={stage.label}
          sub={stage.sub}
          accent={i === STAGES.length - 1}
        />
      ))}

      {HOPS.map((hop, i) => {
        const x1 = X0 + i * PITCH + W
        const x2 = X0 + (i + 1) * PITCH
        const y = Y + H / 2
        return (
          <g key={hop.verb}>
            <Arrow x1={x1 + 4} y1={y} x2={x2 - 4} y2={y} />
            <DLabel x={(x1 + x2) / 2} y={y - 12} lines={[hop.verb]} mono />
            {hop.ms && <DLabel x={(x1 + x2) / 2} y={y + 18} lines={[hop.ms]} mono />}
          </g>
        )
      })}

      {/* The one-way spine: data only ever moves this way. */}
      <line
        x1={spineX0}
        y1={spineY}
        x2={spineX1 - 10}
        y2={spineY}
        strokeWidth={2}
        className="stroke-text-secondary"
      />
      <polygon
        points="0,0 -12,-5 -12,5"
        transform={`translate(${spineX1} ${spineY})`}
        className="fill-text-secondary"
      />
      <DLabel
        x={(spineX0 + spineX1) / 2}
        y={spineY - 12}
        lines={['one way only — read-only, stateless']}
      />

      {/* The return path that does not exist. */}
      <line
        x1={spineX1 - 10}
        y1={spineY + 34}
        x2={spineX0 + 10}
        y2={spineY + 34}
        strokeWidth={1}
        strokeDasharray="4 4"
        className="stroke-gridline"
      />
      <text
        x={(spineX0 + spineX1) / 2 - 118}
        y={spineY + 34}
        dominantBaseline="central"
        className="fill-text-muted font-sans text-[11px]"
      >
        ✕
      </text>
      <DLabel
        x={(spineX0 + spineX1) / 2 + 4}
        y={spineY + 30}
        lines={['no write path exists — the UI never sends anything back']}
      />

      <DLabel
        x={(spineX0 + spineX1) / 2}
        y={DATA_FLOW_HEIGHT - 10}
        lines={['≈ 900 ms of work inside the 5 s NFR-1 budget — the rest is headroom for network variance and retry.']}
        mono
      />
    </DiagramFrame>
  )
}
