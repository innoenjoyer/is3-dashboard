/**
 * KpiRow — four stat tiles over the whole fleet (unfiltered):
 * total devices, reporting, needs attention, offline.
 * Numbers use the mono data face with tabular-nums (BRIEF §3).
 */

import { useMemo } from 'react'
import { deriveStatus, latestReading, type Device } from '../data'

interface Kpi {
  label: string
  value: number
  hint: string
}

export default function KpiRow({ fleet, now }: { fleet: Device[]; now: number }) {
  const kpis = useMemo<Kpi[]>(() => {
    let reporting = 0
    let attention = 0
    let offline = 0
    for (const device of fleet) {
      const status = deriveStatus(device, latestReading(device), now)
      if (status === 'offline') offline += 1
      else {
        reporting += 1
        if (status !== 'good') attention += 1
      }
    }
    return [
      { label: 'Total devices', value: fleet.length, hint: 'registered' },
      { label: 'Reporting', value: reporting, hint: 'heard from recently' },
      { label: 'Needs attention', value: attention, hint: 'warning or worse' },
      { label: 'Offline', value: offline, hint: 'stopped reporting' },
    ]
  }, [fleet, now])

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Fleet summary">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-md border border-border bg-surface-1 px-4 py-3"
        >
          <dt className="font-display text-xs font-semibold uppercase tracking-wider text-text-muted">
            {kpi.label}
          </dt>
          <dd className="tnums mt-1 font-data text-3xl font-medium text-text-primary">
            {kpi.value}
          </dd>
          <dd className="mt-0.5 text-xs text-text-muted">{kpi.hint}</dd>
        </div>
      ))}
    </dl>
  )
}
