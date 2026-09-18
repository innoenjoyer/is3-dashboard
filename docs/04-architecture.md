# 3.4 Architecture design

## Architectural goals

1. A device status change reaches the technician's screen within 5 seconds.
2. Ingest load never degrades the display.
3. The system holds 10 000 devices per customer without a redesign.
4. A customer can never see another customer's device.

## Style: event-driven pipeline feeding a cached read model

The system is not one architectural style but two joined at a seam:

- **Ingest** is a **pipe-and-filter / event-driven pipeline**: gateway → registry
  check → stream → processor. Each stage does one thing and hands the message on.
- **Serving** is a **layered client–server** read model: stores → read API → cache →
  static client.

The durable stream is the seam between them. This is a read-optimised variant of
CQRS, and it is only this simple because the brief removed the command side: there
are no user writes to reconcile, so the "C" in CQRS is just the device feed.

## Views

### Context view (C4 level 1)

```
   ┌──────────────┐                        ┌──────────────────┐
   │ IoT devices  │ ── status messages ──► │                  │
   │ in the field │                        │   Is3 platform   │
   └──────────────┘                        │                  │
                                           │                  │
   ┌──────────────┐                        │                  │
   │  Technician  │ ◄── device status ──── │                  │
   │  (customer)  │                        │                  │
   └──────────────┘                        └──────────────────┘
                                                    ▲
   ┌──────────────┐                                 │
   │  Sales team  │ ── onboards customers ──────────┘
   │  (internal)  │    and registers devices
   └──────────────┘
```

Note what is absent: no arrow from technician to devices. The customer has no control
path, by requirement.

### Container view (C4 level 2)

```
┌─────────────────────────────────────────────────────────────────┐
│ Is3 platform                                                    │
│                                                                 │
│  ┌────────────┐   ┌──────────┐   ┌─────────────┐                │
│  │  Device    │──►│  Ingest  │──►│   Status    │                │
│  │  Gateway   │   │  Stream  │   │  Processor  │                │
│  │  (MQTT)    │   │ (Kafka)  │   │   (JVM)     │                │
│  └────────────┘   └──────────┘   └──────┬──────┘                │
│                                         │                       │
│                     ┌───────────────────┼───────────────┐       │
│                     ▼                   ▼               ▼       │
│              ┌────────────┐     ┌─────────────┐  ┌───────────┐  │
│              │  Current   │     │ Time-series │  │ Registry  │  │
│              │   State    │     │   Store     │  │   (PG)    │  │
│              │  (Redis)   │     │(TimescaleDB)│  │           │  │
│              └──────┬─────┘     └──────┬──────┘  └─────┬─────┘  │
│                     └────────┬─────────┴───────────────┘        │
│                              ▼                                  │
│                      ┌───────────────┐                          │
│                      │   Read API    │                          │
│                      │     (Go)      │                          │
│                      └───────┬───────┘                          │
│                              │ REST + SSE                       │
└──────────────────────────────┼──────────────────────────────────┘
                               ▼
                     ┌───────────────────┐
                     │  Dashboard SPA    │
                     │ (React, static)   │
                     └───────────────────┘
```

### Component view (C4 level 3) — Dashboard SPA

```
┌──────────────────────────────────────────────────────┐
│ Dashboard SPA                                        │
│                                                      │
│   ┌────────────┐      ┌──────────────┐               │
│   │ Feed Client│─────►│  useLiveFeed │               │
│   │ (SSE)      │      │   (hook)     │               │
│   └────────────┘      └──────┬───────┘               │
│                              │ fleet, lastUpdated    │
│              ┌───────────────┼───────────────┐       │
│              ▼               ▼               ▼       │
│      ┌─────────────┐  ┌───────────┐  ┌────────────┐  │
│      │ FleetPulse  │  │  KpiRow   │  │ DeviceGrid │  │
│      └─────────────┘  └───────────┘  └─────┬──────┘  │
│              ▲               ▲             │         │
│              └───────┬───────┘             ▼         │
│                      │               ┌────────────┐  │
│              ┌───────┴──────┐        │DeviceDrawer│  │
│              │  View State  │        └────────────┘  │
│              │ filters,query│                        │
│              └──────────────┘                        │
└──────────────────────────────────────────────────────┘
```

View state is client-only and never leaves the browser. Filtering is a pure function
over the fleet the hook already holds, so no filter change costs a round trip.

### Process view — a reading's journey

```
device ──publish──► gateway ──validate──► stream ──consume──► processor
                                                                  │
                                              derive status, write │
                                                                  ▼
                                                      current state store
                                                                  │
                                                      notify ─────┤
                                                                  ▼
                                                            push service
                                                                  │
                                                          SSE ────┤
                                                                  ▼
                                                          dashboard updates
```

Budget for NFR-1's 5 seconds: publish → gateway 200 ms, stream commit 100 ms,
processing 300 ms, push 200 ms, render 100 ms. Roughly 900 ms of work, leaving
headroom of over 4 s for network variance and retry.

### Deployment view

```
┌─────────────┐    ┌──────────────────────────────────┐    ┌──────────┐
│   Devices   │───►│  Kubernetes cluster              │    │   CDN    │
│  (field)    │    │  gateway · processor · read API  │    │  static  │
└─────────────┘    │  Kafka · Redis · Timescale · PG  │◄───│  bundle  │
                   └──────────────────────────────────┘    └────┬─────┘
                                                                ▼
                                                           ┌─────────┐
                                                           │ Browser │
                                                           └─────────┘
```

The browser fetches the application from a CDN and the data from the cluster. Those
are separate failure domains, which is why the display path is more available than
the platform behind it.

## How the architecture delivers each quality attribute

| Attribute | Mechanism |
|---|---|
| Latency (NFR-1) | Push over SSE, current state in memory, no polling |
| Read scalability (NFR-3/4) | Pre-aggregated rollups, cached responses, client-side filtering of an already-loaded fleet |
| Availability (NFR-5) | Static client on a CDN; ingest decoupled by the stream so it degrades alone |
| Durability (NFR-6) | Durable partitioned stream with consumer offsets |
| Tenant isolation (NFR-8) | Tenant claim in the token, scope applied in the read API, never in the client |
| Accessibility (NFR-10) | Status as icon + label + colour; every chart has a table view |
| Portability (NFR-12) | Frontend is a static bundle with relative asset paths |

## Known risks

- **The stream is a single conceptual point of failure.** Mitigated by partitioning
  and replication, but it is the component whose loss hurts most.
- **Staleness detection depends on correct per-device expected intervals.** A wrong
  interval means either false offline alerts or silent dead devices. This needs to be
  a monitored data-quality metric, not a set-and-forget field.
- **Client-side filtering assumes the whole fleet fits in the browser.** True at
  10 000 devices with a compact representation; beyond that, filtering moves server-side.
