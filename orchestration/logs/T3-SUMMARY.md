# T3 — Dashboard page · DONE

Date: 2026-09-18

## Files added

- `frontend/src/components/icons.tsx` — inline stroke SVG icons per device kind
  and per status; colour via `currentColor` + Tailwind text tokens only.
- `frontend/src/components/format.ts` — copy helpers (BRIEF §8 style):
  `relativeAge` ("4 min ago"), `timeOfDay`, `primaryMetric`, `metricDisplay`,
  `allMetrics`.
- `frontend/src/components/StatusBadge.tsx` — status always as icon + text
  label + colour, all three.
- `frontend/src/components/FleetPulse.tsx` — signature element per BRIEF §3:
  SVG strip, one 3px tick per device; colour = status, height = freshness
  (15-min staleness window, offline = stub), sorted most-recently-seen left;
  hover/arrow-key cursor reveals the device in a live caption line; click/Enter
  opens the drawer; status changes get a 1.4 s fade highlight only; ResizeObserver
  caps visible ticks ("Showing N of M devices") instead of squashing; status
  legend row under the strip.
- `frontend/src/components/KpiRow.tsx` — total / reporting / needs attention /
  offline, mono data face + `tabular-nums`.
- `frontend/src/components/FilterBar.tsx` — site, kind, status selects composing
  AND; "Clear filters" only while a filter or query is active.
- `frontend/src/components/QueryPanel.tsx` — the 8 pre-defined queries as a
  selectable list (label + description + live match count). No free-form input.
- `frontend/src/components/DeviceCard.tsx` — name, kind icon, StatusBadge,
  primary metric, site, last-seen; whole card is a single button.
- `frontend/src/components/DeviceGrid.tsx` — attention-first ordering
  (critical → serious → warning → offline → good), responsive
  1/2/3-column grid; BRIEF §8 empty state ("No devices match these filters.
  Clear them to see all 240.") with a clear button.
- `frontend/src/components/DeviceDrawer.tsx` — identity, current readings,
  recent history list (sparkline is T4); Escape + overlay click close, focus
  trapped while open, focus returned to trigger on close.

## Files modified

- `frontend/src/pages/DashboardPage.tsx` — full T3 composition on the real
  `useLiveFeed` hook; filters + query compose (AND); clearly marked ChartSection
  placeholder for T4. T1/T2 files untouched. Architecture page untouched.

## Constraint compliance

- Read-only: only selects, query selection, navigation, and the drawer close
  button exist — no control/toggle/edit/delete anywhere.
- Zero hardcoded hex outside `src/index.css`; all colour via Tailwind token
  classes (`fill-status-*`, `text-status-*`, `bg-surface-*`, …) or
  `stroke="var(--series-1)"` for the pulse cursor.
- `prefers-reduced-motion`: index.css neutralises animations/transitions
  globally (including the tick-flash keyframes); data keeps updating.
- Keyboard: every interactive element is a native button/select or a
  `role="listbox"` with arrow-key navigation; global `:focus-visible` ring
  from T1 applies; drawer traps focus and restores it.
- Responsive to 360px: grid collapses to one column, pulse truncates with
  "Showing N of M devices".

## Build output (verbatim)

```
> is3-dashboard@0.1.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
transforming...
✓ 54 modules transformed.
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
dist/assets/index-BmU59yLH.css                                        12.77 kB │ gzip:  3.59 kB
dist/assets/index-4JGrrkI4.js                                        195.70 kB │ gzip: 63.06 kB
✓ built in 1.03s
```

Exit code 0, zero TypeScript errors under strict mode, zero warnings.

## Rework: FleetPulse encoding

The first build encoded freshness as tick height; since nearly every device is
fresh nearly all the time, the strip rendered as a uniform wall of full-height
green — maximum visual weight on the devices that are fine, and the "near-black
+ acid green" look BRIEF §3 forbids. Reworked per the revised BRIEF §3
"Signature element: the Fleet Pulse" subsection (2026-09-18). Only
`frontend/src/components/FleetPulse.tsx` changed.

**New encoding (frontend/src/components/FleetPulse.tsx):**

- **Height carries severity** via `TICK_HEIGHT`: good = 7px short dim tick on
  the baseline, warning = 22px (low), serious = 40px (mid), critical = 64px
  (full height), offline = 12px stub in the offline grey (slightly taller than
  good so the two stubs never read alike).
- **Opacity carries freshness** (was height): non-good ticks map freshness to
  opacity 0.25–1.0 (`MIN_OPACITY` floor, nothing vanishes); good ticks stay dim
  even when fresh (0.2–0.45) so the baseline reads quiet; offline is stale by
  definition and sits at a fixed 0.7.
- **Order is worst-first** via `SEVERITY_RANK` (critical, serious, warning,
  offline, good); within a group, most recently seen first.
- Caption under the heading updated: "One tick per device — height is severity,
  fade is staleness, worst first on the left." (The old "height is freshness,
  freshest on the left" text would have been a lie.)
- Legend reordered worst-first (critical → good) to match the strip; still
  icon + label + colour via StatusBadge.

**Kept intact:** one tick per device, hover readout, click-to-drawer,
status-change flash, reduced-motion handling, keyboard cursor (single tab stop,
arrows/Home/End/Enter), and the narrow-screen "Showing N of M devices"
behaviour. No new colours — all fills remain the `fill-status-*` tokens.

**Verified visually:** headless Chrome screenshot of the built `dist/` output —
the strip is a long quiet dim-green baseline with full-height red critical
spikes, mid orange, low yellow and short grey stubs clustered on the left.
`npm run build` exits 0 with zero TypeScript errors under strict mode, zero
warnings.
