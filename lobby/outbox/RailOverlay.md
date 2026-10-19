# RailOverlay

**Filed:** 2026-10-17 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/RailOverlay.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-18

## What stays here

Plan 14 (`.kol/llm-plan/14-dev-tab-shortcuts-workbench.md`) adopts it once it ships.

## ✅ RETURNED — 2026-10-17 · kol-component@0.266.0

kol-component 0.266.0: `Rail` (was `ShellDrawer`, now its alias) — any edge left · right · top · bottom; `mode="over"` (scrim, focus trap, Escape, as before) or `mode="push"` (in the layout, collapses to nothing); `resizable` from the edge facing the page — a bottom rail from its TOP edge (`minSize` · `maxSize` · `onResize`); padding per side (a bottom rail clears the home bar, a top rail the notch). `useDragResize` takes `side` top/bottom (into `--<token>-h`). SettingsPanel, RecordManager and the workshop shell ride Rail. Docs: 04-compositions/17-rail-and-overlay.md names the two words; the component docs were swept (`variant="drawer"` stays — an API value). Verified: bottom push rail dragged up 60 from its top edge, collapsed to 0; top and bottom over-rails flush.

**Remainder here:** bump kol-component@0.266.0; your edit sheet: `Rail side="bottom" mode="push" resizable` (drop the ShellDrawer import and the side-rail padding workaround)

## Adopted here — 2026-10-18

kol-component 0.266.0; `src/rack/Workbench.jsx` is `Rail side="bottom" mode="push" resizable` (its own resize edge and the `besideSidebar` left offset are gone). `RackViewport` wraps the rack and the rail in a column so the rail pushes. Push mode has no × or Esc: `E` opens and closes it. Build green. **Remainder here: none.**

Corrected 2026-10-18 (user): the rail overlays the rack, never pushes it — `mode` left at `over`, `backdrop={false}`, `resizable`. `RackViewport`'s column wrapper reverted.
