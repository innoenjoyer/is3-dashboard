/**
 * FilterBar — site, kind, status. Filters compose (AND). Read-only selects,
 * no free-form input. 'Clear filters' appears only while a filter is active.
 */

import {
  DEVICE_KIND_LABELS,
  DEVICE_STATUS_LABELS,
  SITES,
  type DeviceKind,
  type DeviceStatus,
} from '../data'

export interface FilterState {
  siteId: string
  kind: string
  status: string
}

export const EMPTY_FILTERS: FilterState = { siteId: '', kind: '', status: '' }

const SELECT_CLASS =
  'rounded-md border border-border bg-surface-1 px-2 py-1.5 text-sm text-text-primary'

interface FilterBarProps {
  filters: FilterState
  /** True when any filter or pre-defined query is active. */
  anyActive: boolean
  onChange: (filters: FilterState) => void
  onClear: () => void
}

export default function FilterBar({ filters, anyActive, onChange, onClear }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3" role="group" aria-label="Device filters">
      <label className="flex flex-col gap-1 text-xs text-text-muted">
        Site
        <select
          value={filters.siteId}
          onChange={(e) => onChange({ ...filters, siteId: e.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">All sites</option>
          {SITES.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-text-muted">
        Kind
        <select
          value={filters.kind}
          onChange={(e) => onChange({ ...filters, kind: e.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">All kinds</option>
          {(Object.keys(DEVICE_KIND_LABELS) as DeviceKind[]).map((kind) => (
            <option key={kind} value={kind}>
              {DEVICE_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-text-muted">
        Status
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">Any status</option>
          {(Object.keys(DEVICE_STATUS_LABELS) as DeviceStatus[]).map((status) => (
            <option key={status} value={status}>
              {DEVICE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      {anyActive && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
