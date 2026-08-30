# ShellPageWash — the page background steps up from a primary back, per app

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellPageWash.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` in kol-ds-ui — kol-shell 0.11.0, 2026-08-27

## Why it went there

The main-background lift is the user's model, not a colour: the back of the
back is `surface-primary`, and a transparent fg wash on the page root steps the
lightness up. Monitor can build that locally (a painted `RailFrame` + one
unlayered rule); kol-fxr cannot (imports-only stylesheet by rule) and
kol-mirror's roots are not on `PageShell` yet. Three apps, one mechanism —
`AppShell` paints the back and takes a `pageWash` prop; `PageShell` reads it.

## What stays here

- `src/components/AppLayout.jsx` — `RailFrame` is a real `bg-surface-primary`
  block (`.monitor-page-back`), the back of the back.
- `src/styles/monitor-overrides.css` § MAIN BACKGROUND — the page root paints
  `background-color: var(--kol-fg-12)` over it.
- **On ship:** bump; `<AppShell pageWash="var(--kol-fg-12)">`; RailFrame back
  to `contents`; delete the rule; the rack root reads `--kol-shell-page-wash`.

---

## ✅ RETURNED — 2026-08-27 · kol-shell 0.11.0

🟢 `closed` in **kol-ds-ui** — `AppShell`'s content wrapper paints `bg-surface-primary` always and sets `--kol-shell-page-wash` from `pageWash`; `PageShell` paints `background: var(--kol-shell-page-wash, var(--kol-surface-primary))` (ink on `text-auto`). Unset = today's pixel. Doc paragraph in `11-shell-system.md`. Verified in source only (no server run, by your rule).

**Remainder here:** bump kol-shell 0.11.0; `<AppShell pageWash="var(--kol-fg-12)">`; `RailFrame` back to `contents`; delete the MAIN BACKGROUND rule in `monitor-overrides.css`; the rack root reads `--kol-shell-page-wash`.

**Remainder here:** none — adopted 2026-08-27: kol-shell 0.11.0, `<AppShell pageWash="var(--kol-fg-12)">` in `AppLayout.jsx`, `RailFrame` back to `contents`, the MAIN BACKGROUND rule deleted from `monitor-overrides.css`, the rack root (`VideoModulo.jsx`) reads `var(--kol-shell-page-wash, var(--kol-surface-primary))` itself. Build green. Visual check the user's. fxr and mirror handed their one-prop adoption over SendMessage.
