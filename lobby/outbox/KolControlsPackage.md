# KolControlsPackage — the rack's hardware controls as `@kolkrabbi/kol-controls`

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/KolControlsPackage.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-09-01 — kol-controls 0.1.0 · kol-theme 0.124.0 · **adopted + verified here the same sitting**

## Why it went there

A package is the DS's to create. The rack's 12 panel controls (`src/modules/parametric/`),
the jack's presentational half, the power rocker and the touch `ParamSheet` are an
instrument-hardware tier that mirror and fxr also carry as local forks — and after the
inks run (12-module-inks-audit, 230 → 0) every one of them reads tokens, so they lift
as they stand. User ruling 2026-09-01: controls published, modules + composition local,
LEDs keep the set's own colours.

## What stays here

- `src/modules/parametric/*`, `utility/JackSocket.jsx`, `PowerModule`'s rocker,
  `ParamSheet.jsx` + `hooks/armLongPress.js`, and the `--monitor-hw-*` / `--monitor-led-*`
  bindings in `monitor-overrides.css` — the working set until the package ships.
- The "DS component sync" run that was to follow the inks run is now THIS ticket's
  remainder, not a local job.

**Remainder here:** on publish — bump, swap the locals for the package (retire to `_tmp/`),
then compare `TextInput` vs `Input` and panel `Dropdown` vs `Dropdown` with the package
in hand; some may collapse onto the DS. Check 4 of RackTierFullConsumption closes by
package boundary.

## ✅ RETURNED — 2026-09-01 · kol-controls@0.1.0

Published: @kolkrabbi/kol-controls 0.1.0, with the token layer in kol-theme 0.124.0 (kol-components-controls.css, in the umbrella; a core consumer imports it as a domain pack). Fifteen exports carried class-for-class from your inventory — Knob · Fader · Toggle · FlipToggle · LED · IconButton · Selector · PanelDropdown · TextInput · PanelLabel · ModuleHeader · JackSocket · LabeledJack · RockerSwitch · ParamSheet — plus armLongPress. Three renamed only where the name already lives in kol-component and the showcase cannot hold two: your Slider is Fader (the hardware word), Dropdown is PanelDropdown, LabeledControl is PanelLabel; everything else keeps its name and its props. Tokens renamed --monitor-* → --kol-ctl-* with the values exactly as ruled, --kol-signal-input / --kol-cv-attenuate under the same prefix, LEDs not on the palette as the user said. Consumer contexts became seams: ModuleHeader powered (your useCasePower), JackSocket takes active · pending · dimPending · cablesHidden · color (HEX — the glow still appends a hex alpha) · onPointerDown, and iconComponent on IconButton / LabeledJack; routing, the registry, the rack and the render loop stay with you. RockerSwitch is PowerModule's switch alone; Case rails stayed local, the rail/case/cable tokens ship. Verified in a real render: all six knob sizes drag against the resolved cap tokens; the jack rings show rest / active / pending / dim-pending / cv from the hex roles and the signal ring glows on the shared rAF; ParamSheet portals to body at z-modal with the DS Slider full-width and closes on Escape. 25 gates clean, and both tarballs checked for stray --monitor- tokens and consumer imports — none. Mirror's bezel / deck and fxr's controls are next candidates once their sessions inventory them.

**Remainder here:** bump kol-theme@0.124.0 + install kol-controls@0.1.0; replace src/modules/parametric/*, the jack's presentational half, ParamSheet/armLongPress and the --monitor-* bindings with the package (Slider→Fader, Dropdown→PanelDropdown, LabeledControl→PanelLabel; JackSocket gets its routing as props; ModuleHeader gets powered); retire the locals to _tmp/; then the TextInput-vs-Input and PanelDropdown-vs-Dropdown comparisons with the package in hand

## ✅ ADOPTED — 2026-09-01 · kol-controls 0.1.0 · kol-theme 0.124.0 · kol-component 0.156.0 (peer)

Same sitting. `parametric/Knob · Toggle · FlipToggle · LED · Selector · TextInput` are
one-line re-export seams; `IconButton` binds monitor's icon set through `iconComponent`;
`ModuleHeader` passes `useCasePower()` as `powered`; `utility/JackSocket.jsx` is the
WIRING seam — routing, registry, pending cable and visibility become the package's
`active · pending · dimPending · cablesHidden · color · onPointerDown`. The three renames
landed at their sites (`Fader` ×3 files, `PanelDropdown` ×3, `PanelLabel` ×4);
`Slider / Dropdown / LabeledControl / ParamSheet / armLongPress` and the old
implementations are in `_tmp/2026-09-01-controls-adoption/`. Token reads moved to
`--kol-ctl-*` (10 files); `monitor-overrides.css` binds no hardware / LED / jack-role
token any more; `src/index.css` imports `kol-components-controls.css` after `core`
(a core consumer imports the packs it renders).

**Verified by running** (preview 4317, Playwright 1440, PID killed after): knob drag
moves the needle · 318 jacks registered · an out→in drag creates a cable (14 → 15) ·
ring rest = `fg-24`, roles resolve from `--kol-ctl-*` · patch table 15 rows · long-press
opens the package `ParamSheet` full-width and closes on tap · light + dark rendered ·
0 console errors. Build green · lint 2346 (unchanged) · `check:inks` 0 · `check:stages` ✓.

**Two seams the package still wants** (filed as `ControlsJackSeams`): `JackSocket`
does not forward a ref to its ring, so the hit-test registration queries
`[style*="border-radius: 50%"]` under the socket — a `ringRef` prop makes that a line;
and `LabeledJack` composes the package's own presentational jack, so a consumer with a
WIRED jack keeps a local `LabeledJack` (12 lines) — a `jackComponent` seam, like
`iconComponent`, retires it.

**TextInput vs Input · PanelDropdown vs Dropdown** — not compared this sitting; the
package is in hand now, so that comparison is its own small pass.

**Remainder here:** none.
