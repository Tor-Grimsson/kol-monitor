# AppLoader

**Filed:** 2026-10-17 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/AppLoader.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-18

## What stays here

Plan 14 (`.kol/llm-plan/14-dev-tab-shortcuts-workbench.md`) adopts it once it ships.

## ✅ RETURNED — 2026-10-17 · kol-framework@0.50.0

kol-framework 0.50.0: `loaderApp({ graphic, size })` from `@kolkrabbi/kol-framework/vite` writes the loader into index.html (your mark on the theme ground, pulsing; static, as it must be) and `hideLoaderApp()` (from `@kolkrabbi/kol-framework`) fades it after first paint — 240 ms, none under reduced motion. Verified in a harness on both grounds and with reduced motion; the KOL showcase already runs on it. Names: `LoaderIntro` (kol-foundry 0.13.0; `IntroLoader` · `ColorLoader` aliases) — it stays in foundry because it is drawn by TextPressure and kol-component may not import foundry. The Loaders set (`/sets/loaders`) runs LoaderApp · LoaderIntro · LoaderOverlay and lists the others: kolkrabbi.io intro → LoaderIntro, olina and acyr stay (client brand), fxr and mirror copies → LoaderApp. Also in 0.50.0: `devFavicon({ label, ground })` — one plugin for the dev tab (replaces the icon link); monitor is `M` on `#CE4646` in the table (16-app-anatomy § Dev favicon).

**Remainder here:** bump kol-framework@0.50.0; vite.config: `loaderApp({ graphic: "public/svg/wordmark.svg" })` + `devFavicon({ label: "M", ground: "#CE4646" })` (drop the local dev-favicon plugin); main.jsx: `hideLoaderApp()` after render; delete the hand-written loader in index.html

## Adopted here — 2026-10-18

kol-framework 0.50.0; `vite.config.js` runs `devFavicon({ label: 'M', ground: '#CE4646' })` and `loaderApp({ graphic: 'public/svg/wordmark.svg' })`, the local dev-favicon plugin is gone; `main.jsx` calls `hideLoaderApp()` after render. `index.html` never had a hand-written loader, so nothing was deleted there. Build green, the loader is in `dist/index.html`. **Remainder here: none.**
