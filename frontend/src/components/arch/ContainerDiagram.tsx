/**
 * C4 level 2 — container view. Faithful to docs/04-architecture.md: the
 * ingest pipeline (gateway → stream → processor) fans out to the stores,
 * the stores feed the read API, and the read API serves the static SPA over
 * REST + SSE. The Dashboard SPA sits outside the platform boundary — it is
 * this repository's frontend/, deployed as a static bundle.
 */

import { Arrow, Boundary, DBox, DiagramFrame, DLabel } from './svg'

export default function ContainerDiagram() {
  return (
    <DiagramFrame
      title="Container view (C4 level 2)"
      description="Inside the Is3 platform: the device gateway (MQTT) feeds the ingest stream (Kafka), which the status processor (JVM) consumes. The processor writes to the current state store (Redis), the time-series store (TimescaleDB) and reads the registry (PostgreSQL). All three feed the read API (Go), which serves the dashboard SPA over REST and SSE."
      width={860}
      height={478}
    >
      <Boundary x={20} y={16} w={820} h={330} label="Is3 platform" />

      {/* Ingest pipeline */}
      <DBox x={50} y={60} w={150} h={56} label="Device Gateway" sub="MQTT/TLS" />
      <DBox x={250} y={60} w={150} h={56} label="Ingest Stream" sub="Kafka" />
      <DBox x={450} y={60} w={160} h={56} label="Status Processor" sub="JVM" />
      <Arrow x1={200} y1={88} x2={250} y2={88} />
      <Arrow x1={400} y1={88} x2={450} y2={88} />

      {/* Processor fans out to the stores */}
      <DBox x={130} y={200} w={150} h={56} label="Current State" sub="Redis" />
      <DBox x={330} y={200} w={170} h={56} label="Time-series Store" sub="TimescaleDB" />
      <DBox x={550} y={200} w={150} h={56} label="Registry" sub="PostgreSQL" />
      <Arrow x1={530} y1={116} x2={205} y2={200} />
      <Arrow x1={530} y1={116} x2={415} y2={200} />
      <Arrow x1={530} y1={116} x2={625} y2={200} />

      {/* Stores converge on the read API */}
      <DBox x={355} y={292} w={170} h={48} label="Read API" sub="Go" />
      <Arrow x1={205} y1={256} x2={380} y2={292} />
      <Arrow x1={415} y1={256} x2={440} y2={292} />
      <Arrow x1={625} y1={256} x2={500} y2={292} />

      {/* The client lives outside the boundary: a static bundle, not a server */}
      <DBox x={350} y={406} w={180} h={56} label="Dashboard SPA" sub="React · static bundle" accent />
      <Arrow x1={440} y1={340} x2={440} y2={406} />
      <DLabel x={452} y={368} lines={['REST + SSE']} anchor="start" mono />
    </DiagramFrame>
  )
}
