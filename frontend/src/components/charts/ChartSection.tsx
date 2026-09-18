/**
 * ChartSection — composes the three fleet-level charts (BRIEF §4):
 * site status timeline, fleet-wide metric line, and status distribution.
 * The per-device sparkline lives in the device drawer instead.
 *
 * Charts receive the filtered fleet so they compose with the page filters;
 * every entity → colour mapping is fixed, so filtering can never reassign a
 * series colour (rule 2).
 */

import type { Device } from '../../data'
import MetricLine from './MetricLine'
import StatusDistribution from './StatusDistribution'
import UptimeTimeline from './UptimeTimeline'

interface ChartSectionProps {
  devices: Device[]
  now: number
}

export default function ChartSection({ devices, now }: ChartSectionProps) {
  return (
    <section aria-labelledby="charts-heading" className="space-y-4">
      <h2
        id="charts-heading"
        className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted"
      >
        Charts
      </h2>

      <UptimeTimeline devices={devices} now={now} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MetricLine devices={devices} now={now} />
        </div>
        <div className="lg:col-span-2">
          <StatusDistribution devices={devices} now={now} />
        </div>
      </div>
    </section>
  )
}
