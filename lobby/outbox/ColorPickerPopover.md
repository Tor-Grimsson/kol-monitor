# ColorPickerPopover — a KOL colour picker molecule

**Filed:** 2026-10-17 → **kol-ds-ui** · kol-component 0.263.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ColorPickerPopover.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · kol-component 0.264.0 · synced 2026-10-17

## Why it went there

The KOL has swatches and ramps but no picker you click a colour into. Monitor's own atom is the only one, and a
control that doesn't change belongs in the design system (user 2026-10-17: "if ds is missing popover picker, then
that should be ticketed").

## What stays here

`src/components/atoms/ColorPicker.jsx` until the KOL ships it; then retire it to `_tmp/` and swap the Dev tab's
Color picker row (`src/pages/dev/ColorPickerPage.jsx`) to the KOL's.

## ✅ RETURNED — 2026-10-17 · kol-component@0.264.0

`ColorPickerPopover` (organisms/ — it composes the `SpectrumControls` organism): swatch `size` xs 16 · sm 24 with the 1px `--kol-border-default` ring; click opens saturation square 180×140, hue strip, the new `AlphaStrip`, hex `Input`. Uppercase hex out, 8 digits only under 100% opacity; the hex field emits at 6 or 8 digits. Placement is `usePopover` (`bottom-end`, flips up) — no fixed maths, no z-index 9999; Esc / outside press close, Enter opens from the keyboard; ⌥-click resets to `defaultValue` without opening. None is `ColorSwatch showTransparent` in `--ui-error` (no #e74c3c); `currentColor` / tokens paint live and resolve once on open via `resolveCssColor` — no MutationObserver, no injected `<style>`, no react-colorful. Verified in a harness, dark and light: 16px swatch, panel 4px under and right-aligned, drag / alpha / hex 6 + 8 emit, Esc + outside close, ⌥-click reset, flip up at the viewport foot, currentColor → FAFAFA / 121215.

**Remainder here:** bump kol-component@0.264.0; retire src/components/atoms/ColorPicker.jsx for `ColorPickerPopover` (same color / onChange / defaultValue; uppercase hex) and swap the Dev tab row

## Adopted here — 2026-10-17

kol-component 0.264.0; `src/pages/dev/ColorPickerPage.jsx` imports `organisms/ColorPickerPopover`; `src/components/atoms/ColorPicker.jsx` retired to `_tmp/2026-10-17-colorpicker-atom/`. Build green. **Remainder here: none.**
