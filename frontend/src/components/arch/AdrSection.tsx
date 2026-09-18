/**
 * Architecture decision records — the three ADRs as cards: context, decision,
 * and the trade-off accepted, each linking to its file in docs/adr/.
 */

import Section from './Section'

interface Adr {
  id: string
  title: string
  path: string
  context: string
  decision: string
  givenUp: string[]
}

const ADRS: Adr[] = [
  {
    id: 'ADR-001',
    title: 'Separate the ingest path from the read path',
    path: 'docs/adr/ADR-001-read-write-path-separation.md',
    context:
      'Devices push status continuously and unpredictably; dashboards read the same small set of records repeatedly. The two workloads have opposite shapes, and customers never write data — which removes the usual reason to keep read and write against one model.',
    decision:
      'Devices publish into a durable partitioned stream. A processor consumes it and maintains a small current-state store plus a time-series history. The read API serves only from those stores and never touches the stream.',
    givenUp: [
      'Eventual consistency: a reading is visible only after the processor commits it. The 5 s budget in NFR-1 is the bound accepted.',
      'An extra system (the stream) to operate and pay for.',
      'Two stores holding overlapping data, which must be reconciled if the processor has a bug.',
    ],
  },
  {
    id: 'ADR-002',
    title: 'Pre-defined queries live server-side as a catalogue',
    path: 'docs/adr/ADR-002-fixed-query-catalogue.md',
    context:
      'FR-7 requires a fixed set of pre-defined queries — customers are not authoring queries. Query cost must stay predictable, tenant isolation must hold for every query, and the frontend is a static bundle, so anything it holds is visible to anyone.',
    decision:
      'Each query is a server-owned definition with an id, a label, a description, and a parameterised implementation. The client renders the catalogue and sends { queryId, params }; the server applies the tenant scope itself, always. In this build the catalogue is mirrored as data in frontend/src/data/queries.ts with the identical shape, so replacing the mock with a real call is a change of source, not of structure.',
    givenUp: [
      'Adding a query needs a backend release, not a frontend change.',
      'Power users cannot explore freely. Out of scope by the brief.',
    ],
  },
  {
    id: 'ADR-003',
    title: 'Charts are hand-built SVG components, not a charting library',
    path: 'docs/adr/ADR-003-hand-built-svg-charts.md',
    context:
      'The visualisation rules are non-negotiable: fixed-order series colours that never repaint on filtering, no dual-axis charts, a mandatory hover layer, and a table view exposing the same numbers. The chart layer re-renders on every feed tick, and every kilobyte is on the critical path.',
    decision:
      'Small SVG React components, one per chart form, sharing scale and axis helpers. Series colours come from tokens keyed by entity identity, never by array index.',
    givenUp: [
      'Axes, ticks, tooltips and legends are implemented in-house, and they need tests.',
      'No free advanced chart types — the dashboard needs four known forms, driven by requirements rather than exploration.',
      'A future team member expecting a familiar library API has to learn ours instead.',
    ],
  },
]

export default function AdrSection() {
  return (
    <Section
      id="adrs"
      title="Architecture decision records"
      intro="Three decisions shape everything else. Each card names the trade-off accepted, not just the choice made."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ADRS.map((adr) => (
          <article
            key={adr.id}
            className="flex flex-col rounded-md border border-border bg-surface-1 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-data text-xs text-text-muted">{adr.id}</span>
              <span className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
                Accepted
              </span>
            </div>
            <h3 className="mt-2 font-display text-sm font-semibold text-text-primary">
              {adr.title}
            </h3>

            <div className="mt-3 flex-1 space-y-3 text-sm">
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Context
                </p>
                <p className="mt-1 text-text-secondary">{adr.context}</p>
              </div>
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Decision
                </p>
                <p className="mt-1 text-text-secondary">{adr.decision}</p>
              </div>
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Trade-off accepted
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-text-secondary">
                  {adr.givenUp.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-4 border-t border-border pt-3">
              <a
                href={adr.path}
                className="break-all font-data text-xs text-series-1 hover:underline"
              >
                {adr.path}
              </a>
            </p>
          </article>
        ))}
      </div>
    </Section>
  )
}
