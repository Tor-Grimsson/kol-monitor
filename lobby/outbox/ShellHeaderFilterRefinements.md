# ShellHeaderFilterRefinements — three kol-shell 0.1.0 corrections

**Filed:** 2026-08-15 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellHeaderFilterRefinements.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-26 — kol-shell 0.1.2 → 0.1.3 → 0.2.0; superseded by ContentFiltersForkRetirement

## Why it went there

All three defects are kol-shell 0.1.0 file internals with no consumer seam:
(1) PageHeader dropped the h1's 8px gap to the subtitle on recreation;
(2) ContentFilters hardcodes `<Tag size="md">` — filter chips should be sm;
(3) the LIST/GRID toggle renders below the expanded filter groups — the ruled
layout is toggle at the divider level right-aligned, groups below the divider
in left columns. Found during monitor's adoption QA (same session that
root-caused the missing-utilities breakage to `KolSourcesPnpmResolution`).

## Return — 🟢 2026-08-15

Shipped same-day as **`@kolkrabbi/kol-shell` 0.1.1** (registry-verified by the
DS session; delivered back over SendMessage). All three as asked: h1 gap as
`marginBottom: 8` on the element with a comment naming why not the type class;
filter `<Tag>` hardcoded `size="sm"` (no size prop — one correct setting, ask
if wanted); layout TabStrip moved into the header row's right group, filter
groups pinned below the Divider in left columns (changelog carries the
contract). **Remainder here:** none — adopted 2026-08-15: bumped 0.1.0→0.1.1,
all three fixes verified in the shipped source, build green. Visual check
stays the user's.

## Return (corrected) — 🟢 2026-08-15 · kol-shell 0.1.2

**Reopened and re-shipped the same day.** 0.1.1 put the LIST/GRID strip in the
header row *above* the divider; the ruled position is the row *below* it. Fixed in
**`@kolkrabbi/kol-shell` 0.1.2**, registry-verified, 20 gates clean.

- LIST/GRID renders in one row **below the divider, right-aligned, always visible**
  — never in the header row. Filter groups share that row on the left and appear
  only while the filter toggle is open, so an expanded group cannot move the strip.
- Filter values now wear the **LIST/GRID strip idiom** (`kol-helper-12`, 1px
  tracking, `text-fg-96` active / `text-fg-32` rest), label inline on the same line.
  This **supersedes the 0.1.1 `size="sm"` chip fix** — there are no `Tag` chips in
  ContentFilters any more.
- `TabStrip` `value` now also takes a `Set` (multi-select), which is what let the
  filter values reuse the strip instead of copying its ink recipe.

**Stated deviation:** no `text-transform` was added. `LIST`/`GRID` render uppercase
because they are *authored* uppercase; the DS no-auto-casing law stands, so uppercase
tag values are the consumer's to author.

The 0.1.1 h1 gap fix is untouched and stands.

**Remainder here:** none — adopted 2026-08-15: bumped 0.1.1→0.1.2, and the
stated deviation authored consumer-side (uppercase filter values on both sides
of the exact-string match: HomePage/LibraryPage tags, `category_label` field
in LibraryPage/CreatePage, mutuallyExclusiveFilters keys updated). Build
green. Visual check on the corrected layout stays the user's.

## ✅ RETURNED — 2026-08-15 · kol-shell@0.1.3

Second QA round, three rulings. A filter group is a COLUMN — label on top, values beneath — not label-left/values-right on one line. The group label wears the full strip idiom (`kol-helper-12`, 1px tracking). And the filter line carries exactly TWO ink states, the strip's own: active `text-fg-96`, rest `text-fg-32` (hover `text-fg-48`) — the label joins the rest ink instead of its old `text-fg-48`, and `Clear all` drops to the same recipe, so nothing on that line holds a third opacity. The block is `items-start`, pinning the always-visible LIST/GRID strip to the label row with values hanging beneath. 20 gates clean.

**Remainder here:** none — adopted 2026-08-15: bumped 0.1.2→0.1.3, column
layout + two-ink line confirmed in shipped source, build green. Visual check
stays the user's.

## ✅ RETURNED — 2026-08-15 · kol-shell@0.2.0

The ping-pong ended with seams, not a fourth opinion. Three publishes went into re-deciding how a filter value and a group label render — chips, bare strip items, outlined pills — none of which is a design-system question. `ContentFilters` gained `renderFilterValue(value, isActive, toggle)` and `labelClassName`; the label seam REPLACES rather than stacks, per the 2026-07-30 equal-specificity law and `ListingCard`'s `titleClassName` precedent. Defaults reproduce 0.1.3 exactly so kol-mirror does not move. Minor bump — new public API.

**Remainder here:** none — superseded 2026-08-15 by `ContentFiltersForkRetirement` (kol-shell 0.3.0 removed `renderFilterValue` with the fork; all four call sites moved to the kol-component organism). Squared 2026-08-26 on the bump to kol-shell 0.6.2.
