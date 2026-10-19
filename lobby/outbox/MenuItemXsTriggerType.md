# MenuItemXsTriggerType — `MenuItem size="xs"` puts the trigger's height on the rung but not its type

**Filed:** 2026-10-15 → **kol-ds-ui** · kol-component 0.261.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/MenuItemXsTriggerType.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-16 — kol-component 0.262.0 · adopted here

## Why it went there

Scope+'s EX / REF menus (plan 13 W3.3) rendered 12px type in a 22px xs trigger. The trigger's type is hardcoded
in the DS; its rows already follow the rung.

## What stays here

On ship: bump, drop `buttonClassName="uppercase text-[8px] tracking-normal !px-2"` from `RefDropdown` in
`src/modules/display/OscilloscopeModule.jsx` (keep `uppercase`).

## ✅ RETURNED — 2026-10-16 · kol-component@0.262.0

`TRIGGER_BY_SIZE` beside `TRIGGER_H`: `xs` → `kol-mono-8 px-2`, sm · md · lg → `kol-helper-12 px-3` as before. Measured: xs trigger 8px type, 8px pad, normal tracking, 22px tall; md unchanged (12px, 12px pad, 0.72px tracking, 32px).

**Remainder here:** bump kol-component@0.262.0; drop the `buttonClassName` carry on RefDropdown in OscilloscopeModule.jsx
