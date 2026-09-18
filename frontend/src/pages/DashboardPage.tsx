/**
 * Dashboard page (T3) — Fleet Pulse hero, KPI tiles, filters, pre-defined
 * queries, device grid, device drawer. Read-only throughout: the only inputs
 * are selects, pre-defined queries and navigation (BRIEF §1).
 */

import { useMemo, useState } from 'react'
import {
  deriveStatus,
  latestReading,
  QUERIES,
  useLiveFeed,
} from '../data'
import DeviceDrawer from '../components/DeviceDrawer'
import DeviceGrid from '../components/DeviceGrid'
import FilterBar, { EMPTY_FILTERS, type FilterState } from '../components/FilterBar'
import FleetPulse from '../components/FleetPulse'
import KpiRow from '../components/KpiRow'
import QueryPanel from '../components/QueryPanel'
import ChartSection from '../components/charts/ChartSection'
import useDocumentTitle from '../useDocumentTitle'

export default function DashboardPage() {
  useDocumentTitle('Fleet status')
  const { fleet, lastUpdated } = useLiveFeed()
  const now = lastUpdated

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [queryId, setQueryId] = useState<string | null>(null)
  const [drawerDeviceId, setDrawerDeviceId] = useState<string | null>(null)

  const activeQuery = useMemo(
    () => QUERIES.find((q) => q.id === queryId) ?? null,
    [queryId],
  )

  // Filters compose (AND): site, kind, status, and the selected query.
  const filtered = useMemo(
    () =>
      fleet.filter((device) => {
        if (filters.siteId && device.siteId !== filters.siteId) return false
        if (filters.kind && device.kind !== filters.kind) return false
        if (filters.status) {
          const status = deriveStatus(device, latestReading(device), now)
          if (status !== filters.status) return false
        }
        if (activeQuery && !activeQuery.predicate(device, now)) return false
        return true
      }),
    [fleet, filters, activeQuery, now],
  )

  // Live match counts shown beside each query label.
  const queryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const query of QUERIES) {
      counts.set(query.id, fleet.filter((d) => query.predicate(d, now)).length)
    }
    return counts
  }, [fleet, now])

  const anyFilterActive =
    filters.siteId !== '' || filters.kind !== '' || filters.status !== '' || queryId !== null

  function clearAll() {
    setFilters(EMPTY_FILTERS)
    setQueryId(null)
  }

  const drawerDevice = drawerDeviceId
    ? fleet.find((d) => d.id === drawerDeviceId) ?? null
    : null

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Fleet status</h1>

      <FleetPulse fleet={fleet} now={now} onSelect={setDrawerDeviceId} />

      <KpiRow fleet={fleet} now={now} />

      <FilterBar
        filters={filters}
        anyActive={anyFilterActive}
        onChange={setFilters}
        onClear={clearAll}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        <QueryPanel selectedId={queryId} counts={queryCounts} onSelect={setQueryId} />

        <section aria-labelledby="devices-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id="devices-heading"
              className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted"
            >
              Devices
            </h2>
            <p className="tnums font-data text-xs text-text-muted">
              {filtered.length} of {fleet.length}
            </p>
          </div>
          <div className="mt-2">
            <DeviceGrid
              devices={filtered}
              now={now}
              totalFleet={fleet.length}
              anyFilterActive={anyFilterActive}
              onClearFilters={clearAll}
              onSelect={setDrawerDeviceId}
            />
          </div>
        </section>
      </div>

      <ChartSection devices={filtered} now={now} />

      {drawerDevice && (
        <DeviceDrawer
          device={drawerDevice}
          now={now}
          onClose={() => setDrawerDeviceId(null)}
        />
      )}
    </div>
  )
}
