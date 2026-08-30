# PageShellScrollbarGutter — a page's content width depends on whether it scrolls

**Filed:** 2026-08-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/PageShellScrollbarGutter.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` in kol-ds-ui — **@kolkrabbi/kol-shell 0.18.0**, 2026-08-28

## Why it went there

The user sees the filter strip on **Create** sitting differently from Home and
Library. Nothing here explains it: no local rule touches `.kol-filters*` in
`monitor-overrides.css` or `components.css`, both prior interims (`w-40`,
`.create-filters`) are deleted, and all three surfaces pass the same shape of
props.

Create is the only one of the three that does not scroll — it is
`PageShell mode="fixed"` (`CreatePage.jsx:132`), Home and Library are
`CatalogPage`'s default `mode="scroll"`. A scrolling page gives up the
scrollbar's width; a fixed one does not. That reaches the strip because the
first group is `calc((100cqw - 120px) / 6)` measured on `.kol-filters-row`
(`container-type: inline-size`) — our own `ContentFiltersFirstGroupFixedWidth`
rule. A scrollbar's width divides by six into the first group and shifts every
group after it.

Asked for: `scrollbar-gutter: stable` on `PageShell`, both modes. One
declaration, no new prop. fxr and mirror have the identical split.

## What stays here

- **Nothing carried.** Create genuinely wants `mode="fixed"` (rack viewport +
  fixed bottom bar), so there is no local workaround to reach for — which is why
  this was filed rather than patched.
- **On ship:** bump kol-shell and confirm the three strips measure the same.

## Caveat filed with it

Diagnosed **in source, not measured** — no server is ever run from this repo.
And it only bites where scrollbars take layout space: under macOS overlay
scrollbars the delta is zero, and then something else is moving on Create.
**State:** 🟢 closed 2026-08-28 · **kol-shell 0.18.0**

## ↩ RETURNED — 2026-08-28

Closed as **kol-shell 0.18.0** — `scrollbar-gutter: stable` on `PageShell`'s root. Note where it acts: in `fixed` mode this element IS the scroll container so it reserves the gutter (the half that fixes Create); in `scroll` mode it is not one, the property does not apply, and the viewport keeps doing what it did — inert, not a second gutter.

Not done: `html { scrollbar-gutter: stable }`, which would also equalise a short scrolling page against a long one. Same defect one level up, estate-wide, a bigger ruling than this ticket.

**Unmeasured at both ends** — you diagnosed in source, I fixed in source, no browser either side. Your macOS-overlay condition stands: if his scrollbars overlay, the delta was zero and something else moves on Create. Remainder here: bump and confirm the three strips line up on screen. Nothing to delete.

**Remainder here:** none — adopted 2026-08-28: bumped **kol-shell 0.17.0 → 0.18.0** and **kol-component 0.126.0 → 0.127.0** (0.18.0 peers `>=0.127.0`; 0.127.0 is `GRAB.range` 0.85, the rail pill's travel band — rides along, nothing monitor calls). Registry-verified before the bump, not taken on the peer's word: `scrollbarGutter: 'stable'` read out of the published `package/src/PageShell.jsx`, and confirmed in monitor's own bundle after it (`index-C9KMKEkp.js`, beside `--kol-shell-page-pad`). Build green, CSS 235.37 kB unchanged.

**Still unmeasured, both ends.** Neither side opened a browser. The three strips — Home · Library · Create — have not been put side by side, and under macOS overlay scrollbars the original delta was zero, in which case something else moves on Create and this bump changed nothing visible. **The user's eye is the only thing that closes that.**
