# ADR-002 — Pre-defined queries live server-side as a catalogue

**Status:** Accepted

## Context

FR-7 requires customers to run "some pre-defined queries" for more detail about their
devices. The brief is explicit that the set is pre-defined — customers are not
authoring queries.

Forces:

- Query cost must stay predictable; one careless query must not be able to scan the
  whole time-series store (NFR-3, NFR-14).
- Tenant isolation must hold for every query without per-query review (NFR-8).
- The frontend is a static bundle with no server of its own, so anything it holds is
  visible to anyone.

Alternatives considered:

1. **GraphQL, let the client shape queries.** Flexible, and flexibility is precisely
   what the requirement does not ask for. Every new client shape is a new cost and
   authorisation question.
2. **Query strings built in the frontend and sent to the API.** The client is static
   and untrusted; this is an injection surface with no upside.
3. **A server-side catalogue; the client sends an identifier and parameters.**

## Decision

Option 3. Each pre-defined query is a server-owned definition with an id, a label, a
description, and a parameterised implementation. The client renders the catalogue and
sends `{ queryId, params }`. The server applies the tenant scope itself, always.

## Consequences

Accepted:

- Query cost is knowable in advance; each definition can be indexed and load-tested.
- Tenant scoping is applied in one place rather than per call site.
- The client cannot express a query we did not plan for — which is the requirement,
  not a limitation.

Given up:

- Adding a query needs a backend release, not a frontend change.
- Power users cannot explore freely. Out of scope by the brief; revisit only if the
  product direction changes.

## Frontend note

In this build the catalogue is mirrored as data in `frontend/src/data/queries.ts`
because there is no backend. The shape is deliberately identical to the server
contract — `{ id, label, description, predicate }` — so replacing the mock with a
real call is a change of source, not of structure.
