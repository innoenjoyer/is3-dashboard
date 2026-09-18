# Is3 Dashboard — build brief

Single source of truth for every build task. Do not invent alternatives to
anything marked **LOCKED**. If something here is impossible, stop and write the
problem into `orchestration/logs/BLOCKED.md` instead of improvising.

---

## 1. What we are building

A near-real-time dashboard that shows a customer the status of their registered
IoT devices (cameras, electric switches, fridges, thermostats, intercoms) on one
screen, plus a section documenting the frontend architecture.

**Constraints from the assignment — LOCKED:**

- The system is **read-only**. The customer never creates, edits or deletes data.
- Device data is **stateless** status pushed from devices in the field. We only
  present it.
- **No registration, no sign-up flow.** Customers are added manually by the sales
  team. Assume the user is already authenticated and their devices are registered.
- The only "input" a user has is **pre-defined queries** — a fixed list they pick
  from. Never a free-form query builder, never a text box that writes anything.

Anything that implies writing to devices (toggle a switch, set a thermostat) is
**out of scope and must not appear in the UI**, not even greyed out.

There is no backend. All data comes from a mock layer that simulates a live feed.

---

## 2. Audience and the page's one job

The user is a **facilities technician** watching a fleet of a few hundred devices
across several sites. The dashboard's single job:

> Tell me, at a glance, which devices need my attention right now.

Every design decision serves that sentence. A pretty element that does not help
answer it gets cut.

---

## 3. Visual direction — LOCKED

### Concept: "the building at night"

A device fleet is a building you cannot see into. The dashboard is the lit
floor-plan: each device is a lit cell, darkness means it stopped reporting. The
ground is not generic near-black — it is a **deep petrol/slate**, the colour of an
instrument panel in a dark room.

**Explicitly forbidden** (these are the current generic-AI defaults):

- cream `#F4F1EA` background with a high-contrast serif and a terracotta accent
- pure near-black with a single acid-green or vermilion accent
- broadsheet layout: hairline rules everywhere, zero border-radius, newspaper columns
- a hero that is one big gradient number with a small label

### Signature element: the Fleet Pulse

The hero is **not** a headline and **not** a big number. It is a full-width dense
strip of one thin vertical tick per device, one per column, packed tight:

- **tick colour** = device status (good / warning / serious / critical / offline)
- **tick height** = **severity**. A healthy device is a short, dim tick sitting on
  the baseline. Severity raises it: warning is low, serious is mid, critical is full
  height. Offline is a distinct short stub in the offline grey.
- **tick opacity** = data freshness — a device going stale fades toward the surface.
  Freshness is the secondary cue; severity owns height.
- **order** = worst first. Critical, serious, warning, offline, then good. Within a
  group, most recently seen first.
- ticks update as the mock feed pushes new readings; a tick that changes status
  gets a brief highlight, nothing more

**Why height carries severity, not freshness** (revision, 2026-09-18 — the first
build encoded freshness and was screenshotted): nearly every device is fresh nearly
all the time, so a freshness-driven height produced a uniform wall of full-height
green. It gave the overwhelming majority of the page's visual weight to devices that
are fine, while the page's one job is to surface the few that are not. Severity-driven
height inverts that: the strip reads as a quiet baseline with spikes exactly where the
trouble is, and it grows louder as the fleet degrades. It also double-encodes status
as colour **and** height, which is what §3 requires anyway — status must never rest
on colour alone.

It is the one bold thing on the page. It encodes real information — fleet size,
status mix, and staleness — so it is structure, not decoration. Everything around
it stays quiet and disciplined. Hovering a tick shows that device; clicking it
opens that device's detail.

### Colour tokens — LOCKED

Define these once as CSS custom properties and reference by role. Never hardcode
a hex anywhere else.

```
/* surfaces & ink */
--page-plane:      #0a1013
--surface-1:       #0f1619   /* card / chart surface */
--surface-2:       #141d21   /* raised: drawer, popover */
--text-primary:    #ffffff
--text-secondary:  #c3c2b7
--text-muted:      #898781   /* axis & labels */
--gridline:        #2c2c2a
--baseline:        #383835
--border:          rgba(255,255,255,0.10)

/* device status — RESERVED, never reused as a chart series */
--status-good:     #0ca30c
--status-warning:  #fab219
--status-serious:  #ec835a
--status-critical: #d03b3b
--status-offline:  #56605f   /* stopped reporting: desaturated, reads as "dark" */

/* chart series — fixed order, never cycled */
--series-1:        #3987e5
--series-2:        #d95926
--series-3:        #199e70
--series-4:        #c98500
```

The four series colours were validated against surface `#0f1619` in dark mode:
lightness band, chroma floor, CVD separation, normal-vision floor and 3:1 contrast
all pass. **Do not substitute or add a fifth series colour.** A fifth category
folds into "Other" or becomes a small multiple.

Status colours pass 3:1 contrast on our surface but several sit close together for
colour-blind viewers. Therefore, **hard rule**: a status is *never* communicated by
colour alone. Every status indicator ships as **icon + text label + colour**,
always all three.

### Typography — LOCKED

One superfamily, three roles. IBM Plex was drawn for industrial and machine
contexts, which is exactly this subject.

| Role | Face | Use |
|---|---|---|
| Display | **IBM Plex Sans Condensed**, 600 | section headings, eyebrows, KPI labels |
| Body | **IBM Plex Sans**, 400/500 | prose, UI labels, buttons |
| Data | **IBM Plex Mono**, 400/500 | all numbers, IDs, timestamps, axis ticks, telemetry |

Self-host via `@fontsource` packages — no runtime Google Fonts request, because the
site must work as a static build on GitHub Pages. Every numeric column uses
`font-variant-numeric: tabular-nums` so digits line up.

### Motion

One orchestrated idea, not scattered effects: **the feed is alive**. New readings
cause a short value cross-fade and a 1-tick pulse on the Fleet Pulse strip.
Nothing else animates on a timer. Page transitions and hover states are ≤150ms.
`prefers-reduced-motion: reduce` disables the pulse and all transitions — the
dashboard still updates, just without animation.

---

## 4. Chart rules — LOCKED

These come from a data-visualisation standard; violating them is a defect.

1. **Never a dual-axis chart.** Two measures of different scale → two charts.
2. Series colours assigned in fixed order (series-1, then -2, …), **never cycled**
   and never reassigned when a filter changes the series count. Colour follows the
   device/metric, not its rank.
3. Sequential magnitude = one hue light→dark. Diverging = two hues with a **grey**
   midpoint. Never a rainbow.
4. Marks: 2px lines, ≥8px hover markers, bar/segment data-ends rounded 4px anchored
   to the baseline, 2px surface-coloured gap between adjacent fills and a 2px
   surface ring where marks overlap.
5. Grid and axes are recessive — hairline `--gridline`, labels in `--text-muted`.
6. **Hover layer is mandatory**: crosshair + tooltip on line/area charts, per-mark
   tooltip on bars/cells. The only exception is a bare stat tile with no plot.
7. Two or more series ⇒ a legend is always present, and ≤4 series are also direct-
   labelled. Identity is never carried by colour alone.
8. Text wears text tokens, never the series colour. A coloured mark sits *beside*
   the label to carry identity.
9. Every chart has a **table view** toggle exposing the same numbers.
10. Never print a number on every point — label selectively.

---

## 5. Tech stack — LOCKED

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite 5** | static output, required for GitHub Pages |
| UI | **React 18 + TypeScript** (strict) | component model matches the architecture doc |
| Styling | **Tailwind CSS** with our tokens mapped into `theme.extend` | tokens stay single-source |
| Routing | **react-router-dom** with `HashRouter` | GitHub Pages has no SPA rewrite; hash routing avoids 404s on refresh |
| Charts | **hand-built SVG React components** | the rules above are non-negotiable and chart libraries fight them |
| Fonts | **@fontsource/ibm-plex-\*** | self-hosted, offline-safe |
| Dates | **date-fns** | small, tree-shakeable |

No state-management library. Read-only data + a couple of hooks is the whole
surface; Redux here would be architecture theatre.

`vite.config.ts` must set `base: './'` so the build works from any Pages subpath.

---

## 6. Routes

| Path | Contents |
|---|---|
| `/` | Fleet Pulse hero, KPI tiles, filters, device grid, charts, pre-defined queries |
| `/architecture` | C4 diagrams, frontend component map, data flow, NFRs, stack rationale, ADR list |

---

## 7. Quality floor — non-negotiable

- Responsive to 360px wide. The device grid reflows; the Fleet Pulse stays legible
  by reducing tick count with a "showing N of M" note, never by squashing.
- Visible keyboard focus ring on every interactive element. Full keyboard path
  through filters, grid and drawer.
- `prefers-reduced-motion` respected.
- Colour never the sole carrier of meaning (status = icon + label + colour).
- `npm run build` completes with **zero** TypeScript errors and zero warnings.
- No console errors at runtime.

---

## 8. Copy rules

Write from the technician's side of the screen. Name things by what they see, not
how we built it: "Last reported 4 min ago", not "stale telemetry payload". Active
voice, sentence case, no filler. An empty filter result is an invitation, not a
shrug: "No devices match these filters. Clear them to see all 240." Errors say what
happened and what to do, and never apologise.
