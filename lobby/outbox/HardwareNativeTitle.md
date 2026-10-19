# HardwareNativeTitle — kol-hardware's `IconButton` and `JackSocket` draw the browser's native tooltip

**Filed:** 2026-10-15 → **kol-ds-ui** · kol-hardware 0.4.1
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HardwareNativeTitle.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-16 — kol-hardware 0.5.0 · adopted here

## Why it went there

Plan 13 W5.1 cleared every native `title` monitor owns; the rest are rendered inside kol-hardware.

## What stays here

On ship: bump kol-hardware and re-run `grep ' title=' src` against the rendered DOM. No call-site change.

## ✅ RETURNED — 2026-10-16 · kol-hardware@0.5.0

`IconButton`, `JackSocket` and `ModuleHeader`'s remove / bypass dots render the DS `Tooltip` attached to the element itself (`asChild`, no wrapper — grid geometry unchanged); kol-hardware renders no `title=` attribute. A jack's tooltip is silent while `pending` or `dimPending` — via the new kol-component@0.262.0 `Tooltip disabled`, so the jack never remounts under the pointer mid-drag. `IconButton` also takes `title` as its `aria-label`. The `title` prop keeps its name. Verified: no `[title]` in the DOM, the key and the jack show their tooltip at rest, none on the jack while pending.

**Remainder here:** bump kol-hardware@0.5.0 + kol-component@0.262.0; no call-site change
