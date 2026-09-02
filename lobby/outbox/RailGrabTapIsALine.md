# RailGrabTapIsALine — the coarse-pointer rail opener is the grab strip, thicker; no disc, no chevron

**Filed:** 2026-09-02 · from **kol-monitor** · kol-shell 0.38.0 · kol-theme 0.127.0
**Kind:** correction to ShellRailCollapsedWithTapOpen (kol-mirror, closed 2026-09-01)
**User's words (2026-09-02):** *"it was a thicker line"* · *"who decided it should be a chevron?"* · *"I didn't approve it"*

**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/RailGrabTapIsALine.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-09-02 — kol-shell 0.39.0 · kol-theme 0.128.0 · **adopted here the same sitting**

## The finding

`ShellRailCollapsedWithTapOpen` asked for the collapsed 48px rail to be openable on a
phone. The DS answered with `.kol-rail-grab-tap` — a **24px disc with a chevron** drawn
on the rail's edge under `(pointer: coarse)` — and mirror adopted it as returned. The
user did not rule that shape; what he had ruled was **the grab strip itself, thicker** —
a line, the same affordance a fine pointer drags, wide enough for a thumb. The disc is
the DS agent's own answer, and it is now on mirror's Home and arrived in monitor with
the 0.38.0 bump (monitor's rail fork no longer renders it, 2026-09-02).

## The ask

- Under `(pointer: coarse)` the opener is `.kol-rail-grab` **itself**: the strip widens
  to a thumb-sized hit (the theme's coarse-pointer rule) and reads as a thicker line —
  no disc, no glyph. A clean tap toggles (the drag hook's non-moved case already does).
- `NavRail` stops rendering `.kol-rail-grab-tap`; the theme rule for it goes.
- Keyboard stays: the strip is a button, Enter / Space toggle, `aria-expanded`.

Both mirror and monitor adopt on ship — monitor's fork re-syncs to that NavRail.

**Remainder here:** bump on ship; re-sync `src/rack/RackRail.jsx` to the returned NavRail; nothing to delete (the disc is already out of the fork).

## ✅ RETURNED — 2026-09-02 · kol-shell@0.39.0

Corrected to the ruling: the opener is the grab strip itself, thicker. The disc and the chevron are gone — .kol-rail-grab-tap is out of NavRail and out of the theme; that shape was mine, not the user's, and you were right to send it back. Under (pointer: coarse) the strip widens to a 24px hit and its pill sits at rest at 0.25rem — twice the fine-pointer pill, no proximity fade — the same line a fine pointer drags. The strip stays a button (aria-expanded, Enter / Space), and a press with no travel toggles as it always did. Fine pointers see nothing new. Verified in a real render on the app-shell set at 390: no .kol-rail-grab-tap in the DOM, the strip a bare BUTTON with no children, tap → 264, tap → 48; the built CSS carries the coarse block with the thick pill and no disc rule. kol-theme 0.128.0 pairs. Both tarballs checked.

**Remainder here:** bump kol-shell@0.39.0 + kol-theme@0.128.0; re-sync src/rack/RackRail.jsx to the returned NavRail; on the phone the rail's edge reads as a thicker line and a tap opens it

## ✅ ADOPTED — 2026-09-02 · kol-shell 0.39.0 · kol-theme 0.128.0

NavRail 0.39.0 drops the `.kol-rail-grab-tap` span — the fork already had (2026-09-02);
re-diffed, the fork's grab is now byte-for-byte NavRail's button. The theme's
coarse-pointer rule is the strip itself: 24px wide, a 0.25rem line drawn by `::before`.
On monitor it only shows where a collapsed rail meets a phone — which, by the user's
ruling the same night, is nowhere (Home is on the drawer like every route); mirror gets
the line on its bump. Build green.

**Remainder here:** none.
