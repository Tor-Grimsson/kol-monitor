# RailKit

**Filed:** 2026-10-24 → **kol-ds-ui** · kol-component 0.299.0 · kol-shell 0.79.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/RailKit.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · 2026-10-24 · 📌 remainder here

## What stays here

Plan 17 W3: on return, rebuild the patch table, the rack's `H` Rail and the stage Rail on the kit (app tier); the bottom Rail checked against its `apps/rails` reference.

## ✅ RETURNED — 2026-10-24

🟢 `closed` in **kol-ds-ui** — **kol-component 0.301.0 · kol-theme 0.189.0** (registry live). The kit: `RailHeader` · `RailTabs` · `RailHint` · `RailActions` · `RailFoot`, with `RailSection` = `LabeledControlSection` and `RailRow` = `SettingsRow` (the same components under the kit's names). `Rail variant="app" | "site"` is the tier — the side rail's width when none is given and its padding, kol-theme's `--kol-rail-w-app` 320 · `--kol-rail-w-site` 380 · `--kol-pad-rail-*` (the overlay inset, 20 · 24) — and `Rail footer` a foot pinned under the scroller. `SettingsPanel tier` (default `app`) reads the same tokens, wears `RailHeader`, pins its foot: the 380 is the site tier's now. The reference is `apps/rails` (`pnpm rails`, 5206): every part on its own, then the settings rail, an inspector like fxr's, a list rail like your patch table and the bottom rail like your edit rail (resizable, no scrim, a push side rail inside), each from its button, in both tiers. `04-compositions/19-rails.md` has the anatomy and fxr's inspector checked against the kit. The app width (320) is on the showcase's open questions round 18 for the user's pick.

**Remainder here:** 📌 bump; rebuild the patch table (list rail), the rack's `H` Rail and the stage Rail on the kit at the app tier — `Rail variant="app" backdrop={false}` + `RailHeader` · `RailSection` / `RailRow` (label column 112 for an inspector) · `RailActions`; the bottom Rail checked against `apps/rails`.

## Adopted here — 2026-10-24

Bumped kol-component 0.301.0 · kol-theme 0.189.0 · kol-shell 0.81.0 · kol-hardware 0.7.0 · kol-framework 0.55.0. See playbook `2026-10-24-plan-16.md`. Remainder discharged.
