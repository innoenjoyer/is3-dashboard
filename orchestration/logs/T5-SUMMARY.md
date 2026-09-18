# T5 — Architecture section · SUMMARY

`/architecture` implemented as part of the product: same tokens, typography
roles and restraint as the dashboard. All content is faithful to
`docs/01-requirements.md`, `docs/02-components.md`, `docs/03-tech-stack.md`,
`docs/04-architecture.md` and the three ADRs in `docs/adr/`.

## Files added

- `frontend/src/components/arch/Section.tsx` — page-block frame (display-face
  heading + intro), shared by all sections.
- `frontend/src/components/arch/svg.tsx` — SVG diagram primitives:
  `DiagramFrame` (horizontally scrolling frame, `role="img"` + title/desc),
  `DBox` (C4 node), `Boundary` (dashed system boundary), `Arrow` (shaft +
  explicit polygon head, no marker ids), `DLabel` (multi-line annotation).
  Tokens only; status tokens deliberately unused in diagrams.
- `frontend/src/components/arch/ContextDiagram.tsx` — C4 level 1; calls out
  the absent technician→device arrow.
- `frontend/src/components/arch/ContainerDiagram.tsx` — C4 level 2; gateway →
  stream → processor fan-out to Redis/TimescaleDB/PostgreSQL, read API, SPA
  outside the boundary (accented, series-1).
- `frontend/src/components/arch/SpaComponentDiagram.tsx` — C4 level 3; Feed
  Client → useLiveFeed (accented) → FleetPulse/KpiRow/DeviceGrid →
  DeviceDrawer, View State dashed reads.
- `frontend/src/components/arch/DataFlowDiagram.tsx` — the one-way,
  stateless path device→screen with the NFR-1 latency budget per hop
  (≈900 ms vs 5 s), a bold one-way spine, and a dashed crossed-out return
  line ("no write path exists").
- `frontend/src/components/arch/RequirementsSection.tsx` — FR-1…13 table with
  priority pills + deliberately-excluded line; NFR-1…14 grouped by attribute
  into 7 cards (Performance, Scalability, Availability & reliability,
  Security, Usability & accessibility, Maintainability & portability,
  Observability & cost), each with its measurement.
- `frontend/src/components/arch/ComponentMap.tsx` — this app's real component
  tree as a nested list (App→AppShell→DashboardPage→…, four charts incl.
  Sparkline under DeviceDrawer), `useLiveFeed` chips marking where feed data
  enters.
- `frontend/src/components/arch/TechStackSection.tsx` — all six tables from
  docs/03 including the rejected alternative (struck-through name + reason)
  in every row that has one; Kafka and SSE justification notes kept.
- `frontend/src/components/arch/AdrSection.tsx` — the three ADRs as cards
  (context / decision / trade-off accepted), each linking to its
  `docs/adr/…` file path.

## Files modified

- `frontend/src/pages/ArchitecturePage.tsx` — was a placeholder; now composes
  the seven sections in the required order.

No T1–T4 files were touched.

## Verification

- `npm run build` exits 0, zero TypeScript errors under strict mode (full
  output below).
- Screenshotted the built `/#/architecture` at 1440px and 360px (headless
  Chrome via Playwright, served from `dist/`). Checked every segment.
- 360px: `document.documentElement.scrollWidth === 360` — no page-level
  overflow. Diagrams and wide tables scroll horizontally inside their frames;
  no text shrinks below legibility.
- Console: zero errors / page errors on load.
- Keyboard: only interactive elements are the three ADR links; each shows the
  global 2px focus ring (verified via computed style on focus).
- `prefers-reduced-motion`: page has no animations or timed transitions; the
  global reduce rule in `index.css` covers the shell.
- Grep over `src/components/arch/` confirms zero hardcoded hex values.
- Fixes made after screenshot review: data-flow hop label "SSE · render"
  overlapped the last gap's boxes → shortened to "SSE"; FR id column wrapped
  ("FR-\n10") at narrow widths → `whitespace-nowrap`.

## Exact build output

```
> is3-dashboard@0.1.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
transforming...
✓ 72 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                        0.43 kB │ gzip:  0.29 kB
dist/assets/ibm-plex-mono-latin-400-normal-CvHOgSBP.woff              13.14 kB
dist/assets/ibm-plex-mono-latin-500-normal-CB9ihrfo.woff              13.16 kB
dist/assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2             14.71 kB
dist/assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2             14.89 kB
dist/assets/ibm-plex-sans-condensed-latin-600-normal-6XnkKYvF.woff    18.76 kB
dist/assets/ibm-plex-sans-condensed-latin-600-normal-CRd5VyFf.woff2   19.82 kB
dist/assets/ibm-plex-sans-latin-400-normal-CYLoc0-x.woff              22.10 kB
dist/assets/ibm-plex-sans-latin-400-normal-CDDApCn2.woff2             22.59 kB
dist/assets/ibm-plex-sans-latin-500-normal-BgVn5rGT.woff              23.92 kB
dist/assets/ibm-plex-sans-latin-500-normal-6ng42L7E.woff2             24.18 kB
dist/assets/index-DF2rqeF_.css                                        17.95 kB │ gzip:  4.48 kB
dist/assets/index-Bgt4En6_.js                                        245.10 kB │ gzip: 77.93 kB
✓ built in 1.09s
```

Exit code: 0.
