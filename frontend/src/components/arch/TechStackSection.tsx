/**
 * Technology stack — the tables from docs/03-tech-stack.md, including the
 * rejected alternative for every row. A choice with no rejected alternative
 * was not a choice.
 */

import Section from './Section'

interface Row {
  layer: string
  choice: string
  serves: string
  /** The alternative that lost, and why. */
  rejected?: { name: string; reason: string }
}

interface Group {
  title: string
  note?: string
  rows: Row[]
}

const GROUPS: Group[] = [
  {
    title: 'Ingest',
    note: 'Kafka is the expensive choice and worth justifying: it decouples the rate at which devices produce from the rate at which we can process. Without it, NFR-6 is unachievable.',
    rows: [
      {
        layer: 'Device protocol',
        choice: 'MQTT over TLS',
        serves: 'NFR-1, NFR-7',
        rejected: { name: 'HTTP polling', reason: 'too chatty and too slow for battery/bandwidth-limited devices' },
      },
      {
        layer: 'Broker',
        choice: 'EMQX',
        serves: 'NFR-3',
        rejected: { name: 'Self-managed Mosquitto', reason: 'single-node, no clustering story' },
      },
      {
        layer: 'Stream',
        choice: 'Apache Kafka',
        serves: 'NFR-6, NFR-5',
        rejected: { name: 'Direct-to-database writes', reason: 'couples ingest availability to database availability' },
      },
    ],
  },
  {
    title: 'Processing',
    rows: [
      {
        layer: 'Stream processing',
        choice: 'Kafka Streams (JVM)',
        serves: 'NFR-1, NFR-3',
        rejected: { name: 'Flink', reason: 'more power than a stateless status derivation needs, much more operational weight' },
      },
      {
        layer: 'Staleness detection',
        choice: 'Windowed timers in the same processor',
        serves: 'FR-6',
        rejected: { name: 'A cron sweeping the database', reason: 'latency bounded by sweep interval, and it scales with fleet size' },
      },
    ],
  },
  {
    title: 'Storage',
    rows: [
      {
        layer: 'Current state',
        choice: 'Redis',
        serves: 'NFR-1, NFR-4',
        rejected: { name: 'Latest-per-device from the time-series store', reason: 'an expensive query on the hottest path' },
      },
      {
        layer: 'Time-series',
        choice: 'TimescaleDB',
        serves: 'FR-9, NFR-14',
        rejected: { name: 'InfluxDB', reason: 'Timescale keeps it in Postgres, so registry and history share one operational skill set' },
      },
      {
        layer: 'Registry',
        choice: 'PostgreSQL',
        serves: 'FR-2, FR-11',
        rejected: { name: 'A document store', reason: 'this data is relational and tiny, and correctness matters more than flexibility' },
      },
    ],
  },
  {
    title: 'Serving',
    note: 'SSE over WebSocket is the decision most worth defending: the data flows one way only, and a bidirectional transport would be a capability the requirements forbid us from using.',
    rows: [
      {
        layer: 'Read API',
        choice: 'Go, REST + JSON',
        serves: 'NFR-3, NFR-5',
        rejected: { name: 'GraphQL', reason: 'its strength is arbitrary client-shaped queries, which the read-only fixed-query model explicitly does not want' },
      },
      {
        layer: 'Realtime push',
        choice: 'Server-Sent Events',
        serves: 'FR-5, NFR-1',
        rejected: { name: 'WebSocket', reason: 'bidirectional, and there is nothing to send upstream; SSE reconnects natively and passes proxies more easily' },
      },
      {
        layer: 'Auth',
        choice: 'OIDC, short-lived JWT with tenant claim',
        serves: 'FR-11, NFR-8',
        rejected: { name: 'Session cookies', reason: 'worse fit for a static SPA on a CDN' },
      },
      {
        layer: 'Cache',
        choice: 'CDN edge cache + Redis',
        serves: 'NFR-14',
        rejected: { name: 'No cache', reason: 'read cost would scale linearly with dashboards open' },
      },
    ],
  },
  {
    title: 'Frontend',
    rows: [
      {
        layer: 'Build',
        choice: 'Vite 5',
        serves: 'NFR-2, NFR-12',
        rejected: { name: 'Next.js', reason: 'SSR and an API layer we do not need; a static bundle fits a read-only view better' },
      },
      {
        layer: 'UI',
        choice: 'React 18 + TypeScript strict',
        serves: 'NFR-11',
        rejected: { name: 'Svelte', reason: "smaller, but React's ecosystem and team familiarity win on a system meant to outlive one team" },
      },
      {
        layer: 'Styling',
        choice: 'Tailwind, tokens in theme.extend',
        serves: 'NFR-10, NFR-11',
        rejected: { name: 'CSS-in-JS', reason: 'runtime cost on a page that re-renders on every feed tick' },
      },
      {
        layer: 'Routing',
        choice: 'react-router HashRouter',
        serves: 'NFR-12',
        rejected: { name: 'BrowserRouter', reason: 'needs server rewrites; GitHub Pages has none, so a refresh on /architecture would 404' },
      },
      {
        layer: 'Charts',
        choice: 'Hand-built SVG components',
        serves: 'NFR-10',
        rejected: { name: 'Recharts / Chart.js', reason: 'both fight the accessibility rules we committed to (fixed series order, mandatory table view, no dual axis)' },
      },
      {
        layer: 'State',
        choice: 'React hooks only',
        serves: 'NFR-11',
        rejected: { name: 'Redux', reason: 'there is no shared mutable state to manage; the data is read-only and flows one way' },
      },
      {
        layer: 'Fonts',
        choice: 'Self-hosted @fontsource',
        serves: 'NFR-2, NFR-12',
        rejected: { name: 'Google Fonts CDN', reason: 'an extra third-party round trip and a privacy dependency' },
      },
    ],
  },
  {
    title: 'Deployment',
    rows: [
      { layer: 'Frontend host', choice: 'Static bundle on GitHub Pages (production: any CDN)', serves: 'NFR-12' },
      { layer: 'Backend', choice: 'Kubernetes, one deployment per service', serves: 'NFR-3, NFR-5' },
      { layer: 'CI/CD', choice: 'GitHub Actions', serves: '—' },
      { layer: 'Observability', choice: 'OpenTelemetry → Prometheus + Grafana', serves: 'NFR-13' },
    ],
  },
]

export default function TechStackSection() {
  return (
    <Section
      id="tech-stack"
      title="Technology stack"
      intro={
        <>
          Each choice names the requirement it serves and the alternative it beat. The frontend
          being a pure static artefact is a deliberate architectural property, not a convenience:
          the display path has no server to fail, which is a large part of how the read path
          reaches 99.9 % while ingest is allowed to degrade.
        </>
      }
    >
      <div className="space-y-6">
        {GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-muted">
              {group.title}
            </h3>
            <div className="overflow-x-auto rounded-md border border-border bg-surface-1">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <caption className="sr-only">{group.title} technology choices</caption>
                <thead className="border-b border-border bg-surface-2">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-xs font-medium text-text-muted">Layer</th>
                    <th scope="col" className="px-3 py-2 text-xs font-medium text-text-muted">Choice</th>
                    <th scope="col" className="px-3 py-2 text-xs font-medium text-text-muted">Serves</th>
                    <th scope="col" className="px-3 py-2 text-xs font-medium text-text-muted">Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {group.rows.map((row) => (
                    <tr key={row.layer}>
                      <td className="px-3 py-1.5 align-top text-text-secondary">{row.layer}</td>
                      <td className="px-3 py-1.5 align-top font-medium text-text-primary">{row.choice}</td>
                      <td className="px-3 py-1.5 align-top font-data text-xs text-text-muted">{row.serves}</td>
                      <td className="px-3 py-1.5 align-top text-text-secondary">
                        {row.rejected ? (
                          <>
                            <span className="font-medium text-text-primary line-through decoration-gridline">
                              {row.rejected.name}
                            </span>{' '}
                            — {row.rejected.reason}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {group.note && <p className="max-w-3xl text-xs text-text-muted">{group.note}</p>}
          </div>
        ))}
      </div>
    </Section>
  )
}
