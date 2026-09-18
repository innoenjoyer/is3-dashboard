# T1 — Scaffold and design tokens · summary

Date: 2026-09-18. Builder: kimi.

## What was done

- Scaffolded Vite 5 + React 18 + TypeScript (strict) + Tailwind CSS 3 in `frontend/`.
- All 18 colour tokens from BRIEF §3 defined once as CSS custom properties in
  `src/index.css` (`:root`) and mapped into `tailwind.config.js` `theme.extend.colors`
  as `var(--token)` references. No hex values anywhere else in the codebase.
- Self-hosted fonts via `@fontsource` (latin subsets): IBM Plex Sans 400/500,
  IBM Plex Sans Condensed 600, IBM Plex Mono 400/500 — wired as Tailwind families
  `font-sans` (body), `font-display`, `font-data`.
- `react-router-dom` with `HashRouter`, routes `/` and `/architecture`, placeholder
  page bodies.
- Shared `AppShell`: slim top bar with product name `Is3`, nav links, customer name
  (`Northgate Facilities`), live-feed indicator dot; content area; minimal footer.
  Dark-only (`color-scheme: dark`).
- `vite.config.ts` sets `base: './'` — verified: built `dist/index.html` references
  `./assets/...`.
- `font-variant-numeric: tabular-nums` utility (`.tnums`, `time`, `[data-numeric]`);
  `lang="en"` on `<html>`; visible `:focus-visible` ring; `prefers-reduced-motion`
  respected.

## Files added

- `frontend/package.json`, `frontend/package-lock.json`
- `frontend/vite.config.ts` (`base: './'`)
- `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json` (strict)
- `frontend/tailwind.config.js`, `frontend/postcss.config.js`
- `frontend/index.html`
- `frontend/src/index.css` (font imports, token custom properties, base styles)
- `frontend/src/main.tsx`, `frontend/src/App.tsx`
- `frontend/src/components/AppShell.tsx`
- `frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/ArchitecturePage.tsx`

## Verification

`npm install` completed. `npm run build` exits 0, zero TypeScript errors, zero warnings:

```
> is3-dashboard@0.1.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
transforming...
✓ 37 modules transformed.
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
dist/assets/index-TtkWswnd.css                                         8.38 kB │ gzip:  2.58 kB
dist/assets/index-BHUAXfQr.js                                        168.07 kB │ gzip: 54.73 kB
✓ built in 900ms
```

`npm run dev` smoke-tested: both `/` and `/architecture` serve the app (hash
routing, so both return the same `index.html` with title `Is3 — device fleet status`).
