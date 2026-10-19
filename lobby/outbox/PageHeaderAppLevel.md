# PageHeaderAppLevel

**Filed:** 2026-10-18 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/PageHeaderAppLevel.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 closed · synced 2026-10-18

## What stays here

On return: bump; drop the dead `size` / `voice` props from monitor's PageHeader calls; Create's title/subtitle
inputs onto the new level's classes.

## ✅ RETURNED — 2026-10-18 · kol-component@0.277.0 · kol-shell@0.72.0

`PageHeader level="app"` — h1 `kol-mono-heading-03` over a `kol-mono-14` lede at oq-64, the retired mono masthead as a level. `page` (display-01) stays the hero. kol-shell 0.72.0: `CatalogPage` (so `HubHome`), `SettingsScaffold` (`HubSettings`), `HubDev` and `AppStudio`'s create page default to `app`; `header.level` still wins. New export `PAGE_HEADER_ROLES` — `{ page | app | section: { title, lede } }` — for Create's inputs (`PAGE_HEADER_ROLES.app.title` / `.lede`).

**Remainder here:** bump kol-component@0.277.0 + kol-shell@0.72.0 (tarballs HTTP 200); style Create's inputs from `PAGE_HEADER_ROLES.app`

## Adopted here — 2026-10-18

kol-component 0.277.0 + kol-shell 0.72.0; ModuleDetail, PatchDetail and Create pass `level="app"` (dead `size`/`voice` dropped); Create's inputs read `PAGE_HEADER_ROLES.app`. **Remainder here: none.**
