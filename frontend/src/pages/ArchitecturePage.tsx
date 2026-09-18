/**
 * Architecture page (T5) — the system's design, as part of the product:
 * intro and constraints, requirements, C4 diagrams as inline SVG, the
 * read-only data flow, this app's component map, the tech-stack rationale
 * and the ADR summaries. Content is faithful to docs/01–04 and docs/adr/.
 */

import AdrSection from '../components/arch/AdrSection'
import ComponentMap from '../components/arch/ComponentMap'
import ContainerDiagram from '../components/arch/ContainerDiagram'
import ContextDiagram from '../components/arch/ContextDiagram'
import DataFlowDiagram from '../components/arch/DataFlowDiagram'
import RequirementsSection from '../components/arch/RequirementsSection'
import Section from '../components/arch/Section'
import SpaComponentDiagram from '../components/arch/SpaComponentDiagram'
import TechStackSection from '../components/arch/TechStackSection'
import useDocumentTitle from '../useDocumentTitle'

const CONSTRAINTS = [
  {
    title: 'Read-only',
    body: 'The customer never creates, updates or deletes data. There is nothing in the UI that writes — not even greyed out.',
  },
  {
    title: 'Stateless device data',
    body: 'Devices push status from the field; the system presents it. Absence of a message is itself information.',
  },
  {
    title: 'No registration',
    body: 'Sales onboards customers manually and devices are already registered. The user arrives signed in, with a fleet assigned.',
  },
]

export default function ArchitecturePage() {
  useDocumentTitle('Architecture')

  return (
    <div className="space-y-10">
      <section aria-labelledby="architecture-heading" className="space-y-4">
        <h1 id="architecture-heading" className="font-display text-2xl font-semibold">
          Architecture
        </h1>
        <p className="max-w-3xl text-sm text-text-secondary">
          Is3 is a near-real-time dashboard that shows a customer the status of their registered
          IoT devices on one screen. A large part of the usual complexity of an IoT platform —
          command and control, device provisioning, write conflicts, user-generated content — is
          out of scope, and the architecture exploits that rather than ignoring it. Three
          constraints from the brief shape everything else:
        </p>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CONSTRAINTS.map((c) => (
            <li key={c.title} className="rounded-md border border-border bg-surface-1 p-4">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-text-primary">
                {c.title}
              </h2>
              <p className="mt-1.5 text-sm text-text-secondary">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <RequirementsSection />

      <Section
        id="c4"
        title="C4 views"
        intro="Context, container and component levels. The component view opens the dashboard SPA — this frontend — itself."
      >
        <div className="space-y-6">
          <figure className="space-y-2">
            <figcaption className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
              Level 1 · Context
            </figcaption>
            <ContextDiagram />
          </figure>
          <figure className="space-y-2">
            <figcaption className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
              Level 2 · Containers
            </figcaption>
            <ContainerDiagram />
          </figure>
          <figure className="space-y-2">
            <figcaption className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
              Level 3 · Components — the Dashboard SPA
            </figcaption>
            <SpaComponentDiagram />
          </figure>
        </div>
      </Section>

      <Section
        id="data-flow"
        title="Data flow — a reading's journey"
        intro="The path is read-only and stateless end to end, and it runs one way only. That is not an accident: with no user writes there is no return path to design, so no distributed-transaction problem exists anywhere in the system."
      >
        <DataFlowDiagram />
      </Section>

      <ComponentMap />

      <TechStackSection />

      <AdrSection />
    </div>
  )
}
