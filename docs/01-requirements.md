# 3.1 Requirements

## Scope note

Is3 presents device status. It does not control devices. Three constraints from the
brief shape everything else:

1. Data is **stateless status** pushed from devices in the field.
2. The customer **never writes data** — no create, update or delete.
3. There is **no registration**; sales onboards customers manually and devices are
   already registered.

A large part of the usual complexity of an IoT platform — command and control,
device provisioning, write conflicts, user-generated content — is therefore out of
scope. The architecture should exploit that, not ignore it.

## a. Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Ingest status messages from registered devices in the field | Must |
| FR-2 | Reject messages from any device that is not registered to a customer | Must |
| FR-3 | Show every device belonging to the signed-in customer on one screen | Must |
| FR-4 | Show each device's current status, kind, site and last-seen time | Must |
| FR-5 | Refresh the view in near real time without a manual page reload | Must |
| FR-6 | Mark a device as offline when no message arrives within its expected interval | Must |
| FR-7 | Execute a fixed set of pre-defined queries chosen by the customer | Must |
| FR-8 | Filter the device view by site, device kind and status | Must |
| FR-9 | Show a single device's recent history on demand | Must |
| FR-10 | Show fleet-level summaries: counts by status, uptime over time | Should |
| FR-11 | Authenticate the customer and scope all data to their tenant | Must |
| FR-12 | Record an audit trail of who viewed what | Should |
| FR-13 | Export the current view as CSV | Could |

Deliberately excluded: device registration, device control, customer self-service
sign-up, free-form query authoring, editing any device data.

## b. Non-functional requirements

| ID | Attribute | Requirement | How it is measured |
|----|-----------|-------------|--------------------|
| NFR-1 | Performance | A status change is visible on the dashboard within 5 s of the device sending it (p95) | end-to-end trace timestamp |
| NFR-2 | Performance | First contentful paint under 1.5 s on a 4G connection | Lighthouse |
| NFR-3 | Scalability | 10 000 devices per customer, 50 000 messages/minute fleet-wide, scaling horizontally | load test |
| NFR-4 | Scalability | Dashboard stays interactive with 1 000 devices rendered | frame budget under 16 ms |
| NFR-5 | Availability | 99.9 % monthly for the read path; ingest degrades before display does | uptime monitor |
| NFR-6 | Reliability | Losing one ingest node loses no acknowledged message | chaos test |
| NFR-7 | Security | Every device authenticates with a per-device credential; transport is TLS | pen test |
| NFR-8 | Security | Tenant isolation: a customer can never read another customer's device | automated authz test per endpoint |
| NFR-9 | Usability | A technician identifies the devices needing attention within 5 s of page load | moderated usability test |
| NFR-10 | Accessibility | WCAG 2.1 AA; status never carried by colour alone | axe audit + manual keyboard pass |
| NFR-11 | Maintainability | Frontend components are independently testable; no shared mutable state | code review |
| NFR-12 | Portability | Frontend is a static bundle deployable to any CDN or static host | deployed to GitHub Pages |
| NFR-13 | Observability | Every stage of the pipeline emits metrics and traces | dashboards exist |
| NFR-14 | Cost | Read path is cacheable so traffic growth does not scale database cost linearly | cost per 1 000 sessions |

## Quality attributes that drive the architecture

Three dominate, and they conflict in a useful way:

- **Near-real-time latency** (NFR-1) pushes toward streaming and push transport.
- **Scalability of reads** (NFR-3, NFR-4) pushes toward caching and pre-aggregation.
- **Availability** (NFR-5) pushes toward decoupling ingest from display.

The read-only constraint is what lets all three be satisfied at once: with no writes
from users, the read path can be aggressively cached and replicated without any
consistency problem worth the name. That is the single most important architectural
consequence of the requirements.
