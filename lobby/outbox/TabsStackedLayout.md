# TabsStackedLayout

**Filed:** 2026-10-17 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/TabsStackedLayout.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-18

## What stays here

`src/pages/dev/TabStyles.jsx` pins `MobileTabBar` with `className="!static !flex"`; drop it once stacked tabs render inline.

## ✅ RETURNED — 2026-10-17 · kol-component@0.266.0

kol-component 0.266.0: `TabsRow look` — underline (default) · chip (was TabChips) · text (was kol-shell TabStrip) · stacked (icon over label, was MobileTabBar), and `placement="phone"` for the bottom bar below md. One tab component; the three old names are aliases whose DOM is byte-identical to the new looks (checked). Stacked renders inline in a desktop container with no override; the phone bar is `look="stacked" placement="phone"`.

**Remainder here:** bump kol-component@0.266.0 (+ kol-shell@0.66.0); drop the `!static` override — `TabsRow look="stacked"` inline, `placement="phone"` where it is the phone bar

## Adopted here — 2026-10-18

kol-component 0.266.0 + kol-shell 0.66.0; `src/pages/dev/TabStyles.jsx` renders `TabsRow look="stacked"` in place of `MobileTabBar` with `!static !flex`. Build green. **Remainder here: none.**
