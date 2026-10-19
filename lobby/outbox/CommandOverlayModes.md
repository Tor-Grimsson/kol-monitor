# CommandOverlayModes

**Filed:** 2026-10-17 → **kol-ds-ui** · kol-component 0.264.0 · kol-shell 0.64.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/CommandOverlayModes.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` · synced 2026-10-17

## What stays here

Plan 14 (`.kol/llm-plan/14-dev-tab-shortcuts-workbench.md`) adopts it once it ships.

## ✅ RETURNED — 2026-10-17 · kol-component@0.265.0

§1 and §3 shipped in kol-component 0.265.0 + kol-shell 0.65.0. Two layers: `ShellSearchOverlay onBack` / `backLabel` — a drill-in shows a back arrow in the field row (DS tooltip naming where it goes), Backspace on an empty field calls it, focus stays in the field; typing at either layer is your `results`, so "noise" finds Noise from both. Page-aware: shortcut sections take `routes: ['/rack']`; `ShortcutsOverlay currentPath` (AppHub passes it) shows this page's sections first and the rest muted under ELSEWHERE; `shortcutInScope(section, path)` is the same test for binding keys. Verified: Generators → modules → arrow back; on /dev the sheet shows App with Rack and Cables under ELSEWHERE, on /rack all live. §2 — one overlay with modes (CommandOverlay, `S` opening its shortcuts mode) — is held for the user's ruling in kol-ds-ui's plan (5.3).

**Remainder here:** bump kol-component@0.265.0 + kol-shell@0.65.0; drop the "← All" row for `onBack`; add `routes` to the Rack and Cables sections and bind their keys with `shortcutInScope`. §2 waits on the KOL ruling
