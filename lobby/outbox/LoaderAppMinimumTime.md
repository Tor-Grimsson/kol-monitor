# LoaderAppMinimumTime

**Filed:** 2026-10-22 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/LoaderAppMinimumTime.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-22

## What stays here

Plan 15 W2.3: bump kol-framework to the version that ships it; `src/main.jsx` keeps calling `hideLoaderApp()` (the default is the ruled 600 ms), then measure a fast load. Closes `inbox/app-loader-minimum-time.md`.

## ✅ RETURNED — 2026-10-22 · kol-framework@0.53.0

kol-framework 0.53.0: `hideLoaderApp({ minMs = 600 } = {})` waits `max(0, minMs − performance.now())` before the two frames and the fade, so the loader holds at least 600 ms from navigation start; a slow load waits nothing extra. Reduced motion drops the fade, not the minimum. Measured: called at 11 ms → done at 616 ms; `minMs: 0` → done at 44 ms. Each app can pass its own `minMs`.

**Remainder here:** none — adopted 2026-10-22.
