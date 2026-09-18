/**
 * QueryPanel — the eight pre-defined queries from src/data/queries.ts.
 * A selectable list is the only "input" this dashboard offers (BRIEF §1);
 * there is no free-form text input anywhere. Selecting a query filters the
 * device grid; selecting it again deselects it.
 */

import { QUERIES } from '../data'

interface QueryPanelProps {
  selectedId: string | null
  /** Live match count per query id. */
  counts: ReadonlyMap<string, number>
  onSelect: (queryId: string | null) => void
}

export default function QueryPanel({ selectedId, counts, onSelect }: QueryPanelProps) {
  return (
    <section aria-labelledby="queries-heading">
      <h2
        id="queries-heading"
        className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted"
      >
        Pre-defined queries
      </h2>
      <ul className="mt-2 space-y-1.5" role="listbox" aria-label="Pre-defined queries">
        {QUERIES.map((query) => {
          const selected = query.id === selectedId
          return (
            <li key={query.id}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(selected ? null : query.id)}
                className={`w-full rounded-md border px-3 py-2 text-left ${
                  selected
                    ? 'border-series-1 bg-surface-2'
                    : 'border-border bg-surface-1 hover:bg-surface-2'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">{query.label}</span>
                  <span className="tnums shrink-0 font-data text-xs text-text-muted">
                    {counts.get(query.id) ?? 0}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-text-muted">{query.description}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
