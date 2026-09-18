# ADR-003 — Charts are hand-built SVG components, not a charting library

**Status:** Accepted

## Context

The dashboard needs sparklines, an uptime timeline, a status distribution and a fleet
metric line. We also committed to a set of visualisation rules: fixed-order series
colours that never cycle or repaint on filtering, no dual-axis charts ever, a
mandatory hover layer, a legend plus selective direct labels for every multi-series
chart, and a table view exposing the same numbers (NFR-10).

Forces:

- Status must never be carried by colour alone; the CVD analysis of our palette makes
  icon + label mandatory alongside colour.
- The chart layer re-renders on every feed tick, so runtime weight matters (NFR-4).
- The bundle ships to a CDN; every kilobyte is on the critical path (NFR-2).

Alternatives considered:

1. **Recharts.** Familiar, React-native API. Its defaults cycle colours by series
   index, so a filter that removes a series repaints the survivors — exactly the
   behaviour our rules forbid. Overriding it means fighting the library on nearly
   every chart.
2. **Chart.js.** Canvas-based, so the marks are not in the DOM: accessible labels and
   a keyboard path have to be rebuilt separately anyway.
3. **D3 directly.** Gives full control, but its imperative DOM ownership sits badly
   beside React's.
4. **Hand-built SVG React components**, using `d3-scale` for maths only.

## Decision

Option 4. Small SVG components, one per chart form, sharing a scale and axis helper.
Series colours come from tokens keyed by entity identity, never by array index.

## Consequences

Accepted:

- Every rule is enforceable because we own the render path.
- Marks are real DOM nodes, so labels, focus and the table view come naturally.
- The chart layer costs a few kilobytes rather than tens.

Given up:

- We implement axes, ticks, tooltips and legends ourselves, and they need tests.
- No free advanced chart types. Acceptable: the dashboard needs four known forms, and
  the form list is driven by the requirements rather than by exploration.
- A future team member expecting a familiar library API has to learn ours instead.
