import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, useNavHidden } from '@kolkrabbi/kol-shell'
import logomarkUrl from '@kolkrabbi/kol-brand/svg/favicon-01.svg?url'
import RackRail from '../rack/RackRail.jsx'
import { RailSlotProvider } from '../hooks/useRailSlot.jsx'

// Re-export so rack code (VideoModulo) keeps its import path; the hook must
// be kol-shell's — AppShell provides kol-shell's NavHiddenContext instance.
export { useNavHidden } from '@kolkrabbi/kol-shell'

/**
 * AppLayout — kol-shell's flat 48px `AppShell` rail wrapping the router's
 * `<Outlet/>` (ShellHomeSystem, kol-shell 0.8.0 — adopted 2026-08-27 on
 * kol-fxr's wiring). 0.13.0 made the rail a collapsed kol-framework `SideNav`
 * and **0.16.0 reversed it** (RailFlatGrabOpen, kol-mirror's user ruling) —
 * one fixed column again, grab its right edge to open it to the labels.
 * 0.17.0 adds two-level sections (an item with `sub` gets a caret + 12px L2
 * rows) — monitor's four rungs are all destinations, so none carries one.
 * Do not re-pin 0.16.0: it is deprecated (its NavRail calls a `GRAB.marks`
 * that kol-component removed in 0.126.0).
 * The `nav-*` glyphs ship in kol-icons 0.20.0 (promoted
 * from this repo), the logomark from kol-brand, and `touch="overlay"` mounts
 * the promoted TouchDeviceOverlay — this repo's own policy, now DS-owned.
 *
 * `railToggleKey` is additive: `\` toggles the rail (never while typing; back on
 * every route change), while the rack's `H` keeps hiding it through `useNavHidden`.
 */

const NAV_ITEMS = [
  { icon: 'nav-library', path: '/library', label: 'Library' },
  { icon: 'nav-create', path: '/create', label: 'Create' },
  { icon: 'nav-rack', path: '/rack', label: 'Rack' },
  { icon: 'video', path: '/stage', label: 'Stage' },
]

/* Settings is a pinned rung, not a disclosure — the `settings` prop left with
   the SideNav-backed rail in 0.16.0, and the theme toggle lives on the
   settings page (`SettingsPage.jsx`). */
const BOTTOM_ITEMS = [
  { icon: 'nav-settings', path: '/settings', label: 'Settings' },
]

/* Rail order, logomark first — the same sequence kol-shell's `navKeys` walks. */
const NAV_PATHS = ['/', ...NAV_ITEMS.map(i => i.path)]
const PREFIX_WINDOW_MS = 1200

/* Publishes `--monitor-rail` — the rail's width, or 0 when hidden — so a
   page's FIXED layers (CreatePage's bottom bar) keep clear of it; AppShell
   only offsets in-flow content. fxr's RailFrame, same reason. */
function RailFrame({ children }) {
  const nav = useNavHidden()
  return (
    <div className="contents" style={{ '--monitor-rail': !nav || nav.navHidden ? '0px' : 'var(--kol-shell-rail-width)' }}>
      {children}
    </div>
  )
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  /* Settings is a TOGGLE: clicking the rung while already on /settings goes
     back where you came from. The rail fires onNavigate on the active item too,
     so the swap lives here. Ref (not state) — nothing renders from it. */
  const lastPathRef = useRef('/')
  useEffect(() => {
    if (location.pathname !== '/settings') lastPathRef.current = location.pathname
  }, [location.pathname])
  const handleNavigate = (path) =>
    navigate(path === '/settings' && location.pathname === '/settings' ? lastPathRef.current : path)

  /* ⌥ works BOTH ways (user, 2026-08-28): the chord ⌥+1, and tmux-style —
     tap ⌥ alone, let go, then press a digit. kol-shell's `navKeys` does only
     the chord and listens on the same window, so it stays off.
     "Alone" is the whole trick: any other key, pointer or wheel between ⌥ down
     and ⌥ up means the user was reaching for ⌥-click knob reset or ⌥-wheel zoom,
     and nothing arms. Capture phase + stopImmediatePropagation so the consumed
     digit never also reaches the rack's 1–9 snap-view binding. */
  useEffect(() => {
    let armed = false
    let alone = false
    let timer = null
    const disarm = () => { armed = false; clearTimeout(timer) }
    const busy = () => { alone = false; disarm() }

    const onKeyDown = (e) => {
      if (e.key === 'Alt') { if (!e.repeat) alone = true; return }
      /* BOTH forms fire (user, 2026-08-28): the chord ⌥+1 and the prefix ⌥
         then 1. Any non-Alt key ends the "alone" run, so a chord cannot also
         arm the prefix on the ⌥ release and navigate twice. */
      const chord = e.altKey && !e.metaKey && !e.ctrlKey
      alone = false
      if (!armed && !chord) return
      if (e.target.closest('input, textarea, [contenteditable]')) { disarm(); return }
      /* `code`, not `key`: on macOS ⌥+1 emits '¡', so the chord form has no
         digit in `e.key` at all. */
      const digit = /^Digit([1-9])$/.exec(e.code)
      disarm()
      if (!digit) return
      const n = Number(digit[1])
      if (n <= NAV_PATHS.length) {
        e.preventDefault()
        e.stopImmediatePropagation()
        navigate(NAV_PATHS[n - 1])
      }
    }
    const onKeyUp = (e) => {
      if (e.key !== 'Alt' || !alone) return
      alone = false
      armed = true
      clearTimeout(timer)
      timer = setTimeout(() => { armed = false }, PREFIX_WINDOW_MS)
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('pointerdown', busy)
    window.addEventListener('wheel', busy, { passive: true })
    window.addEventListener('blur', busy)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointerdown', busy)
      window.removeEventListener('wheel', busy)
      window.removeEventListener('blur', busy)
    }
  }, [navigate])

  return (
    <RailSlotProvider>
    <AppShell
      items={NAV_ITEMS}
      bottomItems={BOTTOM_ITEMS}
      logomark={{ svgUrl: logomarkUrl, title: 'Monitor' }}
      currentPath={location.pathname}
      onNavigate={handleNavigate}
      railToggleKey={'\\'}
      /* `navKeys` is OFF: it fires on the ⌥+digit CHORD and the local prefix
         listener above replaces it. Both listen on window, so they cannot both
         be on. The prefix form is a local carry — it belongs upstream beside
         `navKeys` (AppShellNavKeysHomeFirst shipped the ordering it walks). */
      /* the rack's own rail — kol-shell 0.17.0's `railComponent` seam. A LOCAL
         FORK that adds a slot to the opened width so the rack can portal its
         module catalog in; see `RackRail.jsx` for the ticket it proves. */
      railComponent={RackRail}
      touch="overlay"
      appName="Monitor"
      /* the main background: surface-primary is the back of the back (AppShell
         paints it), the wash is the transparent step over it (kol-shell 0.11.0,
         ShellPageWash). fg-02 is the APP TIER's rung — Home · Library · Settings
         and the detail pages. The rack alone sits a step up at fg-04 and
         re-declares the variable on its own root (user, 2026-08-27). */
      pageWash="var(--kol-fg-02)"
    >
      <RailFrame>
        <Outlet />
      </RailFrame>
    </AppShell>
    </RailSlotProvider>
  )
}
