# RailRolesOnMonitor — the modules out of the nav rail; the rails on their roles

**Staged:** 2026-10-25 · from a kol-ds-ui session (his review of monitor's rack, with screenshots)
**Change:** stop portalling `RackRailPanel` into the nav rail's slot now; on the next kol-component · kol-shell, put the patch table, the Stage and Rack settings rails and the Workbench on `Rail role` and their keys on `useRailKey`
**Corrected 2026-10-25 (his second review):** the bottom rail OVERLAYS the nav rail (full width) with a 48 icon column inside it — not beside it; H has no scrim; every rail's header is title + × + the hairline.

---

## The problem, in his words

Two screenshots of monitor's rack, 2026-10-25:

1. The nav rail expanded, with the MODULES list (Control · Math · …, every module with its U and HP) under RACK — *"no one asked for this modules sholud not be there overlaid in the rail"* · *"its fucked. not correct."* That list is `RackRailPanel`, portalled through the DS rail slot (`src/rack/VideoModulo.jsx:30` `useRailSlot()`, `:114` `createPortal(<RackRailPanel rack={rack} />, rail.slot)`). The 2026-08-28 ruling that put it there is reversed by this one. The modules live in the Library and in Create; the nav rail navigates.
2. The bottom rail (the Workbench) open — *"we need to fix the bottom rail so its not retarded"*: no header, the × alone top-right, the Edit · Rack · Library side rail with labels and its own chevron, CASE and PARKED floating in empty height. It runs from the viewport's left edge over the nav rail, and that part is RIGHT (his second review: *"it should OVERLAY the navrail … because then we can use same icon system as collapsed siderail … just icons for Edit Rack and library, like a siderail in the bottom rail"*).

## What the DS did (kol-component **0.302.0** · kol-theme **0.190.0**, live 2026-10-25 — `Rail role`, RailRoles)

- `Rail role="patch" | "page" | "settings" | "bottom"` carries the shell: side, width, scrim, padding; `useRailKey(role, onToggle)` binds P · H · , · E. One width, 380 (`--kol-rail-w-app`, round 18 answered — the settings rail as it was). No role draws an edge (round 19 answered; `edge` stays the opt-in).
- `page` is the settings rail's shell without the scrim (his: *"why is H same as labs siderail and not the same as settings?"* · *"H does not include dark overlay, that is only settings"*) — `SettingsPanel variant="rail" role="page"`, typed rows, the page's title; tabs when the page has more than one set (the Stage's parameters and its Mark parameters are its tabs).
- `bottom` runs the full width over the nav rail; inside it `RailNav`, the collapsed nav rail's 48 icon column (Edit · Rack · Library as glyphs, lit when active, no labels, no chevron), the content right of it. Drop the `besideSidebar` class.
- Every rail's header is title + × + the hairline (`Rail` draws it); the foot (`Rail footer` + `SettingsFooter`) is the opt-in on any rail. The shape is in `apps/rails` (5206, E on the Stage) once his second review is built; adopt the shape he confirms.

## The change here

1. **Now, no bump:** `VideoModulo.jsx` stops portalling `RackRailPanel` into `rail.slot`; `RackRailPanel.jsx` → `_tmp/<date>-rack-rail-panel/`. The rail is rows again.
2. **On the bump** (kol-component 0.302.0 · kol-theme 0.190.0): `PatchTableOverlay.jsx:69` → `<Rail role="patch" …>` (drop `side` · `variant` · `backdrop` · `edge` · `shadow` · `closeHover`); `StagePage.jsx:269` and `ModuloSidebar.jsx:36` → `SettingsPanel variant="rail" role="page"` with typed rows where they are rows (or `Rail role="page"`); `Workbench.jsx:86` → `<Rail role="bottom" …>` without the `besideSidebar` class and the local height constants (the role's 30dvh, 80–600). `useKeybindings.js` P · H → `useRailKey('patch', …)` · `useRailKey('page', …)`; E stays monitor's edit-mode key only if it is not the bottom rail's — the role's key for the bottom rail is E.
3. The bottom rail's content onto the kit's shape once he has ruled on the `apps/rails` proposal.

## Definition of done
- [x] The MODULES list is out of the nav rail
- [x] Patch table, Stage and Rack settings, Workbench on `Rail role`; P · H · E through `useRailKey`; the bottom rail over the nav rail with `RailNav` inside
- [x] Receipt back to kol-ds-ui's `lobby/outbox/RailRolesOnMonitor.md`

## Resolution — 2026-10-25

Bumped kol-component 0.302.0 · kol-theme 0.190.0 · kol-framework 0.56.0.

- `RackRailPanel` → `_tmp/2026-10-25-rack-rail-panel/`; the portal and `useRailSlot` out of `src/rack/VideoModulo.jsx`, `RailSlotProvider` out of `src/App.jsx`. The opened nav rail reads Library · Create · Rack · Stage · Dev · Sign in · Settings, nothing else.
- `src/overlays/PatchTableOverlay.jsx` → `Rail role="patch"`; `src/rack/ModuloSidebar.jsx` and the Stage rail in `src/pages/StagePage.jsx` → `Rail role="page"` (380, no scrim).
- `src/rack/Workbench.jsx` → `Rail role="bottom"` with `RailNav` (Edit · Rack · Library glyphs) and `RailHeader` titled by the view; the inner push side rail, its chevron, the height constants and `besideSidebar` are gone.
- H · P · E on `useRailKey` in `src/hooks/useKeybindings.js` and `src/pages/StagePage.jsx` (E toggles edit mode, which is the bottom rail). ⌘H / ⌘E no longer fire — the role's key is bare.
- Verified in Playwright at 1440 on /rack and /stage: E opens the bottom rail over the nav rail (EDIT + × + hairline), H the 380 page rail, P the patch rail; `vite build` green. Shots in `_tmp/2026-10-25-rack-rail-panel/`.
