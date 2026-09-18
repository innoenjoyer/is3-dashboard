# T4 — Charts · DONE

Hand-built SVG React components in `frontend/src/components/charts/`. No charting
library added; scale maths are a 20-line `niceTicks` helper, so no new dependency
was needed at all.

## Files added

- `charts/chartUtils.ts` — shared 24h/30-min bucket window, historical
  `statusAt()` lookup, nice-tick maths, responsive time-tick count, container
  measuring hook, 24h `HH:MM` tick formatter.
- `charts/ChartCard.tsx` — the frame every chart ships in: title, subtitle, and
  the **Chart/Table toggle** (rule 9). Table view exposes the same numbers as
  the marks, sticky header, scrollable, mono tabular digits.
- `charts/LinePlot.tsx` — shared line engine behind Sparkline and MetricLine:
  recessive grid, 2px lines, crosshair + tooltip hover layer (mirrored to the
  keyboard via arrow keys), legend for 2+ series, collision-free direct end
  labels, ringed hover markers.
- `charts/Sparkline.tsx` — single device's primary metric over 24h (bitrate /
  load / temperature / actual temperature / signal per kind). Mounted in
  `DeviceDrawer`, replacing the T3 history-list placeholder. Single series in
  `var(--series-1)`; no legend box — the card title names the metric.
- `charts/UptimeTimeline.tsx` — one row per site, 48 half-hour buckets merged
  into rounded segments with 2px surface gaps; keyboard cursor (arrow keys) +
  per-segment tooltips; icon+label status legend; 48×sites table view.
- `charts/StatusDistribution.tsx` — fleet composition as one stacked bar,
  worst-first, reserved status tokens, counts printed only on segments wide
  enough to hold them; icon+label+count legend; focusable segments with
  tooltips; status/count/share table view.
- `charts/MetricLine.tsx` — fleet health by device kind (% reporting good per
  30 min over 24h).
- `charts/ChartSection.tsx` — composes timeline + metric line + distribution;
  replaces the marked placeholder in `DashboardPage` and receives the filtered
  fleet, so charts compose with the page filters.

## Files modified (T4 wiring only)

- `frontend/src/pages/DashboardPage.tsx` — placeholder section →
  `<ChartSection devices={filtered} now={now} />`.
- `frontend/src/components/DeviceDrawer.tsx` — history list →
  `<Sparkline device now />`; unused imports removed; doc comment updated.

## MetricLine: per kind, not per site — why

The uptime timeline already slices the same 24h window by site, so a per-site
line would repeat that cut. Slicing by kind answers the question the timeline
cannot: *which device type* is driving the trouble. The fixed entity→colour
map is camera→series-1, switch→series-2, fridge→series-3, thermostat→series-4;
intercoms (the fifth and smallest kind, 30 devices) fold into **Other** in
muted grey — never a fifth series colour. Verified live: filtering to
Kind=fridge leaves one line still wearing `var(--series-3)` with a
"Fridges · 92 %" direct label — colour follows the entity, never the rank
(rule 2).

## Two data traps found by screenshotting, fixed

1. **Historical offline artifact.** Backfilled history is at 5-minute
   resolution but devices report every 24–360s, so a strict
   `age > expectedInterval` check painted the entire past as offline-grey.
   `statusAt()` now floors the staleness window at the history resolution
   (`max(expectedIntervalSec, HISTORY_STEP_SEC)`), documented in code.
2. **Red-wall timeline.** Worst-status-of-1-device pins five of six sites at
   critical for all 48 buckets (verified numerically against the seeded fleet:
   zero transitions). The bucket semantics are now "worst status shared by
   ≥2 devices at the site" — a single faulty device is already visible in the
   Fleet Pulse, grid and drawer; a site row should show site-wide conditions.
   This surfaced real structure: sustained critical at Northgate/Harbour Quay,
   flicker at Depot 4, an episode at Old Mill Works.
3. Also fixed after looking: x-axis tick collisions at drawer width — tick
   count now follows plot width (`timeTickCount`, 2–5 ticks) and ticks use a
   compact 24h `HH:MM` format.

## Rules exercised per chart

| Rule | Sparkline | UptimeTimeline | StatusDistribution | MetricLine |
|---|---|---|---|---|
| 1 single scale | ✓ (own y domain) | n/a (categorical) | n/a (counts) | ✓ fixed 0–100 % |
| 2 fixed colours | ✓ always series-1 | status tokens | status tokens | ✓ fixed kind→token map, verified under filtering |
| 3 max 4 + Other | ✓ single series | 5 statuses (reserved set) | 5 statuses (reserved set) | ✓ intercoms fold into Other |
| 4 marks | 2px line, 12px ringed hover markers | rounded 4px ends, 2px gaps | rounded 4px ends, 2px gaps | 2px lines, 12px ringed markers |
| 5 recessive grid | ✓ hairline gridline, muted labels | ✓ | n/a | ✓ |
| 6 hover layer | ✓ crosshair+tooltip, arrow keys | ✓ per-segment tooltip + keyboard cursor | ✓ per-segment tooltip, hover+focus | ✓ crosshair+tooltip, arrow keys |
| 7 legend + direct labels | n/a (1 series, title names it) | ✓ icon legend | ✓ icon+label+count legend | ✓ legend ≥2 series; direct labels ≤4 series |
| 8 text in text tokens | ✓ swatch beside label in tooltip | ✓ | ✓ StatusBadge + token counts | ✓ swatch beside label |
| 9 table toggle | ✓ every plotted point | ✓ 48×sites status grid | ✓ status/count/share | ✓ 48 buckets × series |
| 10 selective numbers | ✓ latest value only, in subtitle | ✓ no numbers on marks | ✓ counts only on wide segments | ✓ end labels only |

Constraints: zero hardcoded hex (all colour via `var(--*)` tokens), keyboard
operable (toggles are buttons; line charts have an arrow-key cursor; the
timeline is one tab stop with a 2D cursor; distribution segments are
focusable), no animations in charts at all (reduced-motion trivially
respected; transitions are killed globally per T1 CSS), legible at 360px
(verified by screenshot), read-only UI (no new inputs beyond the Chart/Table
toggle).

## Verification

- `npm run build` — exit 0, zero TypeScript errors (strict), zero warnings:
  ```
  > tsc -b && vite build
  ✓ 62 modules transformed.
  dist/assets/index-DFAYYx_c.css   15.43 kB │ gzip:  4.11 kB
  dist/assets/index-Baxk-OtD.js   214.06 kB │ gzip: 68.58 kB
  ✓ built in 1.03s
  ```
- Headless Chrome screenshots of the built `dist/` at 1440px and 360px:
  inspected for label collisions, tick overlap, axis overflow and density;
  issues found were fixed (see above) and re-screenshotted.
- Interaction via CDP: hover crosshair+tooltip on MetricLine and Sparkline,
  Chart→Table toggle on both, drawer open via device card click, Kind=fridge
  filter for colour stability. Console: zero errors, zero warnings.
