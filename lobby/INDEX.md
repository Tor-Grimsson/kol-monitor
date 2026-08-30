# lobby — kol-monitor

Intake queue for **kol-monitor** (`monitor.kolkrabbi.io`): the monitoring
surface — UI issues, app-shell and routing behaviour, and this repo's
consumption of the `@kolkrabbi/*` packages.
Not documentation — a work queue, deliberately outside `docs/`.

**This file is the ledger. The ledger is the truth, never a raw `ls`.**

| | |
|---|---|
| file one | `clip-drop.sh --kol-monitor NAME` |
| read it | `/lobby-list` · `bin/lobby` · `prefix Ctrl+K` |
| the spec | `~/.dotfiles/docs/operations/systems/lobby/` |

## States

| | state | means | lives in |
|---|---|---|---|
| 🔵 | `filed` | captured, unread | `inbox/` |
| 🟡 | `read` | understood — the row below restates it | `inbox/` |
| 🟠 | `addressed` | a change shipped that is *meant* to close it | `inbox/` |
| 🟢 | `closed` | met the bar; resolution appended | `done/` |
| ⚪ | `parked` | deliberately not-**now**, reason recorded — revisitable | `archive/` |
| ⚫ | `retired` | closed without a fix, not-**ever** — terminal, and never ages | `archive/` |
| 🔴 | `needs-ruling` | **flag, not a state** — blocked on the user's call | wherever it is |
| 📌 | `remainder` | **flag, not a state** — closed at its destination, still owed **here** | `outbox/` |

**`read` is never `closed`.** Understanding a ticket ships nothing.
**Bar for 🟢 closed in this repo — purpose served:** the change shipped and was
verified by running it, cited by file. **The agent closes on that evidence.**
Parking, declaring stale, reopening and any design decision stay the **user's call**.

## Queue — 0 entries

_(empty — live tasks only)_

## Closed

| | Entry | About | Staged | Closed | State |
|---|---|---|---|---|---|
| 🟢 | [ShellHomeSystemAdoption](done/ShellHomeSystemAdoption.md) | The shared app tier (kol-shell 0.8.0 · component 0.105.0 · theme 0.71.0 · framework 0.28.0 · icons 0.20.0 · brand 0.1.3) adopted on kol-fxr's wiring: Home on `CatalogPage`, Settings on `SettingsShortcuts` / `SettingsLinks` / `SettingsColophon`, `AppShell railToggleKey` + `touch="overlay"`, `nav-*` + logomark from the DS, the theme boot script, `voice="mono"`, no `GridCard` left, the t-shirt type stops retired | 2026-08-27 | 2026-08-27 | `closed` — build green, `dist/index.html` carries the boot script; Library + Create stay on `ContentFilters` + the cards directly (seams filed as `ShellHomeSystemMonitorGaps`). Visual check the user's |

## Archived

_(none yet — ownership, deferral and context notes land in `archive/`)_

## Filed elsewhere

Tickets this ledger does **not** govern — each row names the destination ledger
that does. The **Remainder** is this repo's to do; the state is theirs to report.
All four went to **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md`.

| | Receipt | Last known | Remainder here |
|---|---|---|---|
| 🟢 | [AppShellSet](outbox/AppShellSet.md) | 🟢 `closed` 2026-08-14 — kol-shell 0.1.0 + theme 0.41.0 + framework 0.20.0 | none — adopted 2026-08-15: locals retired to `_tmp/2026-08-15-shell-adoption/`, `aria-current` native via the DS rail, shortcuts single-sourced at `src/data/shortcuts.js`, all pnpm patches retired. kol-mirror still owes its own share |
| 🟢 | [ComponentSideEffectsField](outbox/ComponentSideEffectsField.md) | 🟢 `closed` 2026-08-15 — component 0.39.0 | none — adopted 2026-08-15 |
| 🟢 | [ComponentTailwindSourceTrap](outbox/ComponentTailwindSourceTrap.md) | 🟢 `closed` 2026-08-12 — theme 0.38.0 + framework 0.19.0 | none — adopted 2026-08-14. Visual roll check (travels + coin-rotates) pending user QA |
| 🟢 | [KolComponentDeepExports](outbox/KolComponentDeepExports.md) | 🟢 `closed` 2026-08-12 — component 0.35.0, exports map registry-verified | none — adopted 2026-08-12 |
| 🟢 | [ShellHeaderFilterRefinements](outbox/ShellHeaderFilterRefinements.md) | 🟢 `closed` 2026-08-15 — kol-shell 0.1.3 after three QA rounds. **Superseded by `ContentFiltersForkRetirement`** — every round tuned a forked component | none — the fork is retired; see the row below |
| 🟢 | [ContentFiltersForkRetirement](outbox/ContentFiltersForkRetirement.md) | 🟢 `closed` 2026-08-15 — **kol-component 0.44.2 + kol-shell 0.3.0**: kol-shell's forked ContentFilters + TabStrip retired, the kol-component organism is canon, filter values are real `Tag` atoms again | none — adopted 2026-08-15: all four call sites on the organism, seam retired to `_tmp/`, uppercase workarounds reverted, build green. Visual check the user's |
| 🟢 | [ShellHomeSystemMonitorGaps](outbox/ShellHomeSystemMonitorGaps.md) | 🟢 `closed` 2026-08-27 — **kol-shell 0.9.0**: overlay reads `combo`, `CatalogPage` `filtersProps` + `expanded` through `toCard` | none — bumped, map dropped 2026-08-27; Library on `CatalogPage` since the `CatalogPageMonitorParity` bump the same day |
| 🟢 | [SettingsShortcutsComboWrap](outbox/SettingsShortcutsComboWrap.md) | 🟢 `closed` 2026-08-27 — **kol-shell 0.9.1**: the combo cell is `whitespace-nowrap`, the label yields | none — adopted 2026-08-27: the nowrap `comboLabel` dropped from `SettingsPage`. Visual check the user's |
| 🟢 | [CatalogPageCardFit](outbox/CatalogPageCardFit.md) | 🟢 `closed` 2026-08-27 — **kol-shell 0.9.2**: `fit` through `toCard` — but its `natural` is contain, not GridCard's | none adopted; superseded by `CatalogPageMonitorParity` |
| 🟢 | [CatalogPageMonitorParity](outbox/CatalogPageMonitorParity.md) | 🟢 `closed` 2026-08-27 — **kol-component 0.108.0 · kol-shell 0.10.0**: `fit natural / compact` are GridCard's rules verbatim, `CatalogPage` hides the 2×2's neighbours | none — adopted 2026-08-27: Library on `CatalogPage`, `computeHiddenSet` + the `.preview-*` / `.home-catalog` fit rules deleted, `fit` through `toCard`. Hover ruling kept on `.kol-card`. Build green. Visual check the user's |
| 🟢 | [ContentMediaFocusBinding](outbox/ContentMediaFocusBinding.md) | 🟢 `closed` 2026-08-27 — **kol-component 0.111.0 · kol-theme 0.73.0**: `--kol-media-focus` read by both the fits and the zoom, unset = today | none — adopted 2026-08-27: bound `top left` on `:root` in `monitor-overrides.css`. Build green |
| 🟢 | [ContentFiltersFirstGroupFixedWidth](outbox/ContentFiltersFirstGroupFixedWidth.md) | 🟢 `closed` 2026-08-27 — **kol-component 0.111.0 · kol-theme 0.73.0**: `.kol-filters-first` = `(100cqw − 120px) / 6` measured on `.kol-filters-row` | none — adopted 2026-08-27 on the 0.113.0 / 0.74.0 bump: the `w-40` interim dropped from all four first groups. Build green |
| 🟢 | [ShellPageWash](outbox/ShellPageWash.md) | 🟢 `closed` 2026-08-27 — **kol-shell 0.11.0**: `AppShell` paints the primary back + `pageWash` → `--kol-shell-page-wash`, `PageShell` reads it with a primary fallback | none — adopted 2026-08-27: `pageWash="var(--kol-fg-12)"`, RailFrame back to `contents`, override rule deleted, rack root reads the var. Build green. Visual check the user's |
| 🔵 | [FullConsumptionContract](outbox/FullConsumptionContract.md) | 🔵 `filed` 2026-08-27 — (1) a `/core` theme entry: the domain packs are 81 KB / 23 % of kol-theme and ship in every consumer; (2) define "fully consuming the DS" and certify a repo against it | on ship: swap to `/core`, then work monitor's list — the rack tier CSS, 47 JSX `var()` reads, 7 duplicate atoms |
| 🔵 | [ListGridCards](outbox/ListGridCards.md) | 🔵 `filed` 2026-08-15 — **open collection**, never closes; accrues card pairs from active repos | none — monitor's pair (kol-shell GridCard grid + list row) is in the collection; append a fresh pair if the cards change shape |
| 🟢 | [PageShellScrollbarGutter](outbox/PageShellScrollbarGutter.md) | 🟢 `closed` 2026-08-28 — **kol-shell 0.18.0**: `scrollbar-gutter: stable` on `PageShell`'s root. Acts in `fixed` mode only (there the element IS the scroll container) — inert in `scroll`, so no second gutter | none — adopted 2026-08-28 on the 0.18.0 / component 0.127.0 pair, registry-verified in the published source and in monitor's bundle. Build green. **Unmeasured at both ends — the three strips still need the user's eye** |
| 🟢 | [AppShellNavKeysHomeFirst](outbox/AppShellNavKeysHomeFirst.md) | 🟢 `closed` 2026-08-28 — **kol-shell 0.19.0**: with a `logomark`, `navKeys` walks `['/', ...items]` — the order on screen; without one, `items[n-1]` as before. Inferred from `logomark`, not an explicit array, so it cannot drift from what the rail renders | none — adopted 2026-08-28: bumped, local listener + `NAV_KEY_PATHS` deleted, `navKeys` restored, sheet row reads 'Home first'. Registry-verified in the published source and the bundle. Build green. **⌥1–4 still needs the user's eye** |

## History

| Date | Event |
|---|---|
| 2026-08-12 | `KolComponentDeepExports` + `ComponentTailwindSourceTrap` filed into kol-ds-ui; both closed and adopted the same week |
| 2026-08-14 | `AppShellSet` filed into kol-ds-ui — the shared app shell graduated to the DS as a bundled set |
| 2026-08-15 | `ComponentSideEffectsField` filed into kol-ds-ui — the barrel was unshakeable without the manifest flag |
| 2026-08-15 | **`ShellHeaderFilterRefinements` filed into kol-ds-ui** — kol-shell 0.1.0 adoption QA: PageHeader h1/subtitle gap lost on recreation, filter tag chips md→sm, LIST/GRID toggle to the divider row with groups pinned below-left. Remainder here on ship: bump + verify |
| 2026-08-15 | **`ListGridCards` filed into kol-ds-ui — an open collection, not a task.** List + grid card pairs from active repos, gathered DS-side toward an eventual card-family consolidation; monitor's preset cards (kol-shell `GridCard` grid + list row, dark) are the first pair. Same session: the kol-shell adoption's missing gaps/wrapping root-caused to the `@source` manifest being a silent no-op under pnpm (`KolSourcesPnpmResolution`, already fixed upstream) — theme bumped 0.42.1→0.42.2, shell utilities back in the build |
| 2026-08-15 | **Ledger created and the lobby registered** in `~/.dotfiles/files/folders.md` § `lobby`. The folder already existed with four receipts in `outbox/` but **no ledger and no `inbox/`**, so `bin/lobby` could not read it — the four filings above were reconstructed from those stubs. Flag `--kol-monitor` falls out of the path |
| 2026-08-27 | **`ShellHomeSystemAdoption` filed** from kol-fxr — the shared Home · Library · Settings tier is in the DS; adopt it the way fxr did the same day. |
| 2026-08-27 | **`ShellHomeSystemAdoption` closed** — bumped to the set, Home on `CatalogPage`, Settings on the three DS pieces, AppShell key + touch policy, DS glyphs + logomark, boot script, mono masthead, `GridCard` gone, legacy type stops retired to `_tmp/2026-08-27-shell-home-adoption/`. Build green |
| 2026-08-27 | **`ShellHomeSystemMonitorGaps` filed into kol-ds-ui** — the two seams that kept Library off `CatalogPage` (`mutuallyExclusiveFilters`, `expanded` in `toCard`) and the `combo`/`keys` field mismatch between `SettingsShortcuts` and `ShortcutsOverlay`. Remainder here on ship: Library → `CatalogPage` |
| 2026-08-27 | **`SettingsShortcutsComboWrap` filed into kol-ds-ui** — three-character combos wrap in the shortcuts grid (seen rendering); nowrap `comboLabel` carried here meanwhile |
| 2026-08-27 | **`CatalogPageCardFit` filed into kol-ds-ui** — Home's preset cards crop the rack (seen by the user); `object-fit: contain` override on `.home-catalog` meanwhile. Library + Create cards moved `cover` → `natural` (the retired GridCard's default) |
| 2026-08-27 | **`ShellHomeSystemMonitorGaps` + `CatalogPageCardFit` returned** (kol-shell 0.9.0 / 0.9.2) — bumped to 0.9.2, `combo → keys` map dropped. `fit: 'natural'` rejected on sight (contain ≠ GridCard's scale-0.3 top-left); the override rules stay. **`CatalogPageMonitorParity` filed** — the two real fits + neighbour hiding on `CatalogPage`; Library moves on that bump |
| 2026-08-27 | **`CatalogPageMonitorParity` + `SettingsShortcutsComboWrap` returned and adopted** (kol-component 0.108.0 · kol-shell 0.10.0; theme 0.72.0 + icons 0.22.0 rode along) — Library on `CatalogPage`, `computeHiddenSet` and the `.preview-*` / `.home-catalog` fit rules deleted (`fit` through `toCard`), the nowrap `comboLabel` dropped. The hover ruling stays, keyed on `.kol-card`. Build green |
| 2026-08-27 | **`ContentMediaFocusBinding` filed into kol-ds-ui** — the user rules the image focus a per-repo binding; the DS hardcodes the anchor in the fits and the zoom. No carry here (top-left is already monitor's value); bind the token on ship |
| 2026-08-27 | **`ContentFiltersFirstGroupFixedWidth` filed into kol-ds-ui** — user ruling on Home's TYPE column beside `/work`'s: the first filter group is a set width — one catalog column — not a hug. `className: 'w-40'` (160, the reachable interim) carried on every first group meanwhile; announced in the LLM_RULES bulletin |
| 2026-08-27 | **`ShellPageWash` filed into kol-ds-ui** — the main-background lift as a shell mechanism for monitor · fxr · mirror: primary back, per-app transparent wash on the page root. Carried here as `.monitor-page-back` (RailFrame) + the fg-12 rule in `monitor-overrides.css` |
| 2026-08-27 | **`ShellPageWash` returned and adopted** (kol-shell 0.11.0, same afternoon) — `pageWash` prop on `AppShell`, the local back + wash carry retired, rack root on the variable. fxr + mirror handed their adoption over SendMessage |
| 2026-08-27 | **`FullConsumptionContract` filed into kol-ds-ui** — after an audit here found the app tier fully on the DS and the rack tier hand-rolled. Asks the DS for a core theme entry (skip the 81 KB of packs a rack app can never render) and for a written definition of full consumption the DS can certify a repo against |
| 2026-08-27 | **`ContentFiltersFirstGroupFixedWidth` + `ContentMediaFocusBinding` returned and adopted** — bumped kol-component 0.108.0→0.113.0 · kol-theme 0.72.0→0.74.0 (0.112.0's `SettingsSection`→`LabeledControlSection` rename is BREAKING but does not touch monitor: its `SettingsSection` is kol-shell's own, not kol-component's). `w-40` interim dropped, `--kol-media-focus: top left` bound |
| 2026-08-28 | **`PageShellScrollbarGutter` filed into kol-ds-ui** — chasing a layout difference the user saw on Create's filter strip. Monitor's side is clean (no local `.kol-filters*` rule anywhere, both prior interims deleted); the split is `PageShell mode="fixed"` vs `mode="scroll"` and a first filter group sized in container units. Diagnosed in source only — the delta is unmeasured and is zero under overlay scrollbars. Nothing carried here |
| 2026-08-28 | **`PageShellScrollbarGutter` returned and adopted the same sitting** (kol-shell 0.18.0, paired with component 0.127.0 which it peers). The DS added an asymmetry worth keeping: the declaration only acts in `fixed` mode, where the element is itself the scroll container — in `scroll` mode it is inert and the viewport keeps its own gutter. Declined one level up: `html { scrollbar-gutter: stable }` would also equalise a short scrolling page against a long one, but that is an estate-wide ruling, not this ticket. Neither side ran a browser |
| 2026-08-28 | **`AppShellNavKeysHomeFirst` filed into kol-ds-ui** — the user found ⌥1 landing on Library. `navKeys` (our own ticket, 0.12.0, the same day) counts `items`, and the rail's first rung is the logomark, so Home was never in the sequence its own ask named. Fixed here meanwhile with a local listener; the DS prop is off because both listen on `window` |
| 2026-08-28 | **`AppShellNavKeysHomeFirst` returned and adopted the same sitting** (kol-shell 0.19.0). The DS chose the inferred form over the explicit path array offered as an alternative — inferring from `logomark` needs no consumer change and cannot drift from what the rail renders, which is the drift that caused the defect. Local carry deleted, `navKeys` back. Left open, unasked: `bottomItems` (Settings) has no key |
