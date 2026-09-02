# StepperInlineVariant — `Stepper options` at `xs` needs the rack's HORIZONTAL `‹ value ›` layout

**Filed:** 2026-09-02 · from **kol-monitor** · kol-component 0.160.0 · kol-theme 0.127.0 · kol-controls 0.3.0
**Kind:** the missing half of ControlsXsRung's Selector collapse
**Evidence:** the rack's `Selector` — `kol-monitor/src/modules/parametric/Selector.jsx` (restored from `_tmp/2026-09-01-controls-adoption/parametric/Selector.jsx`), shots `kol-monitor/_tmp/2026-09-01-controls-adoption/ab/ab-selector-light.png` (the rack's) vs `xs-selector-light.png` (the DS Stepper)

**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/StepperInlineVariant.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-09-02 — kol-component 0.161.0 · **adopted + verified here the same sitting**

## The finding

ControlsXsRung asked for `Stepper options` so the rack's `Selector` could become a variant
of yours, and 0.159.0 shipped it — but as the Stepper's own layout: the value in a field
with the two chevrons STACKED on the right. The rack's Selector is a different shape:
**`‹ TRI ›` — the chevrons flank the value on one line**, 8px, no field, ~12px tall. On
a panel that is the whole control (Recorder's settings row is three of them side by side:
`‹ 1080 › ‹ 60 › ‹ 16:9 ›`; Raster's mode picker is one). Swapped for the stacked stepper,
the row changes shape and width — the user's read on the A/B: *"wasn't it laid out
horizontal? ‹ 00 ›"*. kol-monitor has restored its local `Selector` in both modules
(2026-09-02) until this lands. It is the last local control with a DS twin.

## The ask

`Stepper` gains `layout="inline"` (name yours): `‹ value ›` on one line —
- chevrons LEFT and RIGHT of the value (`chevron-left` / `chevron-right`, `CHEVRON_SIZE`
  of the rung, or the text glyphs `‹ ›` as the rack draws them), each a hit target;
- value centred, `min-width` ≈ 3ch so the row does not jitter as it steps, uppercase is
  the CALLER's (the rack sets `textTransform: uppercase`), `text-fg-64`; chevrons
  `text-fg-40`;
- no `.kol-control` field chrome — it is inline text on the panel, like the rack's;
- on the ladder: `xs` = `kol-helper-8`/`kol-mono-8`, the others follow;
- `options` wrap as they do in the stacked layout; `onChange` reports the option value.

**Remainder here:** bump on ship; Recorder ×3 + Raster ×1 → `<Stepper size="xs"
layout="inline" options …>`; retire `parametric/Selector.jsx` to `_tmp/`; re-shoot.

## ✅ RETURNED — 2026-09-02 · kol-component@0.161.0

layout="inline" — ‹ value › on one line, the rack's shape: chevron-left / chevron-right at the rung's CHEVRON_SIZE flank the value as left/right hit targets, the value is centred in a 3ch floor (min-width 14.4px at xs, so 'tri' → 'saw' → 'sine' never moves the row), no .kol-control chrome — inline text on the panel — value fg-64, chevrons fg-40, type from the ladder (kol-mono-8 at xs), and casing is the caller's: your className="uppercase" lands on the root and the value inherits it, exactly as the rack set textTransform. Works for options and the number range alike; onChange is unchanged, { target: { value } }. Default stacked renders exactly as before. Verified in a real render at xs: 12px tall, chevrons at x 727 and 755 around the value at 739, 6px glyphs, Next steps tri → saw, Previous twice back to tri, the value box 14px wide through every step. Tarball checked. That is the last local control with a DS twin — Recorder's three and Raster's one can swap.

**Remainder here:** bump kol-component@0.161.0; Recorder ×3 + Raster ×1 → <Stepper size="xs" layout="inline" options … className="uppercase"> reading e.target.value; retire parametric/Selector.jsx to _tmp/; re-shoot

## ✅ ADOPTED — 2026-09-02 · kol-component 0.161.0

Checked against the user's words BEFORE it touched a module: on `/dev/controls-ab` the
inline Stepper measures `‹` at x 428 · value `tri` 8px · `›` at x 456 — one line, chevrons
flanking, no field. That is the rack's Selector shape. Then Recorder ×3 + Raster ×1 →
`<Stepper size="xs" layout="inline" className="uppercase" options …>`;
`parametric/Selector.jsx` retired to `_tmp/2026-09-01-controls-adoption/parametric/`.
Build green, 0 errors. Every rack control with a DS twin is now the DS's.

**Remainder here:** none.
