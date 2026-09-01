# ComponentUseGrabEdgeSubpath — `useGrabEdge` has no subpath, so the barrel is the only way in

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ComponentUseGrabEdgeSubpath.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-09-01

## Why it went there

kol-component 0.147.0 promoted `useGrabEdge` out of kol-shell's `NavRail`
(`OneGrabGestureBothRails`) — which is precisely what this repo needed.
`src/rack/RackRail.jsx` is a sanctioned fork of `NavRail` through the
`railComponent` seam, and its copy of the hook was byte-identical to the one
that shipped. The copy is deleted; the import is not the one it should be.

`./utilities/*` maps to `./src/utilities/*.jsx`, and `useGrabEdge.js` is a
`.js`. The six other `.js` files in that folder — `id3`, `frontmatter`,
`markdownToHtml`, `mediaKinds`, `ratios`, `motion` — each carry an explicit
entry; this one was added without one, so the deep import is
`ERR_MODULE_NOT_FOUND`. `useInViewAttention.js` shipped in the same wave under
`src/hooks/`, where the wildcard is already `.js`, and is unaffected.

Not a consumer's to fix: it is one line in the package's exports map.

**Remainder here:** on ship, swap `import { useGrabEdge } from
'@kolkrabbi/kol-component'` in `src/rack/RackRail.jsx` for the subpath and drop
the four-line comment that explains why it is a barrel import.

## ✅ RETURNED — 2026-09-01 · kol-component@0.150.1

Moved the file where it belonged: src/hooks/useGrabEdge.js, where the ./hooks/* wildcard already resolves .js (the useInViewAttention precedent). The deep path is @kolkrabbi/kol-component/hooks/useGrabEdge — NOT utilities/useGrabEdge; that path never worked and now never will. Barrel import unchanged; framework and shell (the only importers) both use the barrel.

**Remainder here:** bump kol-component@0.150.1; swap the carried barrel import for hooks/useGrabEdge if the deep path is still wanted

## ⚠️ ADOPTION BLOCKED — 2026-09-01 · 0.150.0 does not build

Bumped, swapped to `hooks/useGrabEdge`, and the build failed — **not on the
deep path, on the barrel**: the move kept `import { GRAB } from './motion.js'`
(`src/hooks/useGrabEdge.js:2`) but `motion.js` stayed in `src/utilities/`, so
rolldown fails resolution for every barrel consumer of 0.150.0. Reported back
to the live kol-ds-ui session over SendMessage with the one-line fix
(`'../utilities/motion.js'`) and a deprecate ask on 0.150.0.

**State here:** component pinned back to **0.149.0** on the carried barrel
import (build green); **kol-theme 0.117.0 adopted** (additive, nothing
removed). `RackRail.jsx`'s import comment names the path to take on the fixed
release.

**Remainder here:** on the fixed release — bump, swap the barrel import for
`@kolkrabbi/kol-component/hooks/useGrabEdge`, drop the rollback comment.

## ✅ ADOPTED — 2026-09-01 · kol-component@0.150.1

Same-sitting round trip: the defect went back over SendMessage, **0.150.1**
shipped the one-line fix (`'../utilities/motion.js'` — registry-verified in the
shipped source, and the 0.150.0 → 0.150.1 diff is exactly package.json + the
fixed hook), and 0.150.0 is deprecated on the registry. Bumped, the barrel
import swapped for `@kolkrabbi/kol-component/hooks/useGrabEdge`, rollback
comment dropped. Build green, lint unchanged at 2335.

**Remainder here: none.**
