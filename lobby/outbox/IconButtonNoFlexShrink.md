# IconButtonNoFlexShrink — an icon-only `Button` is a fixed square; it must not flex

**Filed:** 2026-09-02 · from **kol-monitor** · kol-component 0.162.0 · kol-theme 0.128.0
**Kind:** theme rule, one declaration
**Evidence:** `kol-monitor/src/pages/StagePage.jsx` — the stage's bottom row (`Play · video · Modules · ⚙`), measured in Playwright WebKit at 390 and 1440 (`_tmp/2026-09-01-mobile-qa/`)

**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/IconButtonNoFlexShrink.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-09-02 — kol-theme 0.129.0 · **adopted + verified here the same sitting**

## The finding

`.kol-btn-icon.kol-btn-md { width: 32px; height: 32px }` sizes the square, but the button
is still `flex: 0 1 auto` like any flex item. In a **shrink-to-fit flex row** (an
`absolute bottom-4 right-4 flex gap-2` cluster — the common shape for a page's corner
controls) WebKit measures the icon-only button's intrinsic contribution as its GLYPH
(20px + 2px border = 22px), not the 32px rule, so the row comes out 10px short per
icon button and then shrinks the buttons back to 22×32. The gear on the stage was a
22px sliver beside a 32px Dropdown trigger — the user's "the buttons are a mess, not
the same size". Chrome sizes the row from the rule and never shows it; the phone does.

Adding `flex-shrink: 0` fixes the item but not the measurement (the row stays short and
the neighbour shrinks instead); `flex: none` on the button fixes both — the square then
contributes 32px to the row and cannot be squeezed.

## The ask

`.kol-btn-icon { flex: none; }` — an icon-only button is a fixed square on every rung;
it never grows or shrinks. One declaration in `kol-components-atoms.css`.

**Remainder here:** bump on ship; the stage row keeps `left-4 right-4 justify-end` (a
definite width — right regardless) and drops nothing.

## ✅ RETURNED — 2026-09-02 · kol-theme@0.129.0

One declaration, as asked: .kol-btn-icon { flex: none } — an icon-only button is a fixed square on every rung and neither grows nor shrinks; the measurement and the shrink fixed together, as you found flex-shrink alone did not. Verified in a real render: every icon-only rung computes flex 0 0 auto, and a 32px square dropped into a 60px flex box beside a 200px sibling stays 32×32. Chromium never showed your defect, so the WebKit measurement is yours to confirm on the stage row. Tarball checked.

**Remainder here:** bump kol-theme@0.129.0 and re-measure the stage's bottom row in WebKit at 390 — the gear is 32×32 beside the Dropdown
