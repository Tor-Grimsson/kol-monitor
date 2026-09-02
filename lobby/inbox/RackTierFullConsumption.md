# RackTierFullConsumption — the six greps, run and worked: 4 of 6 clean, 2 carry stated deviations

**Staged:** 2026-08-30 → self-ticket (kol-monitor's own queue)
**State:** 🟠 `addressed` — the work shipped, build green, lint unchanged. **Not 🟢:**
the two calls are ruled (below); what is left is four surfaces that still want the user's eye.
**Origin:** `outbox/FullConsumptionContract.md` 📌 — Part 2's remainder, "run the six greps"
**Spec:** kol-ds-ui `docs/documentation/00-overview/04-full-consumption.md`

## What happened

`FullConsumptionContract` closed 🟢 in kol-ds-ui on 2026-08-27 in two parts —
Part 1 shipped `@kolkrabbi/kol-theme/core` (adopted here the same day), Part 2
shipped the six-check list, *not* a certificate. The remainder owed here was to
run those six greps and record the result. Run and worked 2026-08-30 against
theme 0.96.0 · component 0.131.0.

## Where it landed

| # | Check | Before | After |
|---|---|---|---|
| 1 | No unrendered domain pack | ✅ 0 | ✅ 0 |
| 2 | Classes over tokens in JSX | ❌ 56 hits / 18 files | ✅ **9 left, every one a stated deviation** |
| 3 | `:root` bindings (not a finding) | ✅ 5 | ✅ 5 |
| 4 | No local duplicate of a shipped component | ❌ 3 forks | ⚠️ **1 seam + 2 rack widgets — a naming call** |
| 5 | No hand-rolled chrome | ✅ clean on intent | ✅ clean on intent |
| 6 | Type on the fault line | ❌ 2 | ✅ **0** |

**Local CSS 1160 → 841 lines.** `components.css` **996 → 677**.
**Selectors shadowing kol-theme: 31 → 0.**

## What shipped

### Seven dead atoms retired → `_tmp/2026-08-30-dead-atoms/`

`Tag.jsx` (the fork check 4 named) · `Checkbox.jsx` · `Input.jsx` ·
`ToggleCheckbox.jsx` · `ToggleSwitch.jsx` · `QuantityInput.jsx` ·
`QuantityStepper.jsx`. **Zero importers each** — verified by import-path grep and
by plain-name grep; there is no barrel in `src/components/atoms/`, so an import is
the only way in. Nothing was rewired because nothing referenced them. Five of the
JSX token reads went with them.

`src/components/atoms/` now holds four files: `Button.jsx` (the legal DS seam),
`Divider.jsx` (32 importers), `Slider.jsx` (`CaseHpDialog`), `ColorPicker.jsx`
(`ColorPickerPage`).

### 18 token reads → DS classes

`StageClock.jsx` (LED well, key deck, gang, switch, lever) · `ModuloSidebar.jsx`
(nav glyphs, underline) · `Workbench.jsx` (search pill) · `VideoModulo.jsx`
(sidebar ground) · `TextInput.jsx` · `OscilloscopeModule.jsx` ×2 ·
`ColorPicker.jsx` · `ColorPickerPage.jsx` ×2 · `ModuleDesignPage.jsx`.
Classes used: `bg-surface-primary` · `bg-surface-secondary` · `bg-surface-tertiary` ·
`bg-accent-primary` · `bg-oq-12` · `bg-oq-24` · `text-oq-96` · `bg-fg-04` ·
`bg-fg-16` · `border-fg-08`.

### 29 dead shadowed CSS rules cut → `_tmp/2026-08-30-shadowed-css/`

`.toggle-switch*` · `.toggle-checkbox*` · `.pill-*` · `.tag-control*` ·
`.control-unified-inverse` · `.kol-badge*` (12) · `.icon-default` / `.icon-hover` /
`.section-label-wrapper:hover …`. Every one is defined by kol-theme **and** had
zero users in `src/*.jsx` — they rendered nothing and blocked nothing, but they
squatted on DS names.

### 3 live squatters renamed off the DS namespace

`.control-slider` → `.monitor-slider` · `.control-slider-minimal` →
`.monitor-slider-minimal` · `.slider-black` → `.monitor-slider-black`, with
`src/components/atoms/Slider.jsx:48,146` updated. Rules unchanged byte for byte —
this is a namespace fix, not a restyle.

## Stated deviations — why the two checks do not read empty

### Check 2 — the 9 remaining `var(--kol-*)` reads are all correct

| Site | Why it stays |
|---|---|
| `AppLayout.jsx:156` `pageWash="var(--kol-fg-02)"` · `VideoModulo.jsx:97` · `CreatePage.jsx:132` | **Bindings**, which check 3 explicitly blesses — a value handed to a CSS custom property, not styling applied to an element |
| `Slider.jsx:104` `background: var(--kol-surface-on-primary)` · `StageClock.jsx:58` `background: var(--kol-surface-tertiary)` | **No background-only class exists.** `.bg-auto` is `surface-primary`, not the ink; `.bg-surface-*` is an ink+ground **pair** and both elements drive their own ink. Using the pair here would change text colour |
| `RackRail.jsx:135` · `LibraryPage.jsx:96,128,131` | **Inline overrides of a DS component's own chrome** (`.kol-btn-nav`, `.kol-btn-grey`). A class would tie at specificity with the DS rule and be decided by sheet load order — inline is the only reliable tool for an override |

### Check 4 — one seam, two rack widgets

- `src/components/atoms/Button.jsx` (13 lines) — the `iconComponent` seam the check
  explicitly allows.
- `src/modules/parametric/Slider.jsx` (112) and `Dropdown.jsx` (107) — **eurorack
  panel hardware, not the DS's app atoms.** They share a *name* with a DS component,
  not a job. The grep cannot tell those apart.

## Ruled — both calls, 2026-08-30 · do not re-open

1. **The two rack widgets keep their names.** `parametric/Slider.jsx` +
   `Dropdown.jsx` stay as they are — **a permanent, stated deviation**, not an
   open item. The user declined the rename the day it was proposed: churn across
   5 import sites for a checker's benefit. Check 4 will never read empty here and
   that is the answer, not a gap. **Do not re-raise it unasked.**
2. **The `LibraryPage` button overrides were dropped** — user ruled the DS button
   should behave as designed. `LibraryPage.jsx:96,128,131` are plain
   `<Button variant="grey" size="md">` today, no inline ground, hover/press ladder
   intact. Executed, verified in source 2026-09-01.

## Needs the user's eye — the one thing still holding this at 🟠

The 2026-09-01 browser pass covered the rack at 1440 (`_tmp/2026-09-01-mobile-qa/
qa-rack-1440.png` — cables, Monitor wireframe, sidebar) and the stage at both
widths. **Still unseen**, all touched by the CSS rename:

- **Stage** (`/stage`): the clock's LED well, key deck, gang and switch lever.
- **Rack**: the sidebar nav glyphs and the 24×1px underline; the Workbench search
  pill's open state; the sidebar ground.
- **Oscilloscope module**: the number input and the dropdown trigger.
- **`CaseHpDialog`'s slider** — the CSS rename touched it; it should be identical.
- Any module using `parametric/TextInput`.
