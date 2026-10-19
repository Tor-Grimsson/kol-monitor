# SignalIconsFromMonitor

**Filed:** 2026-10-18 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SignalIconsFromMonitor.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-18

## What stays here

On return: bump kol-icons, pair section 1's new names in `src/pages/dev/IconsDiff.jsx`, then switch the app's icons
to kol-icons where the user approves.

## ✅ RETURNED — 2026-10-18 · kol-icons@0.40.0

kol-icons 0.40.0, approved on Development › Open questions › Round 12 (two review rounds). All 25 already had a kol-icons name — a KOL redraw that had drifted from monitor's (apps/rack uses the same names) — so each is redrawn IN PLACE to monitor's shape, to the icon guide (1.5 round strokes, the 3.5–20.5 live area, rings on the keyline circle, solid dots, no opacity). Names, monitor → kol-icons: ascii-back · ascii-dot · ascii-pipe · clr-comp · clr-tri · clr-mono · dith-cross · dith-hex · dith-melt · dith-xhatch · gen-color · gen-pattern · grad-rad · line-grid · line-lissa · line-spiral · radial-default · radial-random · ramp-down · seq-a · seq-b · seq-c · seq-d · tr-carets — same name; grid-03 → `grid-3x3` (new, layout; `grid` stays 2×2). Today's boxed ascii glyphs stay as `ascii-back-02` · `ascii-dot-02` · `ascii-pipe-02`. User's review changes vs monitor's drawing: radial-default/random are smooth outlines, line-spiral a true spiral, grad-rad two solid rings, dith-xhatch a plain crosshatch (no grey diamond), dith-melt's drips clear their balls, ramp-down is one sawtooth period (distinct from ascii-back).

**Remainder here:** bump kol-icons@0.40.0 (tarball HTTP 200); pair the names in `src/pages/dev/IconsDiff.jsx`; switch the app to kol-icons

## Adopted here — 2026-10-18

kol-icons 0.40.0; the 24 pair by name on the Icons tab, grid-03 → grid-3x3. App switch-over waits on the user. **Remainder here:** switch the app to kol-icons.

## Switched — 2026-10-18

The app renders kol-icons: every local `Icon` import now imports `{ Icon }` from `@kolkrabbi/kol-icons`, and the names are renamed to their shape matches. The one exception is Stage's background-video button: kol-icons has no `video-off`, so that button keeps the local set. **Remainder here:** `video-off` (needs a kol-icons icon), then retire `src/icons/`.
