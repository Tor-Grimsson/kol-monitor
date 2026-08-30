# FullConsumptionContract — define "fully consuming the DS", and let a consumer take the core without the domain packs

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/FullConsumptionContract.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` in kol-ds-ui — kol-theme 0.77.0 · docs, 2026-08-27

## Why it went there

Neither half is a consumer's to fix. **(1)** `kol-theme.css` is one umbrella
importing every domain pack — chess · workshop · foundry · dashboards ·
styleguide, **81,134 bytes / 23 %** of the theme, all present in monitor's
built CSS (`.analysis-control-group`, `.docs-card`, `.font-viewer-buttons`,
`.chart__segment` verified in `dist/assets/*.css`). Plain CSS `@import`s do not
tree-shake, and hand-assembling the core file by file means owning the cascade
order — the one thing the umbrella guarantees. **(2)** "Fully consuming" has no
definition, so no repo can claim it and no agent can check itself; this session
called `.bg-fg-*` Tailwind and passed `var(--kol-fg-12)` through JSX three
times, against a rule `kol-opacity.css` already states.

## What stays here

- Nothing carried — this is an ask, not a workaround.
- **On ship:** swap to `@kolkrabbi/kol-theme/core`, then work monitor's own
  list against the certification — the rack tier (`src/styles/components.css`,
  996 lines / 175 `var()` reads), the 47 JSX `var()` reads, the 7 local atoms
  duplicating DS atoms across 31 module files.

---

## ⏳ PART 1 SHIPPED — 2026-08-27 · kol-theme 0.77.0

`@kolkrabbi/kol-theme/core` — the app tier in the umbrella's order, the five domain packs import individually after it, umbrella unchanged. **Your side:** `@import "@kolkrabbi/kol-theme/core"` in place of the umbrella. Part 2 stays open in kol-ds-ui 🔴 until the user rules the definition; the six-point shape is the proposal.

**Remainder here:** Part 1 adopted 2026-08-27 — bumped kol-theme 0.74.0 → 0.77.0
(component 0.113.0 → 0.116.0 · framework 0.28.0 → 0.29.0 · icons 0.22.0 → 0.23.0
rode along), `src/index.css` imports `@kolkrabbi/kol-theme/core` in place of the
umbrella. Built CSS **283.7 kB → 230.4 kB** (−53.3 kB / −19 %; gzip 27.7 kB); the
four pack witnesses (`.analysis-control-group`, `.docs-card`,
`.font-viewer-buttons`, `.chart__segment`) are gone from `dist`. Swept all 353
pack-only classes against `src/` — one nominal hit, `.toggle-switch-label`, which
monitor already defines itself at `src/styles/components.css:217` (unlayered, so it
was winning anyway). Build green. Visual check the user's.

**Part 2 ruled + shipped the same day** — not a certificate, a checklist (user:
"it's just for repos to know if they are fully using KOL"):
`docs/documentation/00-overview/04-full-consumption.md` in kol-ds-ui, the six checks
as monitor shaped them, each with the grep to run from a consumer's root; a repo is
fully consuming when every grep comes back empty. Ticket closed to `lobby/done/`.

**Still owed here:** run the six greps, then the rack tier —
`src/styles/components.css` (996 lines / 175 `var()` reads, and **31 of its selectors
shadow kol-theme class names** unlayered, so no DS upgrade to `.kol-badge*` /
`.pill-*` / `.toggle-switch*` / `.tag-control` can reach this repo), the 47 JSX
`var()` reads, the 7 local atoms duplicating DS atoms across 31 module files.

---

## ✅ RETURNED — 2026-08-27 · kol-theme 0.77.0 · docs

🟢 `closed` in **kol-ds-ui** — Part 1 — `@kolkrabbi/kol-theme/core` (theme 0.77.0): the app tier in the umbrella's order, the five domain packs import after it, umbrella unchanged (core = umbrella minus exactly those five, order checked). Part 2 — not a certificate, a checklist (user, 2026-08-27: "it's just for repos to know if they are fully using KOL"): `docs/documentation/00-overview/04-full-consumption.md` — the six checks as monitor shaped them, each with the grep to run from a consumer's root; a repo is fully consuming when every grep comes back empty, and records it as one line in its own ledger history. No script, no roster, no badge. 21 gates clean.

**Remainder here:** swap the umbrella for `@import "@kolkrabbi/kol-theme/core"`; run the six greps and work the rack tier's list (the 47 JSX `var()` reads, the 7 duplicate atoms, the 996-line `components.css`). The LLM_RULES bulletin is the user's to post.
