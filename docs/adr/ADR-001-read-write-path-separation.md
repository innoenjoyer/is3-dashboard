# ADR-001 — Separate the ingest path from the read path

**Status:** Accepted

## Context

Devices push status continuously and unpredictably; dashboards read the same small
set of records repeatedly. The two workloads have opposite shapes. The brief also
guarantees that customers never write data, which removes the usual reason to keep
read and write against one model.

Forces:

- Ingest bursts must not slow the dashboard (NFR-1, NFR-5).
- A processing outage must not lose acknowledged messages (NFR-6).
- Read cost must not grow linearly with the number of open dashboards (NFR-14).

Alternatives considered:

1. **One database, devices write and dashboards read directly.** Simplest. Ingest
   spikes become dashboard latency, and an outage on either side takes both down.
2. **Ingest writes to a queue consumed synchronously by the API.** Couples display
   availability to processing availability.
3. **Durable stream between them, separate stores for current state and history.**

## Decision

Option 3. Devices publish into a durable partitioned stream. A processor consumes it
and maintains a small current-state store plus a time-series history. The read API
serves only from those stores and never touches the stream.

## Consequences

Accepted:

- The dashboard reads stay fast and cacheable regardless of ingest load.
- Processing can fail and catch up without data loss.
- Ingest can degrade while display stays at full availability.

Given up:

- Eventual consistency: a reading is visible only after the processor commits it. The
  5 s budget in NFR-1 is the bound we accepted.
- An extra system (the stream) to operate and pay for.
- Two stores holding overlapping data, which must be reconciled if the processor has
  a bug.
