# ShellDrawerCloseOnSamePath — the drawer stays open when a rung navigates to the path already shown

**Filed:** 2026-09-02 · from **kol-monitor** · kol-shell 0.39.0
**Kind:** defect in `AppShell`'s drawer mode

**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellDrawerCloseOnSamePath.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-09-02 — kol-shell 0.40.0 · adopted here the same sitting

## The finding

Tapping a rail rung in drawer mode closes the drawer through the route-change effect
(`ShellDrawerOpenOnRoute`: "every other path keeps close-on-navigate"). When the rung's
path is the one already shown — Create tapped while on `/create`, which the consumer
treats as "new case" — `pathname` does not change, the effect does not fire, and the
drawer stays open over the page. Measured on kol-monitor at 390: after the tap,
`data-rail-drawer="open"`.

## The ask

Close the drawer on the rung's tap itself (or key the effect on `location.key`, which
changes on every push), not only on a pathname change. Rungs whose path is
`drawerOpenOn` stay as they are.

**Remainder here:** bump on ship; re-check Create → drawer → Create at 390.

## ✅ RETURNED — 2026-09-02 · kol-shell@0.40.0

The tap decides the drawer now, not only the route change. The rail's onNavigate wrapper sets the drawer to the tapped path's rule before delegating — drawerOpenOn rungs keep it open, every other rung closes it, same path or not — so Create tapped on /create folds the drawer even though the pathname never moves. The route effect stays for deep links and the fold. Took the tap over location.key: the shell is router-agnostic and has no location, only the path it is handed. Verified in a real 390 render on the app-shell set: open the drawer on /library, tap Library again → closed; open again, tap Settings → /settings, closed. Tarball checked.

**Remainder here:** bump kol-shell@0.40.0 and re-check Create → drawer → Create at 390 — the drawer folds on the second tap

## ✅ ADOPTED — 2026-09-02 · kol-shell 0.40.0

Bumped; the interim Escape shim in `AppLayout.jsx` is gone. WebKit at 390: Create → drawer → Create rung → drawer closed, new case.

**Remainder here:** none.
