/**
 * Sparkline — one device's primary metric over the last 24 hours, shown in
 * the device drawer. Single series, so no legend box: the card title names
 * the metric (BRIEF §4 rule 7 applies only from two series up). The table
 * toggle lists every plotted point (rule 9).
 *
 * The series colour is always series-1: a single-series chart has a fixed,
 * stable colour that filtering can never reassign (rule 2).
 */

import { useMemo } from 'react'
import type { Device, DeviceKind, Reading } from '../../data'
import ChartCard from './ChartCard'
import LinePlot, { type LineSeries } from './LinePlot'
import { BUCKET_MS, tickTime } from './chartUtils'

interface PrimarySpec {
  label: string
  extract: (reading: Reading) => number
  format: (v: number) => string
}

/** The same "primary metric" the device card leads with (see format.ts). */
const PRIMARY: Record<DeviceKind, PrimarySpec> = {
  camera: {
    label: 'Bitrate',
    extract: (r) => (r.metrics as { bitrateMbps: number }).bitrateMbps,
    format: (v) => `${v.toFixed(1)} Mbps`,
  },
  switch: {
    label: 'Load',
    extract: (r) => (r.metrics as { loadAmps: number }).loadAmps,
    format: (v) => `${v.toFixed(1)} A`,
  },
  fridge: {
    label: 'Temperature',
    extract: (r) => (r.metrics as { temperatureC: number }).temperatureC,
    format: (v) => `${v.toFixed(1)} °C`,
  },
  thermostat: {
    label: 'Actual temperature',
    extract: (r) => (r.metrics as { actualC: number }).actualC,
    format: (v) => `${v.toFixed(1)} °C`,
  },
  intercom: {
    label: 'Signal',
    extract: (r) => (r.metrics as { signalDbm: number }).signalDbm,
    format: (v) => `${v.toFixed(0)} dBm`,
  },
}

interface SparklineProps {
  device: Device
  now: number
}

export default function Sparkline({ device, now }: SparklineProps) {
  const spec = PRIMARY[device.kind]

  const points = useMemo(
    () => device.history.map((r) => ({ t: r.timestamp, v: spec.extract(r) })),
    [device, spec],
  )

  const yDomain = useMemo<[number, number]>(() => {
    if (points.length === 0) return [0, 1]
    let min = Infinity
    let max = -Infinity
    for (const p of points) {
      if (p.v < min) min = p.v
      if (p.v > max) max = p.v
    }
    const pad = (max - min) * 0.12 || Math.max(1, Math.abs(max) * 0.1)
    return [min - pad, max + pad]
  }, [points])

  const latest = points[points.length - 1]
  const series: LineSeries[] = [
    {
      id: device.id,
      label: spec.label,
      colour: 'var(--series-1)',
      points,
    },
  ]

  return (
    <ChartCard
      title={`24 h trend — ${spec.label}`}
      subtitle={latest ? `Latest ${spec.format(latest.v)}` : undefined}
      columns={[{ label: 'Time' }, { label: spec.label, numeric: true }]}
      rows={points.map((p) => [tickTime(p.t), spec.format(p.v)])}
      tableCaption={`${device.name}: ${spec.label.toLowerCase()} readings, last 24 hours`}
      empty={points.length === 0}
      emptyMessage="No reports in the last 24 hours."
    >
      <LinePlot
        series={series}
        xDomain={[now - 24 * 3_600_000, now]}
        yDomain={yDomain}
        formatY={(v) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1))}
        formatValue={spec.format}
        height={140}
        ariaLabel={`${device.name}: ${spec.label.toLowerCase()} over the last 24 hours.`}
        snapToleranceMs={BUCKET_MS}
      />
    </ChartCard>
  )
}
