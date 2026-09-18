/**
 * Requirements — the functional requirements as one scannable table, and the
 * fourteen non-functional requirements grouped by attribute so the reader
 * scans clusters instead of a wall (docs/01-requirements.md).
 */

import Section from './Section'

interface FR {
  id: string
  text: string
  priority: 'Must' | 'Should' | 'Could'
}

const FUNCTIONAL: FR[] = [
  { id: 'FR-1', text: 'Ingest status messages from registered devices in the field', priority: 'Must' },
  { id: 'FR-2', text: 'Reject messages from any device that is not registered to a customer', priority: 'Must' },
  { id: 'FR-3', text: 'Show every device belonging to the signed-in customer on one screen', priority: 'Must' },
  { id: 'FR-4', text: "Show each device's current status, kind, site and last-seen time", priority: 'Must' },
  { id: 'FR-5', text: 'Refresh the view in near real time without a manual page reload', priority: 'Must' },
  { id: 'FR-6', text: 'Mark a device as offline when no message arrives within its expected interval', priority: 'Must' },
  { id: 'FR-7', text: 'Execute a fixed set of pre-defined queries chosen by the customer', priority: 'Must' },
  { id: 'FR-8', text: 'Filter the device view by site, device kind and status', priority: 'Must' },
  { id: 'FR-9', text: "Show a single device's recent history on demand", priority: 'Must' },
  { id: 'FR-10', text: 'Show fleet-level summaries: counts by status, uptime over time', priority: 'Should' },
  { id: 'FR-11', text: 'Authenticate the customer and scope all data to their tenant', priority: 'Must' },
  { id: 'FR-12', text: 'Record an audit trail of who viewed what', priority: 'Should' },
  { id: 'FR-13', text: 'Export the current view as CSV', priority: 'Could' },
]

const EXCLUDED = [
  'device registration',
  'device control',
  'customer self-service sign-up',
  'free-form query authoring',
  'editing any device data',
]

interface NFR {
  id: string
  text: string
  measured: string
}

interface NFRGroup {
  attribute: string
  items: NFR[]
}

const NFR_GROUPS: NFRGroup[] = [
  {
    attribute: 'Performance',
    items: [
      { id: 'NFR-1', text: 'A status change is visible on the dashboard within 5 s of the device sending it (p95)', measured: 'end-to-end trace timestamp' },
      { id: 'NFR-2', text: 'First contentful paint under 1.5 s on a 4G connection', measured: 'Lighthouse' },
    ],
  },
  {
    attribute: 'Scalability',
    items: [
      { id: 'NFR-3', text: '10 000 devices per customer, 50 000 messages/minute fleet-wide, scaling horizontally', measured: 'load test' },
      { id: 'NFR-4', text: 'Dashboard stays interactive with 1 000 devices rendered', measured: 'frame budget under 16 ms' },
    ],
  },
  {
    attribute: 'Availability & reliability',
    items: [
      { id: 'NFR-5', text: '99.9 % monthly for the read path; ingest degrades before display does', measured: 'uptime monitor' },
      { id: 'NFR-6', text: 'Losing one ingest node loses no acknowledged message', measured: 'chaos test' },
    ],
  },
  {
    attribute: 'Security',
    items: [
      { id: 'NFR-7', text: 'Every device authenticates with a per-device credential; transport is TLS', measured: 'pen test' },
      { id: 'NFR-8', text: "Tenant isolation: a customer can never read another customer's device", measured: 'automated authz test per endpoint' },
    ],
  },
  {
    attribute: 'Usability & accessibility',
    items: [
      { id: 'NFR-9', text: 'A technician identifies the devices needing attention within 5 s of page load', measured: 'moderated usability test' },
      { id: 'NFR-10', text: 'WCAG 2.1 AA; status never carried by colour alone', measured: 'axe audit + manual keyboard pass' },
    ],
  },
  {
    attribute: 'Maintainability & portability',
    items: [
      { id: 'NFR-11', text: 'Frontend components are independently testable; no shared mutable state', measured: 'code review' },
      { id: 'NFR-12', text: 'Frontend is a static bundle deployable to any CDN or static host', measured: 'deployed to GitHub Pages' },
    ],
  },
  {
    attribute: 'Observability & cost',
    items: [
      { id: 'NFR-13', text: 'Every stage of the pipeline emits metrics and traces', measured: 'dashboards exist' },
      { id: 'NFR-14', text: 'Read path is cacheable so traffic growth does not scale database cost linearly', measured: 'cost per 1 000 sessions' },
    ],
  },
]

const PRIORITY_CLASS: Record<FR['priority'], string> = {
  Must: 'border-border text-text-primary',
  Should: 'border-border text-text-secondary',
  Could: 'border-border text-text-muted',
}

export default function RequirementsSection() {
  return (
    <Section
      id="requirements"
      title="Requirements"
      intro={
        <>
          Three attributes dominate, and they conflict in a useful way: near-real-time latency
          pushes toward streaming, read scalability toward caching, and availability toward
          decoupling ingest from display. The read-only constraint is what lets all three be
          satisfied at once — with no user writes, the read path can be aggressively cached
          without any consistency problem worth the name.
        </>
      }
    >
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
          Functional
        </h3>
        <div className="overflow-x-auto rounded-md border border-border bg-surface-1">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">
              Functional requirements with priority
            </caption>
            <thead className="border-b border-border bg-surface-2">
              <tr>
                <th scope="col" className="px-3 py-2 text-xs font-medium text-text-muted">ID</th>
                <th scope="col" className="px-3 py-2 text-xs font-medium text-text-muted">Requirement</th>
                <th scope="col" className="px-3 py-2 text-xs font-medium text-text-muted">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FUNCTIONAL.map((fr) => (
                <tr key={fr.id}>
                  <td className="whitespace-nowrap px-3 py-1.5 font-data text-xs text-text-muted">{fr.id}</td>
                  <td className="px-3 py-1.5 text-text-secondary">{fr.text}</td>
                  <td className="px-3 py-1.5">
                    <span
                      className={`inline-block rounded border px-1.5 py-0.5 text-[11px] font-medium ${PRIORITY_CLASS[fr.priority]}`}
                    >
                      {fr.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted">
          Deliberately excluded: {EXCLUDED.join(' · ')}.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
          Non-functional, grouped by attribute
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {NFR_GROUPS.map((group) => (
            <div
              key={group.attribute}
              className="rounded-md border border-border bg-surface-1 p-4"
            >
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {group.attribute}
              </h4>
              <ul className="mt-3 space-y-3">
                {group.items.map((nfr) => (
                  <li key={nfr.id} className="text-sm">
                    <p className="text-text-secondary">
                      <span className="mr-2 font-data text-xs text-text-muted">{nfr.id}</span>
                      {nfr.text}
                    </p>
                    <p className="mt-0.5 pl-12 text-xs text-text-muted">
                      measured by {nfr.measured}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
