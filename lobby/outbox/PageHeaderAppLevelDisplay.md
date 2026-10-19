# PageHeaderAppLevelDisplay

**Filed:** 2026-10-18 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/PageHeaderAppLevelDisplay.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 closed · synced 2026-10-18

## What stays here

On return: bump; Create's inputs already read `PAGE_HEADER_ROLES.app` — fix their hard-set heights
(`h-[35.2px]` / `h-[18px]`) to the new rung.

## ✅ RETURNED — 2026-10-18 · kol-component@0.279.0 · kol-theme@0.177.0

`PageHeader level="app"`: page's display-01 sized `text-[46px] md:text-[60px]` (no new style), over `.kol-header-lede-app` (19/26 Light, kol-theme 0.177.0). `PAGE_HEADER_ROLES.app` = `{ title: 'kol-sans-display-01 text-[46px] md:text-[60px]', lede: 'kol-header-lede-app' }`. kol-shell 0.72.0's app pages already default to `app`. Reviewed live on Development › Open questions › Round 14 (page · app · section on one CatalogPage).

**Remainder here:** bump kol-component@0.279.0 + kol-theme@0.177.0 (tarballs HTTP 200); style Create's inputs from `PAGE_HEADER_ROLES.app`

## Adopted here — 2026-10-18

kol-component 0.279.0 + kol-theme 0.177.0; Create's inputs sized to the app rung (title h 46/60 leading-none, lede h 26). **Remainder here: none.**
