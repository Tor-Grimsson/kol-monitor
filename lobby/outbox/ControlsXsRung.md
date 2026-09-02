# ControlsXsRung — an `xs` size rung, and three kol-controls collapse onto the DS

**Filed:** 2026-09-01 · from **kol-monitor** · kol-component 0.156.0 · kol-theme 0.124.0 · kol-controls 0.2.0
**Kind:** additive DS change + a kol-controls retirement that follows it
**Evidence:** the A/B page — `kol-monitor/src/pages/dev/ControlsAbPage.jsx` (`/dev/controls-ab`), shots in `kol-monitor/_tmp/2026-09-01-controls-adoption/ab/`, artifact "Controls A/B" (2026-09-01)
**User's words (2026-09-01):** *"DS should ship xs size — I actually often find situations where xs would be helpful … if we had xs we could make a full swap … selector could be a variant of ours if we make it follow the size ladder … the only thing I would leave as is is the icon button, it's genuinely unique."*

**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ControlsXsRung.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-09-01 — kol-theme 0.126.0 · kol-component 0.159.0 · kol-controls 0.3.0 · **adopted + verified here the same sitting**

## The finding

Four kol-controls have a kol-component twin: `TextInput` ↔ `Input`, `PanelDropdown` ↔
`Dropdown`, `Selector` ↔ `Stepper`, `IconButton` ↔ `Button iconOnly`. Rendered side by
side with the same data on a module panel (light + dark), **none collapse today, and for
one reason**: the DS ladder's smallest rung is `sm` — `kol-mono-12` in a 28–32px shell
(`.kol-control-sm`, `.kol-btn-sm 28`, glyphs SOLO 16 · ADJACENT 14 · INDICATOR 12) — and
an instrument panel runs **8px in 16–20px**. The type for a smaller rung already ships
(`kol-mono-8`, `kol-mono-10`, `kol-helper-8/10`); the shell does not. The only `xs` in the
theme is `--kol-radius-xs`.

The rack's own densities, read off kol-controls 0.2.0:

| Control | Type | Shell | Padding | Radius | Glyph |
|---|---|---|---|---|---|
| `TextInput` | `kol-helper-8` | ≈ 20px | 4 × 8 | 2 | — |
| `PanelDropdown` trigger | `kol-helper-8` | ≈ 16px | 2 × 6 | 2 | — (rows 3 × 8) |
| `Selector` | `kol-helper-8` | ≈ 12px | 0 × 2 | — | ‹ › text |
| `IconButton` | — | ≈ 18px | 3 | 3 | icon 10 |

## The ask

### 1. An `xs` rung on the shell ladder (additive)

- kol-theme: `.kol-control-xs` and `.kol-btn-xs` — **8px mono · 18–20px shell · padding
  2–4 × 6–8 · radius 2** (the rack's numbers above; yours to set, but that is the density
  a panel needs).
- kol-component: an `xs` row in `SIZE_TYPE` for `Input`, `Dropdown`, `Stepper`, `Button`
  (`kol-mono-8`); an `xs` entry in the three glyph ladders (`SOLO 12 · ADJACENT 10 ·
  INDICATOR 8` reads right); `Stepper`'s `CHEVRON_SIZE.xs = 6`.
- The 2026-07-28 law ("dropdowns are `sm` at every viewport") is untouched — `xs` is
  opt-in by prop, never a viewport ramp.

### 2. Two prop additions that the swap needs

- **`Input onCommit`** — the rack commits a value on blur / Enter (module names, scope
  expressions), not on every keystroke. `TextInput` carries it; `Input` has `onChange`
  only. A consumer can wrap it; the DS should just have it.
- **`Stepper options`** — step through a list instead of a number range
  (`<Stepper size="xs" options={['sine','tri','saw']} value="tri" onChange />`, reporting
  the value not the index). That is `Selector` as a variant of yours, on the ladder.

### 3. Then kol-controls 0.3.0 retires three

`TextInput`, `PanelDropdown`, `Selector` go (deprecated aliases for one release if you
want), and kol-controls is exactly the set with no app twin: Knob · Fader · Toggle ·
FlipToggle · LED · IconButton · PanelLabel · ModuleHeader · JackSocket · LabeledJack ·
RockerSwitch · ParamSheet. **`IconButton` stays** — the lit state (LED-red border + wash)
and the momentary pulse are hardware semantics the DS button does not have and should not.

### An observation from the A/B, not a request

`Input size="sm" variant="filled"` on `bg-surface-secondary` rendered with no visible
shell (light and dark) — the filled fill sits at the panel's own value. `variant="outline"`
would read; worth knowing for xs on a panel.

**Remainder here:** on ship — bump theme + component + kol-controls 0.3.0; point
`parametric/TextInput.jsx` at `Input size="xs" onCommit`, `parametric/PanelDropdown`
sites at `Dropdown size="xs" variant="grey"` under `PanelLabel`, `Selector` sites at
`Stepper size="xs" options`; retire the three seams to `_tmp/`; re-shoot `/dev/controls-ab`.

## ✅ RETURNED — 2026-09-01 · kol-controls@0.3.0

All three parts, on the user's words. (1) The xs rung: kol-theme 0.126.0 ships .kol-control-xs and .kol-btn-xs — kol-mono-8 (line 12) + 4px vertical + the shell's 1px ring = a 22px shell (your 18–20 was the shell without its ring; sm measures the same way), 8px sides, --kol-radius-xs, the icon-only square 20; kol-component 0.159.0 adds xs to Input · Dropdown · Stepper · Button, the glyph ladders (SOLO 12 · ADJACENT 10 · INDICATOR 8) and Stepper's chevron 6. Opt-in by prop; the 07-28 dropdown law untouched, Dropdown's default stays sm. (2) Input onCommit — (trimmed) => void on blur / Enter, Escape restores, a local draft seeded from value, onChange still live; and Stepper options — steps a list, wraps at both ends, field read-only, reporting the option in the SAME event shape as the number path, { target: { value } }, so a Selector site changes one line (e.target.value) rather than learning a second shape. (3) kol-controls 0.3.0 retires TextInput · PanelDropdown · Selector — no aliases, you asked for a full swap and a 0.x package with the twin one import away has nothing to alias; sources in _tmp/2026-09-01-controls-retired/. IconButton stays, as you said: the lit border and the momentary pulse are hardware semantics. The package is now exactly the twelve with no app twin. Verified in a real render: xs Input / Button / Dropdown at 22 with 8px mono, icon-only 20 with a 12 glyph, Stepper options stepping tri → saw and back down through sine with a 6px chevron, and onCommit on all three paths — a blur in the same tick as the last keystroke commits what was typed (a draft ref, not the render's draft), Enter commits, Escape restores. Your A/B observation is noted on Input's docstring: filled on surface-secondary has no visible shell; outline reads. Three tarballs checked.

**Remainder here:** bump kol-theme@0.126.0 + kol-component@0.159.0 + kol-controls@0.3.0; TextInput → <Input size="xs" onCommit>, PanelDropdown → <Dropdown size="xs" variant="grey"> under PanelLabel, Selector → <Stepper size="xs" options> reading e.target.value; retire the three seams to _tmp/; re-shoot /dev/controls-ab

## ✅ ADOPTED — 2026-09-01 · kol-theme 0.126.0 · kol-component 0.159.0 · kol-controls 0.3.0

Same sitting. The seven sites moved onto the DS at `xs`: `Input size="xs" variant="outline"`
(+ `onCommit`) in Oscilloscope, Expression ×2, Recorder · `Dropdown size="xs" variant="grey"`
in Colorizer, PatchModule, SVGModule · `Stepper size="xs" options` in Recorder ×3, Raster.
No site passed a label, so no `PanelLabel` wrapper. `parametric/TextInput.jsx` and
`Selector.jsx` retired to `_tmp/2026-09-01-controls-adoption/xs/`; `PanelDropdown` had
no seam. `/dev/controls-ab` re-shot: the B column is the live DS xs control, the A column
names the retired one; IconButton keeps both sides.

**Verified by running** (preview 4317, puppeteer-core): the rack renders with the xs
controls, every swapped module's page loads, 0 errors across 7 routes; light + dark
shots of the panel. Build green · lint 2346 (unchanged) · `check:inks` 0 · `check:stages` ✓.

**Remainder here:** none. kol-controls is the hardware set alone now.
