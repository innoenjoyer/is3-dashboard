# T6 — Polish, a11y, deploy config · 2026-09-18

## What changed

**A. Favicon (named defect from T5: `/favicon.ico` 404)**
- `frontend/public/favicon.svg` — new. A 32×32 Fleet Pulse motif: five ticks
  (critical full height, serious mid, warning low, offline stub, good short)
  on a baseline over the `--page-plane` ground, using only LOCKED token hexes.
- `frontend/index.html` — `<link rel="icon" type="image/svg+xml" href="./favicon.svg" />`.
  Relative `href` so it resolves under any Pages subpath. Verified: the served
  build returns 200 for `/favicon.svg` and the server log shows **zero 404s**
  across all eight headless page loads (Chrome no longer requests
  `/favicon.ico` once a `<link rel="icon">` is present).

**B. Page metadata**
- `index.html`: default `<title>Is3 — device fleet status</title>`, meta
  description, `theme-color: #0a1013` (the page plane), Open Graph
  `og:title` / `og:description` / `og:type` / `og:site_name` / `og:image`.
  `lang="en"` was already present on `<html>`.
- Per-route titles via new `frontend/src/useDocumentTitle.ts`
  (`<title>` = `<route> — Is3`, restores the default on unmount).
  Verified live: dashboard renders `Fleet status — Is3`, architecture renders
  `Architecture — Is3`.

**C. Accessibility**
- Skip-to-content link added in `AppShell.tsx` (first Tab stop, visually
  hidden until focused, then a surfaced pill with the standard focus ring).
  `<main>` gained `id="main-content"` + `tabIndex={-1}`.
- **Bug found and fixed during verification:** the skip link's bare
  `href="#main-content"` was intercepted by `HashRouter` — activating it set
  the hash route to `/main-content`, matched no route, and blanked the page.
  The click now `preventDefault()`s and focuses/scrolls `<main>` directly;
  the href remains for semantics.

**E. Deploy configuration**
- `.github/workflows/deploy.yml` at the repository root: push to `main` +
  `workflow_dispatch`; permissions `contents: read`, `pages: write`,
  `id-token: write`; `concurrency: group pages, cancel-in-progress: true`;
  build job (checkout → setup-node@v4 Node 20 with npm cache on
  `frontend/package-lock.json` → `npm ci` → `npm run build` in `frontend/` →
  `actions/upload-pages-artifact@v3` with `path: frontend/dist`) and a deploy
  job (`actions/deploy-pages@v4`, `github-pages` environment).
- `.gitignore` at the root: `node_modules/`, `dist/`, `*.tsbuildinfo`,
  editor and OS cruft.
- `vite.config.ts` confirmed unchanged: `base: './'`.
- No git operations performed — no init, no commit, no push, no remote.

## A11y findings and fixes

Verified by driving headless Chrome over CDP with real keyboard input
(`Input.dispatchKeyEvent`, so `:focus-visible` genuinely applies):

- **Focus rings:** first Tab lands on the skip link (visible, 2px solid
  `rgb(57,135,229)` = `--series-1` ring); the next 12 Tab stops (Fleet Pulse
  strip, all three filter selects, all eight query options) each show the
  same ring. Ring comes from the global `:focus-visible` rule in `index.css`,
  so device cards, drawer controls and chart Chart/Table toggles (all native
  buttons/selects) are covered.
- **Drawer:** opens with focus moved inside (lands on the close button);
  Tab × 6 and Shift+Tab × 2 never leave the dialog; Escape closes it; focus
  returns to the device card that opened it.
- **Heading order:** h1 → h2 → h3 (→ h4 in NFR groups) on both routes, no
  skipped levels; the drawer runs its own h2 → h3 inside the dialog.
- **Colour never alone:** status is icon + label + colour everywhere
  (`StatusBadge`); Fleet Pulse adds height (severity) and opacity (freshness)
  on top of colour, with a legend; charts pair every coloured mark with a
  text label.
- **Reduced motion:** with `prefers-reduced-motion: reduce` emulated, the
  live-feed ping computes to `1e-05s × 1` and transitions to `1e-05s` —
  animation and transitions are off while the feed keeps updating state.

## Responsive (D)

Measured over CDP with `Emulation.setDeviceMetricsOverride` (plain
`--window-size=360` is clamped to a 500px minimum window and produces a
misleading clipped screenshot — noted for future verification runs):

- `/#/` at 360×780: `scrollWidth` 360, zero overflowing elements. Fleet Pulse
  truncates honestly with "Showing 62 of 240 devices".
- `/#/architecture` at 360×780: `scrollWidth` 360, zero page-level overflow.
  The requirements and tech-stack tables (`min-w-[34rem]` / `[44rem]`) sit
  inside `overflow-x-auto` frames and scroll deliberately, as the diagram
  frames do.

## Final verification (F)

`npm run build` in `frontend/`, exit 0, zero TS errors, zero warnings:

```
> is3-dashboard@0.1.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
transforming...
✓ 73 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                        1.13 kB │ gzip:  0.54 kB
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
dist/assets/index-C6Q97g8k.css                                        18.65 kB │ gzip:  4.63 kB
dist/assets/index-BviA4eNR.js                                        245.70 kB │ gzip: 78.14 kB
✓ built in 1.07s
```

`dist/` served over `python3 -m http.server`; both routes screenshotted at
1440×900 and 360×780 (four shots reviewed). Console clean on every load —
no errors, no warnings, no favicon 404; server access log shows zero 404s.
Per-route titles confirmed in the DOM at both widths.
