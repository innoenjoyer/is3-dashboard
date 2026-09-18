# 3.2 Component map

## Why this shape

The requirements split cleanly into two paths that have almost nothing in common:

- **Ingest** is write-heavy, bursty, and must never lose an acknowledged message.
- **Read** is overwhelmingly repetitive — the same few hundred devices queried over
  and over by a handful of dashboards.

Because customers never write, these two paths never contend for the same data. So
we separate them and let each scale on its own terms. Everything else follows.

## Components

### Edge and ingest

| Component | Responsibility | Notes |
|---|---|---|
| **Device Gateway** | Terminate MQTT/TLS from devices, authenticate each device by its own credential | Stateless; horizontally scalable |
| **Registry Check** | Drop any message whose device is not registered to a customer (FR-2) | Reads a cached registry, fails closed |
| **Ingest Stream** | Durable append-only buffer between gateway and processing | Kafka-style topic, partitioned by customer |

The stream is the seam. If processing dies, devices keep publishing and nothing is
lost; when processing recovers it catches up from its offset. This is what buys
NFR-6, and it is the reason ingest degradation never takes down the display.

### Processing

| Component | Responsibility |
|---|---|
| **Status Processor** | Consume the stream, derive each device's current status, write it to the state store |
| **Staleness Monitor** | Flip a device to `offline` when nothing arrives within its expected interval (FR-6) |
| **Aggregator** | Maintain per-customer rollups (counts by status, uptime windows) so the dashboard never computes them itself |

The staleness monitor exists because *absence of a message is itself information*.
Nothing else in the system notices silence — a purely event-driven design would show
a dead device as permanently healthy.

### Storage

| Component | Holds | Why separate |
|---|---|---|
| **Current State Store** | One row per device: latest status and reading | Tiny, hot, read constantly |
| **Time-Series Store** | Historical readings with retention | Large, append-only, read occasionally |
| **Registry DB** | Customers, sites, devices, entitlements | Small, changes only when sales acts |

Splitting current state from history is the main storage decision. The dashboard's
default view touches only the small hot store; history is read on demand when a user
opens one device.

### Serving

| Component | Responsibility |
|---|---|
| **Read API** | Serve device lists, single-device history, and the pre-defined queries |
| **Query Catalogue** | The fixed set of pre-defined queries (FR-7), server-side |
| **Push Service** | Stream updates to open dashboards over WebSocket/SSE (FR-5) |
| **Auth Service** | Authenticate the customer, issue a tenant-scoped token (FR-11) |
| **Read Cache** | Cache read responses per tenant |

Queries live server-side as a catalogue, not as strings from the client. The customer
picks an identifier; the server owns the SQL. That satisfies FR-7 and removes a whole
class of injection and cost-explosion risks at the same time.

### Client

| Component | Responsibility |
|---|---|
| **Dashboard SPA** | The static frontend — this repository's `frontend/` |
| **Feed Client** | Hold the push connection, reconcile updates into local view state |
| **View State** | Filters, selected query, selected device. Client-only, never persisted server-side |

## How they interact

```
Device ──MQTT/TLS──► Device Gateway ──► Registry Check ──► Ingest Stream
                                                                │
                              ┌─────────────────────────────────┤
                              ▼                                 ▼
                      Status Processor                    Aggregator
                              │                                 │
                    ┌─────────┴─────────┐                       │
                    ▼                   ▼                       ▼
            Current State Store   Time-Series Store      (rollups)
                    │                   │                       │
                    └─────────┬─────────┴───────────────────────┘
                              ▼
                          Read API ◄──── Query Catalogue
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               Read Cache          Push Service
                    │                   │
                    └─────────┬─────────┘
                              ▼
                        Dashboard SPA  ◄──► Auth Service
```

Arrows point one way throughout the ingest and read path. That is not an accident:
with no user writes, there is no return path to design, so no distributed-transaction
problem exists anywhere in the system.

## Frontend component map

This is the part owned by the frontend role.

```
App (HashRouter)
└── AppShell ......... top bar, live-feed indicator, footer
    ├── DashboardPage
    │   ├── FleetPulse ......... signature hero; one tick per device
    │   ├── KpiRow ............. total / reporting / needs attention / offline
    │   ├── FilterBar .......... site, kind, status — composable
    │   ├── QueryPanel ......... the 8 pre-defined queries
    │   ├── DeviceGrid
    │   │   └── DeviceCard ..... icon + label + colour status
    │   ├── ChartSection
    │   │   ├── UptimeTimeline
    │   │   ├── StatusDistribution
    │   │   └── MetricLine
    │   └── DeviceDrawer ....... single-device history, Esc to close
    └── ArchitecturePage ....... C4 diagrams, data flow, NFRs, ADRs
```

Data reaches these components from `useLiveFeed`, which in the real system wraps the
Feed Client and in this build wraps the mock generator. That boundary is deliberate:
swapping the mock for a real WebSocket touches one hook and nothing else.
