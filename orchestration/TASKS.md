# Build plan — Is3 frontend

Orchestrator: Claude. Builder: kimi (`@moonshot-ai/kimi-code`), run headless per task.
Every task reads `orchestration/BRIEF.md` first. Work happens in `frontend/`.

Status legend: `TODO` → `RUNNING` → `REVIEW` → `DONE` / `REWORK`

---

## T1 — Scaffold and design tokens · `DONE`

> Verified by orchestrator: build exits 0, `base: './'` present, 18/18 tokens in
> `index.css`, three Plex faces wired to Tailwind roles, `strict: true`, zero
> hardcoded hex outside the token block.


Vite + React 18 + TypeScript (strict) + Tailwind in `frontend/`. Map every token
from BRIEF §3 into `tailwind.config.js` `theme.extend`. Self-host the three IBM Plex
faces via `@fontsource`. `HashRouter` with two routes (`/`, `/architecture`) and a
shared app shell: slim top bar (product name, customer name, live-feed indicator,
theme is dark-only for now), content area, footer. Placeholder page bodies.

**Accept when:** `npm run build` exits 0 with no TS errors; `npm run dev` serves both
routes; tokens resolve as Tailwind classes; `vite.config.ts` has `base: './'`.

## T2 — Mock data layer · `DONE`

> Verified by orchestrator: build exits 0 under strict mode; no `Math.random` in the
> layer (doc comments only, so the seed governs everything); `useLiveFeed` clears its
> interval on unmount; exactly 8 pre-defined queries; status derived, not assigned.
> kimi caught and fixed its own bug here — sim state keyed by device object in a
> WeakMap broke after each immutable update and sent the whole fleet offline.


Types for `Device`, `Reading`, `DeviceStatus`, `DeviceKind`. Seeded generator for
240 devices across 6 sites and 5 kinds (camera, switch, fridge, thermostat,
intercom) with plausible per-kind metrics. A `useLiveFeed` hook pushing updates on
an interval to simulate the near-real-time feed, with 24h of backfilled history per
device. Eight pre-defined queries as data (id, label, description, predicate).

**Accept when:** feed is deterministic from a seed; hook cleans up its interval on
unmount; nothing in this layer writes anything a user could trigger; build stays clean.

## T3 — Dashboard page · `DONE` (after one rework)

> Verified by orchestrator via headless screenshot at 1440px and 390px: build 0,
> no console errors, zero hardcoded hex, no free-form input on the page, Esc closes
> the drawer, `prefers-reduced-motion` handled, narrow screen shows
> "Showing 68 of 240 devices".
>
> **Rework issued and completed:** the first build encoded freshness as tick height
> in FleetPulse. Since nearly every device is fresh nearly always, it rendered a
> uniform wall of bright green — giving most of the page's visual weight to devices
> that are fine, when the page's one job is to surface the few that are not. The
> brief was the problem, not the implementation. Height now carries severity,
> opacity carries freshness, order is worst-first. Re-screenshotted and confirmed.


Fleet Pulse hero exactly as BRIEF §3 describes. KPI stat tiles (total, reporting,
needs attention, offline). Filter row (site, kind, status) above the content. Device
grid of cards: name, kind icon, status as **icon + label + colour**, key metric,
last-seen. Click opens a detail drawer with that device's history. Pre-defined query
panel: pick one from the fixed list, see matching devices. No free-form input anywhere.

**Accept when:** Fleet Pulse renders one tick per device with status colour and
freshness height; filters compose; drawer is keyboard-reachable and closes on Esc;
empty state uses the BRIEF §8 copy.

## T4 — Charts · `DONE`

> Verified by orchestrator via screenshot: build 0, no console errors, zero hardcoded
> hex, all four charts carry a Chart/Table toggle, legends use text tokens with a
> coloured mark beside them, time-axis labels do not collide, no dual-axis chart.
> kimi verified Rule 2 empirically — filtering to fridges keeps `--series-3` rather
> than repainting the survivor to slot 1.
>
> Two problems kimi found and fixed on its own: the sparkline shipped without a table
> view (rule 9), and `UptimeTimeline`'s first encoding — worst status per site — was
> uniformly red, because with ~40 devices per site at least one is always bad. It
> bundled the data through esbuild and measured before re-encoding to "worst status
> shared by 2+ devices", which produces real variation.
>
> Weakest point, accepted: `MetricLine` plots shares on a 0–100 axis, so the lines
> cluster near the top. Truncating the axis would read better and be less honest.


Hand-built SVG: per-device sparkline, 24h uptime timeline (one row per site),
status distribution bar, and a fleet-wide metric line chart. All ten rules in
BRIEF §4 apply, including tooltips, legend, direct labels and a table-view toggle.

**Accept when:** no chart has two y-axes; series colours are fixed-order and survive
filtering; every chart has hover + table view; a screenshot shows no label collisions.

## T5 — Architecture section · `DONE`

> Verified by orchestrator via screenshot at 1440px: build 0, zero hardcoded hex,
> `scrollWidth` exactly 360 at mobile width, diagrams are inline SVG (no images, no
> ASCII in a `<pre>`), content faithful to `docs/` including the "deliberately
> excluded" list and the rejected-alternatives column. NFRs grouped by attribute
> rather than dumped as one 14-row wall, as briefed.
>
> One console 404 found — `/favicon.ico`. Not a T5 defect; favicon is T6 scope, and
> it was handed to T6 as a named defect rather than left to be rediscovered.


`/architecture` with: C4 context / container / component diagrams as inline SVG,
frontend component map, read-only stateless data-flow diagram, functional and
non-functional requirements, tech-stack rationale table, and ADR summaries linking
to `docs/adr/`. Same visual language as the dashboard — this is part of the product,
not a README dumped on a page.

**Accept when:** all diagrams are inline SVG (no images, no external renderer); text
matches the decisions actually implemented; page is responsive.

## T6 — Polish, a11y, deploy config · `DONE`

> Verified by orchestrator across both routes at 1440px and 360px: build exits 0,
> **zero console errors and zero failed requests** (the favicon 404 is gone), and
> `scrollWidth` equals the viewport at both widths on both routes — nothing overflows.
> `deploy.yml` uses the modern Pages flow with the correct permissions block and a
> concurrency group; `package-lock.json` exists, so `npm ci` will resolve.
> No `.git` directory was created — kimi respected the hands-off-git constraint.


Responsive pass to 360px. Focus rings, keyboard traversal, `prefers-reduced-motion`.
Lighthouse-level hygiene: title, meta description, favicon, `lang`. Add
`.github/workflows/deploy.yml` building `frontend/` and publishing to GitHub Pages
via `actions/deploy-pages`.

**Accept when:** build clean, no console errors, workflow file valid, quality floor in
BRIEF §7 fully met.

---

## Orchestration protocol

- Each task launched as `kimi --auto -p "<task prompt>"` from `frontend/`'s parent.
- Orchestrator polls the running task **every 2 minutes**, logging to
  `orchestration/logs/`.
- On completion the orchestrator verifies the acceptance criteria itself — by
  running the build and reading the diff — before marking `DONE`. kimi's own claim
  of success is not sufficient evidence.
- A failed criterion sends the task back as `REWORK` with the specific failure, not
  a general "try again".
