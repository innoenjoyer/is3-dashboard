# 3.3 Technology stack

Each choice below names the requirement it serves and the alternative it beat. A
choice with no rejected alternative was not a choice.

## Ingest

| Layer | Choice | Serves | Rejected |
|---|---|---|---|
| Device protocol | **MQTT over TLS** | NFR-1, NFR-7 | HTTP polling — too chatty and too slow for battery/bandwidth-limited devices |
| Broker | **EMQX** | NFR-3 | Self-managed Mosquitto — single-node, no clustering story |
| Stream | **Apache Kafka** | NFR-6, NFR-5 | Direct-to-database writes — couples ingest availability to database availability |

Kafka is the expensive choice and worth justifying. It is here for exactly one
reason: it decouples the rate at which devices produce from the rate at which we can
process. Under a burst the stream absorbs; under a processing failure the stream
retains. Without it, NFR-6 is unachievable.

## Processing

| Layer | Choice | Serves | Rejected |
|---|---|---|---|
| Stream processing | **Kafka Streams (JVM)** | NFR-1, NFR-3 | Flink — more power than a stateless status derivation needs, much more operational weight |
| Staleness detection | **Windowed timers in the same processor** | FR-6 | A cron sweeping the database — latency bounded by sweep interval, and it scales with fleet size |

## Storage

| Layer | Choice | Serves | Rejected |
|---|---|---|---|
| Current state | **Redis** | NFR-1, NFR-4 | Reading latest-per-device from the time-series store — an expensive query on the hottest path |
| Time-series | **TimescaleDB** | FR-9, NFR-14 | InfluxDB — Timescale keeps it in Postgres, so the registry and history share one operational skill set |
| Registry | **PostgreSQL** | FR-2, FR-11 | A document store — this data is relational and tiny, and correctness matters more than flexibility |

## Serving

| Layer | Choice | Serves | Rejected |
|---|---|---|---|
| Read API | **Go, REST + JSON** | NFR-3, NFR-5 | GraphQL — its strength is arbitrary client-shaped queries, which our read-only fixed-query model explicitly does not want |
| Realtime push | **Server-Sent Events** | FR-5, NFR-1 | WebSocket — bidirectional, and we have nothing to send upstream; SSE reconnects natively and passes proxies more easily |
| Auth | **OIDC, short-lived JWT with tenant claim** | FR-11, NFR-8 | Session cookies — worse fit for a static SPA on a CDN |
| Cache | **CDN edge cache + Redis** | NFR-14 | No cache — read cost would scale linearly with dashboards open |

SSE over WebSocket is the decision most worth defending. The data flows one way only.
Choosing a bidirectional transport would have been choosing a capability we are
forbidden by the requirements from using, and paying for it in reconnection logic.

## Frontend

| Layer | Choice | Serves | Rejected |
|---|---|---|---|
| Build | **Vite 5** | NFR-2, NFR-12 | Next.js — SSR and an API layer we do not need; a static bundle is a better fit for a read-only view |
| UI | **React 18 + TypeScript strict** | NFR-11 | Svelte — smaller, but React's ecosystem and team familiarity win on a system meant to outlive one team |
| Styling | **Tailwind, tokens in `theme.extend`** | NFR-10, NFR-11 | CSS-in-JS — runtime cost on a page that re-renders on every feed tick |
| Routing | **react-router `HashRouter`** | NFR-12 | `BrowserRouter` — needs server rewrites; GitHub Pages has none, so a refresh on `/architecture` would 404 |
| Charts | **Hand-built SVG components** | NFR-10 | Recharts/Chart.js — both fight the accessibility rules we committed to (fixed series order, mandatory table view, no dual axis) |
| State | **React hooks only** | NFR-11 | Redux — there is no shared mutable state to manage; the data is read-only and flows one way |
| Fonts | **Self-hosted `@fontsource`** | NFR-2, NFR-12 | Google Fonts CDN — an extra third-party round trip and a privacy dependency |

## Deployment

| Layer | Choice | Serves |
|---|---|---|
| Frontend host | **Static bundle on GitHub Pages** (production: any CDN) | NFR-12 |
| Backend | **Kubernetes, one deployment per service** | NFR-3, NFR-5 |
| CI/CD | **GitHub Actions** | — |
| Observability | **OpenTelemetry → Prometheus + Grafana** | NFR-13 |

The frontend being a pure static artefact is a deliberate architectural property, not
a convenience. It means the display path has no server to fail, which is a large part
of how the read path reaches 99.9 % while ingest is allowed to degrade.
