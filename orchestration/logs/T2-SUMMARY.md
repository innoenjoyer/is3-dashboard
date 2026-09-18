# T2 — Mock data layer · DONE

## Files added (all under `frontend/src/data/`)

- `types.ts` — `Device`, `Reading`, `Site`, `DeviceStatus`
  (`'good'|'warning'|'serious'|'critical'|'offline'`), `DeviceKind`
  (`'camera'|'switch'|'fridge'|'thermostat'|'intercom'`), per-kind metric
  interfaces (`CameraMetrics`, `SwitchMetrics`, `FridgeMetrics`,
  `ThermostatMetrics`, `IntercomMetrics`), plus label maps for UI use.
- `prng.ts` — seeded deterministic `mulberry32` PRNG plus `range` / `int` /
  `pick` / `normal` / `shuffle` helpers. No `Math.random` anywhere in the
  layer (verified by grep; only mentions are in doc comments).
- `fleet.ts` — `generateFleet(seed, now)`: 240 devices across 6 named sites
  (56/48/40/36/32/28) and 5 kinds (camera 72, switch 60, fridge 36,
  thermostat 42, intercom 30), each with a realistic reporting interval
  (camera ~30 s, switch ~60 s, fridge ~300 s, thermostat ~120 s, intercom
  ~60 s, ±20% jitter). 24 h of backfilled history per device at 5-minute
  resolution (289 readings) with mean-reverting drift and daily cycles.
  Health mix: ~78% healthy, ~8% flaky (occasional missed reports), ~8%
  degraded (genuinely bad metrics), ~3% recovered (bad patch that cleared
  within the last hour), ~3% offline (silent 20 min – 10 h). Also
  `advanceFleet()` (simulation internals for the feed) and `fleetEndTime()`.
- `status.ts` — pure `deriveStatus(device, reading, now)`: last message older
  than `expectedIntervalSec` ⇒ `'offline'`, otherwise kind-specific metric
  thresholds. Status is always derived, never stored or assigned. Plus
  `latestReading()` and `metricStatus()` helpers.
- `useLiveFeed.ts` — React hook: builds the fleet lazily, advances it
  `LIVE_STEP_SEC` (30 s of sim time) every `tickMs` (default 2 s), exposes
  `{ fleet, lastUpdated, paused, setPaused }`. Interval is cleared on unmount
  and on pause. Sim state is keyed by device id so immutable updates keep
  reporting (a WeakMap keyed by object identity broke this — fixed during
  verification).
- `queries.ts` — exactly 8 pre-defined queries as
  `{ id, label, description, predicate }` data objects; pure predicates over
  `(device, now)`: silent over 15 min, fridges above safe temp, critical at
  Northgate Tower, cameras with degraded bitrate, recovered in the last hour,
  intercoms with weak signal, switches near rated load, thermostats off
  target.
- `index.ts` — barrel export.

Read-only constraint: the layer exposes no create/edit/delete/command
function; `advanceFleet` and the PRNG are simulation internals, and the only
control the hook exposes is pausing the local simulation clock.

## Verification

`npm run build` (from `frontend/`) — exit 0, zero TypeScript errors
(`strict`, `noUnusedLocals`, `noUnusedParameters`), zero warnings:

```
> is3-dashboard@0.1.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
✓ 37 modules transformed.
dist/assets/index-TtkWswnd.css    8.38 kB │ gzip:  2.58 kB
dist/assets/index-BHUAXfQr.js    168.07 kB │ gzip: 54.73 kB
✓ built in 916ms
```

Behavioural smoke test (bundled with esbuild, run under node) confirmed:

- same seed ⇒ byte-identical fleet (`deterministic: true`)
- 240 devices; per-site 56/48/40/36/32/28; per-kind 72/60/36/42/30
- status mix at fleet end: good 207, warning 6, serious 7, critical 10,
  offline 10 — genuinely bad devices exist
- offline example: last message 435 min old vs 29 s expected interval
- all 8 queries match a non-zero, sensible number of devices
- after 10 live ticks (+300 sim s): mix stays stable (good 205, warning 8,
  serious 7, critical 10, offline 10) — no flapping regression
