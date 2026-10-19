# NavRailConsumerSlot — the opened rail carries a consumer slot for content that is not a row list

**Filed:** 2026-10-15 → **kol-ds-ui** · kol-shell 0.63.0
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/NavRailConsumerSlot.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-15 — kol-shell 0.64.0 · adopted here the same sitting

## Why it went there

`src/rack/RackRail.jsx` is a NavRail fork that exists only to add a portal slot for the rack's module catalog.
It has drifted from 0.17.0 to unrecognisable against 0.63.0.

## What stays here

On ship: bump, drop `railComponent={RackRail}`, wire `RackRailPanel` into the DS slot, and retire
`RackRail.jsx` (+ `useRailSlot.jsx` if the DS ships its own) to `_tmp/`. Until then, re-sync the fork to
NavRail 0.63.0 by hand.

## ✅ RETURNED — 2026-10-15 · kol-shell@0.64.0

kol-shell exports RailSlotProvider / useRailSlot (monitor's shape: { slot, setSlot, railOpen, setRailOpen }). Under the provider NavRail's opened width carries a slot below the rows, always mounted — zero tall closed, flex-1 open with the rows shrunk to content — and publishes its node; the page portals in with its own state. No provider → no slot, the rail unchanged. Verified: a portalled panel kept its click count across open → close, slot 0px closed / 700px open, railOpen mirrored true, no slot without the provider, 0 console errors.

**Remainder here:** bump kol-shell@0.64.0; drop railComponent={RackRail}, use the exported RailSlotProvider/useRailSlot, retire both forks to _tmp/
