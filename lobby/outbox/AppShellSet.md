# AppShellSet — graduate the shared app shell to the DS as a bundled set

**Filed:** 2026-08-14 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/AppShellSet.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-14 — kol-shell 0.1.0 + theme 0.41.0 + framework 0.20.0

## Why it went there

The home/library/settings shell (rail, layout, PageHeader, ContentFilters,
GridCard, settings scaffold, walkthrough, shortcuts overlay) is hand-copied
between this repo and kol-mirror, with more consumers planned. Two-way agent
sweep (2026-08-14) proved the drift is already shipped: shared dead
`ViewToggle` import, shared hardcoded `rgba(255,255,255,0.06)` light-theme
bug in GridCard, the nav-active ruling implemented two different ways, and
internally drifted duplicate shortcut tables in each repo. Placement
recommendation carried in the spec: sibling package (proposed
`@kolkrabbi/kol-shell`), not a kol-framework variant.

## What stays here

- **On ship: adopt.** Delete the local copies (NavSidebar, AppLayout,
  PageHeader, ContentFilters, GridCard, ShortcutsOverlay → `_tmp/`), swap the
  rail's inline active style for the set's `aria-current` mechanism, and move
  shortcut data to the single consumer-supplied array feeding both surfaces.
- If the set re-exports ThemeToggle/theme.js properly, the `./src/*`
  kol-framework pnpm patch retires with it.
- kol-mirror has the same adoption remainder (it is the co-source of the
  spec); its sweep also flagged its dead Workshop* shell for the same sweep.

## Return — 🟢 2026-08-14

Shipped as recommended: **`@kolkrabbi/kol-shell` 0.1.0** (sibling package, all
9 pieces, router-agnostic, icons via the `iconComponent` seam) + **theme
0.41.0** (`kol-components-shell.css` — rail tokens + the 2026-08-12
active-wash ruling native on `.kol-shell-rail [aria-current="page"]`) +
**framework 0.20.0** (`./src/*` subpath exports — the pnpm patch is legal
imports now). Shipped drift fixed on recreation: dead ViewToggle import,
GridCard's white borderTop → `border-fg-04`, casing transforms dropped, rail
z-70 → `--kol-z-sticky`. **Remainder here:** none — adopted 2026-08-15
(session 58): locals retired to `_tmp/2026-08-15-shell-adoption/`,
`aria-current` native via the DS rail, shortcut array single-sourced at
`src/data/shortcuts.js`, all pnpm patches retired. (kol-mirror still owes its
own adoption + its dead Workshop* shell sweep — tracked there, not here.)
