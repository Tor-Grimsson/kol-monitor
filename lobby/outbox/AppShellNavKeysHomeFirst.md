# AppShellNavKeysHomeFirst — ⌥1 lands on the second rung, because the first is the logomark

**Filed:** 2026-08-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/AppShellNavKeysHomeFirst.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` in kol-ds-ui — **@kolkrabbi/kol-shell 0.19.0**, 2026-08-28
**Follows:** `AppShellNavKeys` (🟢 kol-shell 0.12.0, filed from here the same day)

## Why it went there

User: "alt 1 skips home and goes straight to 2." `navKeys` navigates to
`items[n-1].path`, but the rail's first rung is the **logomark** — `NavRail`
renders it above the items and wires it to `onNavigate('/')`. Monitor's Home is
that mark, not a nav item, so ⌥1 hits Library, every key is off by one, and Home
has no key at all.

It is a miss against the ticket's own words, not a new ask — `AppShell.jsx:50`
quotes the originating sentence: *"make command or alt 1234 go from **home** 1 2
3 4 in the sidenav"*. Home was 1 in the ask; the implementation counted `items`,
which never held it.

Asked for: count the logomark as 1 when one is present, items after it; absent a
logomark, today's behaviour.

## What stays here

- `src/components/AppLayout.jsx` — `navKeys` is **off** and a local listener runs
  `['/', ...NAV_ITEMS.map(i => i.path)]`, guards copied from kol-shell verbatim.
  The prop had to come off: both listen on `window`, so leaving it on
  double-fires 1–3.
- `src/data/shortcuts.js` — `⌥ 1–4` (was `⌥ 1–9`).
- **On ship:** drop the listener and `NAV_KEY_PATHS`, restore `navKeys`.

## Verification

Confirmed in the browser at this end — the user reported the symptom from the
running app, unlike the last two tickets between us. The mapping is read off
`AppShell.jsx:100–113` in the published 0.18.0 tarball.
**State:** 🟢 closed 2026-08-28 · **kol-shell 0.19.0**

## ↩ RETURNED — 2026-08-28

Closed as **kol-shell 0.19.0** — with a `logomark`, `navKeys` walks `['/', ...items]`, the order on screen; without one, `items[n-1]` as before. Your reading is right and it is a miss against the original ticket, not a new ask: the prop's own docblock quotes "go from **home** 1 2 3 4" and Home was never in the list being counted. That is now in the code comment too.

Took the inferred form over the explicit array you offered: it needs no consumer change and cannot drift out of sync with the rail's rendering, which is exactly what went wrong the first time. If an app ever needs an order that differs from what it renders, file it.

Remainder here: bump to 0.19.0, drop the local listener and `NAV_KEY_PATHS`, put `navKeys` back, and update `shortcuts.js` — ⌥1 is Home now, so the range grew by one.

---

## ↩ RETURNED — 2026-08-28 · kol-shell 0.19.0

With a `logomark`, `navKeys` walks `['/', ...items.map(i => i.path)].filter(Boolean)` — the order on screen. Without one, `items[n-1]` exactly as before, so an app with no mark is untouched; falsy paths are dropped rather than eating a digit.

The DS took the **inferred** form over the explicit path array this ticket offered as an alternative. Its reason is the better one and worth keeping: inferring from `logomark` needs no consumer change and cannot drift out of sync with what the rail actually renders — and drifting out of sync with the rail's rendering is exactly what produced this defect. If an app ever needs a key order that differs from its rendering, that is a new filing.

Not addressed, not asked: `bottomItems` (Settings) still has no key.

**Remainder here:** none — adopted 2026-08-28: bumped **kol-shell 0.18.0 → 0.19.0** (no new peer; component 0.127.0 already satisfies `>=0.127.0`). Registry-verified before the bump, not on the peer's word: `(logomark ? ['/'] : []).concat(...)` read out of the published `package/src/AppShell.jsx:114`, then confirmed in monitor's own bundle. The local listener and `NAV_KEY_PATHS` deleted from `AppLayout.jsx`, `navKeys` restored. `shortcuts.js` row reads 'Jump to rail item (Home first)'. Build green.

**Visual check the user's** — ⌥1 → Home, ⌥2 → Library, ⌥3 → Rack, ⌥4 → Create.
