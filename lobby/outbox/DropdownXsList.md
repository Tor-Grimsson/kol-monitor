# DropdownXsList — at `xs` the open list keeps `sm` rows and hugs the trigger

**Filed:** 2026-09-01 · from **kol-monitor** · kol-component 0.159.0 · kol-theme 0.126.0
**Kind:** defect in the new `xs` rung (ControlsXsRung)
**Evidence:** `kol-monitor/_tmp/2026-09-01-controls-adoption/ab/xs-dropdown-open.png` (also on the "Controls A/B" artifact, "After" section)

**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/DropdownXsList.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-09-01 — kol-component 0.160.0 · kol-theme 0.127.0 · **adopted + verified here the same sitting**

## The finding

`<Dropdown size="xs" variant="grey" options={['sine','tri','saw','pulse']}>` — the trigger
is right (8px mono, 20px chip), but the OPEN list is not on the rung: its rows render at
the `sm` type (`kol-mono-12`, 32px pitch, `sm` check glyph) and the panel is exactly the
trigger's width, so two of four options truncate — `t…` and `pul…` — while the trigger
shows `tri` in full. The list is the part a panel picker exists for; at `xs` it must be
readable.

## The ask

- The list rows follow `size` like the trigger does: `xs` → `kol-mono-8`, the xs row
  pitch (≈ 20px), the `INDICATOR.xs` (8) check.
- The panel's min-width is the widest option, not the trigger (`minWidth: max-content`
  or a measured pass) — the trigger may hug, the list may not truncate its own options.

**Remainder here:** bump on ship; re-shoot `/dev/controls-ab` open state.

## ✅ RETURNED — 2026-09-01 · kol-component@0.160.0

The rows follow the trigger's rung now. MenuDropdownItem takes size and Dropdown passes its own: at xs the rows are 8px in a 20px pitch with the INDICATOR.xs check, and the panel's max-height reads the 20px row. Your second ask — the panel's min-width — turned out not to be the mechanism: the panel stays the trigger's exact width by the 2026-08-09 one-piece ruling, and the trigger already reserves the widest label through its ghost stack; what truncated was the rows being on the sm rung inside a panel fused to an 8px trigger. With the rows on the rung there is nothing to truncate — one 3px clip remained on the selected row beside its check because the row wore the helper face while the ghost was measured in the trigger's mono face; the xs row wears kol-mono-8 now and the reserve and the row agree. Verified in a real render: four rows at 20px, 8px type, 8px check, panel 104 = trigger 104, zero truncated labels. Same release carries xs on the rest of the ladder (the user's ruling: one ladder, every family) — Textarea · SearchInput · SegmentedToggle · ToggleSwitch · Badge · Tag · IconFrame — kol-theme 0.127.0 + kol-component 0.160.0. Tarballs checked.

**Remainder here:** bump kol-theme@0.127.0 + kol-component@0.160.0 and re-shoot /dev/controls-ab open state — four xs rows, none truncated

## ✅ ADOPTED — 2026-09-01 · kol-component 0.160.0 · kol-theme 0.127.0

Bumped; `/dev/controls-ab` open state re-shot and measured: four rows, `8px`, 20px pitch,
`scrollWidth ≤ clientWidth` on every one — nothing truncated, 0 errors. On the A/B artifact
as before / after. Build green, lint 2346.

**Remainder here:** none.
