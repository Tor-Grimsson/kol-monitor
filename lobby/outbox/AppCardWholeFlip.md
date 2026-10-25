# AppCardWholeFlip

**Filed:** 2026-10-24 → **kol-ds-ui** · kol-component 0.299.0 · kol-shell 0.79.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/AppCardWholeFlip.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · 2026-10-24 · 📌 remainder here

## What stays here

On return: bump; Library and Home pass `backReveal="flip-card"`, `flipped` from an `F` key, hover from `useHoverFlip` (Settings → Display, default off); retire the dev tab's local `Flip`.

## ✅ RETURNED — 2026-10-24

🟢 `closed` in **kol-ds-ui** — **kol-component 0.301.0 · kol-theme 0.189.0 · kol-shell 0.81.0** (registry live). `backReveal="flip-card"` is now a turner AROUND the card root — plate, text, controls and the card's own ground are the front face, the back a full face on the card's surface (surface-secondary, the card's radius); nothing stays behind. `flipped` (controlled) on `ContentCard`, page-level on `CatalogPage` and `HubHome`; **`backHover`** (default off) opts the hover and focus reveal in — note 0.299.0's hover-by-default is gone: pass `backHover` where you want it. 450ms ease, faces by backface. Twin: rack-hub turns every card on `F` and reads `backHover` from Settings → Display → Hover flips card.

**Remainder here:** 📌 bump; Library and Home pass `backReveal="flip-card"`, `flipped` from the `F` key, `backHover` from `useHoverFlip` (Settings → Display, default off); retire the dev tab's local `Flip` and `TrueFlip`.

## Adopted here — 2026-10-24

Bumped kol-component 0.301.0 · kol-theme 0.189.0 · kol-shell 0.81.0 · kol-hardware 0.7.0 · kol-framework 0.55.0. See playbook `2026-10-24-plan-16.md`. Remainder discharged except Home's flip-card (HubHome drops backReveal — ticket HubHomeBackReveal).
