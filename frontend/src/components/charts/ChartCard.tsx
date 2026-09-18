/**
 * ChartCard — the frame every chart ships in (BRIEF §4 rule 9): title,
 * optional subtitle, a Chart/Table toggle, and the chart itself. The table
 * view exposes exactly the numbers behind the marks; it is an accessibility
 * requirement, not a nice-to-have.
 */

import { useId, useState, type ReactNode } from 'react'

export interface TableColumn {
  label: string
  numeric?: boolean
}

interface ChartCardProps {
  title: string
  subtitle?: string
  /** Table view: same numbers as the chart. */
  columns: TableColumn[]
  rows: string[][]
  tableCaption: string
  /** Shown instead of the chart/table when there is nothing to draw. */
  empty?: boolean
  emptyMessage?: string
  children: ReactNode
}

export default function ChartCard({
  title,
  subtitle,
  columns,
  rows,
  tableCaption,
  empty = false,
  emptyMessage = 'No data for this chart right now.',
  children,
}: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-md border border-border bg-surface-1 p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div>
          <h3
            id={headingId}
            className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted"
          >
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
        </div>
        {!empty && (
          <div
            role="group"
            aria-label={`${title}: choose chart or table view`}
            className="flex rounded-md border border-border text-xs"
          >
            {(['chart', 'table'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 capitalize first:rounded-l-md last:rounded-r-md ${
                  view === v
                    ? 'bg-surface-2 text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        {empty ? (
          <p className="py-6 text-sm text-text-secondary">{emptyMessage}</p>
        ) : view === 'chart' ? (
          children
        ) : (
          <div className="max-h-72 overflow-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{tableCaption}</caption>
              <thead className="sticky top-0 bg-surface-2">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.label}
                      scope="col"
                      className={`px-3 py-2 text-xs font-medium text-text-muted ${
                        col.numeric ? 'text-right' : ''
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={`px-3 py-1.5 ${
                          columns[j].numeric
                            ? 'tnums text-right font-data text-text-primary'
                            : 'text-text-secondary'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
