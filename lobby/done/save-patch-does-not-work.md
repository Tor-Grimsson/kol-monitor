# Saving a patch does not work — review it in monitor

**Staged:** 2026-10-20 · from a kol-ds-ui session
**Change:** unknown until reviewed — start by reproducing it

---

## The problem, in one case
The user, 2026-10-20: *"monitor save patch doesnt work, need to review in monitor"*. Saving a patch in monitor does not save it. Nothing more specific was given: which path, which step, and what happens instead are what this ticket has to find first.

## The fix
Reproduce a patch save in monitor, find where it fails (the save action, the store it writes to, or reading it back), and fix it there. If the cause turns out to be a `@kolkrabbi/*` package, file that part to kol-ds-ui.

## Rejected alternative
None yet. Nothing was looked into from the kol-ds-ui side.

## Definition of done
- [ ] A patch saved in monitor is there after a reload, verified by doing it
- [ ] The cause and the fix are cited by file in the resolution

## Resolution — 2026-10-22 · 🟢 closed

Reproduced in Playwright (plan 15 W1): Save did write the library and the save did reload — but what came back was not what was saved. Three causes:

- **Nothing came back powered.** Save records the `on` list, but `loadPreset` never read it, so every saved patch (and every preset) loaded dark. Fixed in the one load point: `src/hooks/useRackState.js` `loadPreset` turns the `on` list into each module's `enabled`.
- **Four modules saved state they never read back.** Sequencer (`steps`, `gates`, `page`, `length` — steps came back randomised): `src/modules/control/SequencerModule.jsx`. Life `ruleVal` (read as `rule`): `src/modules/generators/LifeModule.jsx`. ModulatorGen `freeze`: `src/modules/generators/ModulatorGenModule.jsx`. SVG's chosen file (built-in ones only): `src/modules/generators/SVGModule.jsx`.
- **Every save was named "Untitled".** A patch opened from its URL never set the case name Save reads. `src/rack/VideoModulo.jsx` sets it from the loaded patch.

Verified: `life` preset → Save → reload the save → Save again — the two saves are identical (`on` list, every module's state, 14/2 cables); same for an `init` save with the sequencer. Home lists the save under its preset's name. Build green. Signed-in sync not exercised (no password here); it pushes the same item, untouched by the fix.
