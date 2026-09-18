/**
 * C4 level 3 — component view of the Dashboard SPA itself, faithful to
 * docs/04-architecture.md. The Feed Client holds the push connection and
 * reconciles updates into the useLiveFeed hook; the hook hands fleet +
 * lastUpdated to the display components. View state (filters, selected
 * query) is client-only and never leaves the browser.
 */

import { Arrow, Boundary, DBox, DiagramFrame, DLabel } from './svg'

export default function SpaComponentDiagram() {
  return (
    <DiagramFrame
      title="Component view (C4 level 3) — Dashboard SPA"
      description="Inside the dashboard SPA: the feed client (SSE) reconciles updates into the useLiveFeed hook, which provides the fleet and last-updated timestamp to FleetPulse, KpiRow and DeviceGrid. DeviceGrid opens the DeviceDrawer. View state holds the filters and selected query, client-only."
      width={780}
      height={392}
    >
      <Boundary x={16} y={16} w={748} h={348} label="Dashboard SPA" />

      <DBox x={60} y={52} w={150} h={54} label="Feed Client" sub="SSE" />
      <DBox x={290} y={52} w={170} h={54} label="useLiveFeed" sub="hook" accent />
      <Arrow x1={210} y1={79} x2={290} y2={79} />

      {/* The hook fans out to the display components */}
      <DBox x={60} y={190} w={150} h={54} label="FleetPulse" sub="one tick per device" />
      <DBox x={260} y={190} w={140} h={54} label="KpiRow" sub="fleet summary" />
      <DBox x={450} y={190} w={150} h={54} label="DeviceGrid" sub="cards" />
      <Arrow x1={375} y1={106} x2={135} y2={190} />
      <Arrow x1={375} y1={106} x2={330} y2={190} />
      <Arrow x1={375} y1={106} x2={525} y2={190} />
      <DLabel x={392} y={138} lines={['fleet, lastUpdated']} anchor="start" mono />

      {/* Selecting a card opens the drawer */}
      <DBox x={450} y={290} w={150} h={54} label="DeviceDrawer" sub="Esc to close" />
      <Arrow x1={525} y1={244} x2={525} y2={290} />

      {/* View state shapes what the display components show; it never leaves the browser */}
      <DBox x={90} y={290} w={180} h={54} label="View State" sub="filters · selected query" />
      <Arrow x1={135} y1={290} x2={135} y2={244} dashed />
      <Arrow x1={220} y1={290} x2={330} y2={244} dashed />

      <DLabel
        x={390}
        y={382}
        lines={['View state is client-only — it never leaves the browser. Filtering costs no round trip.']}
      />
    </DiagramFrame>
  )
}
