# ContentFiltersForkRetirement — kol-shell forked an organism that already existed

**Filed:** 2026-08-15 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ContentFiltersForkRetirement.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-27 — component 0.44.2 → 0.45.0 · kol-shell 0.3.0 (ledger row: closed 2026-08-15; header was never synced)

## Why it went there

`ContentFilters` already ships in kol-component as an organism composing the
real `Tag` atom. kol-shell 0.1.0 shipped a second one and swapped the chip for
a local `TabStrip`. Monitor adopted the fork and spent a session tuning it —
four kol-shell publishes (0.1.1 → 0.2.0) against a duplicate. Retiring the
fork is kol-ds-ui's; nothing here can fix it.

## What stays here

- **On ship: adopt.** Swap the four call sites (HomePage · LibraryPage ×2 ·
  CreatePage) to the kol-component organism, delete the local
  `src/components/renderFilterPill.jsx` seam, and revert the consumer-side
  uppercase workarounds on tag/category values + group labels.

## ✅ RETURNED — 2026-08-15 · kol-component@0.44.2 + kol-shell@0.3.0

The fork is retired and the organism is canon. kol-shell 0.1.0 recreated a component that had shipped in kol-component since 2026-08-01; four publishes on 2026-08-15 tuned the duplicate. Fixed at the real organism: the filter value is a `Tag` again with its own `active` prop and `onClick` (the invalid `variant="default"` silently rendered the FILLED chip; `secondary` is the outlined one), the layout strip moved into one row below the divider — right-aligned, always visible, `items-start` pinning it to the label row — and `iconComponent` crossed over as the fork's one genuine addition. Ink read off kol-monitor's CALL SITES, not the fork's defaults, which is what I got wrong twice: category label `text-fg-96`, value rest `text-fg-48`, value selected `text-fg-96`. kol-shell's ContentFilters + the `renderFilterValue`/`labelClassName` seams are removed (BREAKING); `TabStrip` stays for SettingsScaffold's real tabs, single-select only. Quarantined in `_tmp/2026-08-15-kol-shell-contentfilters-fork/`, not deleted. 20 gates clean.

**Remainder here:** none — adopted 2026-08-15: component 0.44.2 + shell 0.3.0,
all four call sites import `ContentFilters` from kol-component, the
`renderFilterPill` seam retired to `_tmp/2026-08-15-contentfilters-fork-adoption/`,
`renderFilterValue`/`labelClassName` props dropped, and every consumer-side
uppercase workaround reverted (tags, `category_label` field, group labels).
Build green. Visual check the user's.

## ✅ RETURNED — 2026-08-15 · kol-component@0.45.0

Three regressions from monitor's live QA, fixed by diffing monitor's ORIGINAL (_tmp/2026-08-15-shell-adoption/) rather than reasoning from a description. Group label now uppercases IN the component (consumers pass natural case; the label is chrome with no authoring site, same justification .kol-tag already carries for values). RECENT/SAVED is the same strip as LIST/GRID — inline spans, kol-helper-14, uppercase + 1px tracking, fg-96 active / fg-32 rest — NOT ViewToggle; the original imports ViewToggle and never renders it for this, so the filled-chip reading of the 2026-07-28 ruling is replaced on this surface. Filter/search icons back to size 16. 20 gates clean.

**Remainder here:** none — adopted 2026-08-15: component 0.45.0, label
uppercase confirmed in the component, icons back to 16, RECENT/SAVED on the
strip. Call-site swap, seam retirement and natural-case labels were already
done in the 0.44.2 round. Build green. Visual check the user's.
