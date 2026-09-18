/**
 * MetricLine — fleet health over the last 24 hours: the share of each device
 * kind reporting good, sampled every 30 minutes.
 *
 * Why per kind and not per site: the uptime timeline already slices the same
 * 24h window by site, so a per-site line would repeat that cut. Slicing by
 * kind answers the question the timeline cannot — *which device type* is
 * driving the trouble (a technician restocks fridge parts, not "sites").
 *
 * BRIEF §4 rules exercised:
 *  - rule 2: the kind → series-token map is fixed (camera → series-1 …
 *    thermostat → series-4); filtering kinds never reassigns a colour
 *  - rule 3: a fifth kind folds into "Other" (intercoms, the smallest kind),
 *    drawn in muted grey — never a fifth series colour
 *  - rule 7: legend whenever two or more series are shown; when four or
 *    fewer, each line also carries a direct end label
 *  - rules 1, 4, 5, 6, 8, 9, 10 via the shared LinePlot engine and ChartCard
 */

import { useMemo } from 'react'
import type { Device, DeviceKind } from '../../data'
import ChartCard from './ChartCard'
import LinePlot, { type LineSeries } from './LinePlot'
import { bucketWindow, statusAt, tickTime } from './chartUtils'

/** Fixed entity → colour assignment (rule 2). Never reassigned, never cycled. */
const KIND_SERIES: Record<DeviceKind, { colour: string; label: string }> = {
  camera: { colour: 'var(--series-1)', label: 'Cameras' },
  switch: { colour: 'var(--series-2)', label: 'Switches' },
  fridge: { colour: 'var(--series-3)', label: 'Fridges' },
  thermostat: { colour: 'var(--series-4)', label: 'Thermostats' },
  // Max four series colours exist; the fifth kind folds into "Other".
  intercom: { colour: 'var(--text-muted)', label: 'Other (intercoms)' },
}

/** Stable series order, independent of filtering or data. */
const KIND_ORDER: readonly DeviceKind[] = ['camera', 'switch', 'fridge', 'thermostat', 'intercom']

interface MetricLineProps {
  devices: Device[]
  now: number
}

export default function MetricLine({ devices, now }: MetricLineProps) {
  const win = useMemo(() => bucketWindow(now), [now])

  const { series, tableRows } = useMemo(() => {
    const byKind = new Map<DeviceKind, Device[]>()
    for (const device of devices) {
      const list = byKind.get(device.kind)
      if (list) list.push(device)
      else byKind.set(device.kind, [device])
    }

    const present = KIND_ORDER.filter((kind) => (byKind.get(kind)?.length ?? 0) > 0)

    const built: LineSeries[] = present.map((kind) => {
      const group = byKind.get(kind) ?? []
      const points = win.edges.slice(1).map((t) => {
        let good = 0
        for (const device of group) {
          if (statusAt(device, t) === 'good') good += 1
        }
        return { t, v: (good / group.length) * 100 }
      })
      return {
        id: kind,
        label: KIND_SERIES[kind].label,
        colour: KIND_SERIES[kind].colour,
        points,
      }
    })

    const rows = win.edges.slice(1).map((t, i) => [
      tickTime(t),
      ...built.map((s) => `${s.points[i].v.toFixed(0)} %`),
    ])
    return { series: built, tableRows: rows }
  }, [devices, win])

  return (
    <ChartCard
      title="Fleet health by device kind"
      subtitle="Share of each kind reporting good, every 30 minutes, last 24 hours"
      columns={[
        { label: 'Time' },
        ...series.map((s) => ({
          label: `${s.label} (% good)`,
          numeric: true,
        })),
      ]}
      rows={tableRows}
      tableCaption="Share of devices reporting good per kind, every 30 minutes, last 24 hours"
      empty={series.length === 0}
      emptyMessage="No devices match the current filters."
    >
      <LinePlot
        series={series}
        xDomain={[win.start, win.end]}
        yDomain={[0, 100]}
        formatY={(v) => `${Math.round(v)}`}
        formatValue={(v) => `${v.toFixed(0)} %`}
        height={220}
        ariaLabel="Share of devices reporting good per device kind over the last 24 hours."
        directLabels={series.length <= 4}
        snapToleranceMs={31 * 60_000}
      />
    </ChartCard>
  )
}
