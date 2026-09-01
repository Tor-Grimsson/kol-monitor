import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Button from '@kolkrabbi/kol-component/atoms/Button'
import { GRAB } from '@kolkrabbi/kol-component/utilities/motion'
/* the grab pill's proximity wake is the DS's now — lifted out of NavRail so
 * both rails on a screen feel the same; the local copy this replaced was
 * byte-identical. Under hooks/ since 0.150.1 (ComponentUseGrabEdgeSubpath —
 * it is a hook, and ./hooks/* already resolves .js; 0.150.0 shipped the move
 * with a broken relative import and is deprecated). */
import useGrabEdge from '@kolkrabbi/kol-component/hooks/useGrabEdge'
import { Icon } from '@kolkrabbi/kol-icons'
import { Logomark } from '@kolkrabbi/kol-shell'
import { useRailSlot } from '../hooks/useRailSlot.jsx'

/**
 * RackRail — a LOCAL FORK of kol-shell's `NavRail`, rendered through the
 * `railComponent` seam that shipped for exactly this in kol-shell 0.17.0
 * ("A seam for experiments, not an invitation to keep a fork").
 *
 * WHY THE FORK EXISTS. The DS rail's second level is navigation and only
 * navigation — `sub: [{ icon?, path, label }]` fires `onNavigate(path)`. The
 * rack's panel is not navigation: a module row INSERTS a module into the rack,
 * a workbench row RETURNS one. There is no path to route to. The rail also has
 * no way for a consumer to put its own content in the opened width.
 *
 * So this fork adds ONE thing to NavRail: a slot in the opened rail that a page
 * portals its own content into (`useRailSlot`). Everything else — the grab
 * edge, the drag, the width variable, the rows — is NavRail's. `useGrabEdge`
 * is now IMPORTED (kol-component ships it since 0.147.0); `useRailDrag` is
 * still module-private upstream and still copied.
 *
 * THE TICKET THIS PROVES (to file at kol-ds-ui once the user has seen it):
 *   1. a sub row that carries an action instead of a path
 *   2. a trailing `meta` string on a row (`1U 8hp`, a connection count)
 *   3. a consumer slot in the open state, for chrome that is not a row list
 * When that ships, this file is retired to `_tmp/` and `railComponent` goes
 * back to the default.
 *
 * KEEP IN SYNC: copied from @kolkrabbi/kol-shell@0.17.0 `src/NavRail.jsx`,
 * re-diffed against 0.31.0 (2026-09-01). Upstream has since gained two things
 * this fork deliberately does NOT take: `drawer` mode (monitor is on
 * `touch="overlay"`, so it never runs) and a section row that opens the rail on
 * press (`sub` is navigation-only upstream — the whole reason for the fork).
 */
const RAIL_W = '--kol-shell-rail-width'
const CLOSED = 48

/* the OPEN width is the sidenav's ladder (kol-framework: 264, 320 from 1536),
 * read at drag time so the rail lands on whichever rung the window is on */
const openWidth = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--kol-sidenav-w').trim()
  const px = parseFloat(v)
  return Number.isFinite(px) ? (v.endsWith('rem') ? px * 16 : px) : 264
}

/* THE DRAG — the width follows the pointer between closed and open; release
 * snaps to the nearer state, a click toggles. NavRail's, verbatim. */
function useRailDrag(railRef, grabRef, onSnap, enabled = true) {
  useEffect(() => {
    const strip = grabRef.current, rail = railRef.current, root = document.documentElement
    /* A DRAWER IS NOT A DRAGGABLE RAIL (NavRail 0.31.0, ShellRailNoDrawerOnMobile).
     * Off-canvas at a fixed width, the content owns the viewport — and this
     * effect writes `--kol-shell-rail-width` on `:root`, the very token AppShell
     * zeroes in drawer mode. Running it would fight the shell from the first
     * frame: `gsap.set` below re-inflates the rail to 48px before a pointer has
     * moved. */
    if (!enabled) return undefined
    if (!strip || !rail) return undefined
    gsap.set(root, { [RAIL_W]: `${CLOSED}px` })
    let drag = null
    const snapTo = (w) => {
      gsap.to(root, { [RAIL_W]: `${w}px`, ...GRAB.snap, overwrite: 'auto' })
      onSnap(w !== CLOSED)
    }
    const onDown = (e) => {
      strip.setPointerCapture(e.pointerId)
      gsap.killTweensOf(root)
      drag = { x: e.clientX, w: rail.offsetWidth, open: openWidth(), moved: false }
      strip.classList.add('is-dragging')
    }
    const onMove = (e) => {
      if (!drag) return
      const dx = e.clientX - drag.x
      if (Math.abs(dx) > GRAB.slop) drag.moved = true
      root.style.setProperty(RAIL_W, `${Math.min(Math.max(drag.w + dx, CLOSED), drag.open)}px`)
    }
    const onUp = () => {
      if (!drag) return
      const w = rail.offsetWidth
      const open = drag.open
      snapTo(drag.moved ? (w > (CLOSED + open) / 2 ? open : CLOSED) : (drag.w > CLOSED ? CLOSED : open))
      drag = null
      strip.classList.remove('is-dragging')
    }
    strip.addEventListener('pointerdown', onDown)
    strip.addEventListener('pointermove', onMove)
    strip.addEventListener('pointerup', onUp)
    strip.addEventListener('pointercancel', onUp)
    return () => {
      strip.removeEventListener('pointerdown', onDown)
      strip.removeEventListener('pointermove', onMove)
      strip.removeEventListener('pointerup', onUp)
      strip.removeEventListener('pointercancel', onUp)
    }
  }, [railRef, grabRef, onSnap, enabled])
}

/* one row: the rung exactly where the closed rail had it, then the label — the
 * row clips to the rail's width. NavRail's, minus the `sub` level monitor has
 * no item for. */
function RailItem({ icon, path, label, currentPath, onNavigate, iconComponent }) {
  const active = path === '/' ? currentPath === '/' : currentPath.startsWith(path)
  return (
    <div className="flex items-center gap-3 w-full overflow-hidden shrink-0">
      <Button
        iconOnly={icon}
        iconSize={20}
        iconComponent={iconComponent}
        variant="nav"
        size="md"
        className="shrink-0"
        aria-current={active ? 'page' : undefined}
        style={{ color: 'var(--kol-oq-96)' }}
        onClick={() => onNavigate?.(path)}
        title={label}
        aria-label={label}
      />
      <span
        className="kol-helper-12 uppercase text-oq-96 flex-1 min-w-0 truncate cursor-pointer"
        onClick={() => onNavigate?.(path)}
      >
        {label}
      </span>
    </div>
  )
}

export default function RackRail({
  items = [],
  bottomItems = [],
  logomark,
  currentPath = '',
  onNavigate,
  iconComponent = Icon,
  hidden = false,
  /* OFF-CANVAS MODE, passed by AppShell from `touch="drawer"` (kol-shell
   * 0.31.0). Without taking it this fork renders at the token AppShell has
   * just zeroed — a hamburger that opens a 0px rail. Three things change and
   * they are NavRail's three: no grab strip, no drag, and the width comes from
   * `--kol-shell-drawer-width` instead of the live rail token. Rows are always
   * labelled, because a drawer is never the 48px column. */
  drawer = false,
}) {
  const railRef = useRef(null)
  const grabRef = useRef(null)
  const slotRef = useRef(null)
  const ctx = useRailSlot()
  const [railOpen, setRailOpen] = useState(false)
  /* the grab strip is not rendered in drawer mode, so the hook's ref stays null
   * and it no-ops on its own — no second argument needed */
  useGrabEdge(grabRef)
  useRailDrag(railRef, grabRef, setRailOpen, !drawer)

  /* publish the slot node and the open state to whoever wants to portal in */
  const setSlot = ctx?.setSlot
  const setCtxOpen = ctx?.setRailOpen
  useEffect(() => { setSlot?.(slotRef.current); return () => setSlot?.(null) }, [setSlot])
  useEffect(() => { setCtxOpen?.(railOpen) }, [setCtxOpen, railOpen])

  if (hidden) return null
  const row = (item) => (
    <RailItem key={item.path} {...item} currentPath={currentPath} onNavigate={onNavigate} iconComponent={iconComponent} />
  )
  return (
    <div
      ref={railRef}
      className="kol-shell-rail bg-surface-primary border-r border-fg-08 fixed inset-y-0 left-0 flex flex-col items-start pt-4 pb-4 px-2 gap-2"
      /* a drawer takes its OWN width — the rail token is zeroed in that mode so
       * the content gets the whole viewport back */
      style={{ width: drawer ? 'var(--kol-shell-drawer-width, 240px)' : `var(${RAIL_W})` }}
    >
      {!drawer && <div ref={grabRef} className="kol-rail-grab" />}
      {logomark && (
        <div
          onClick={() => onNavigate?.('/')}
          className="text-oq-96 cursor-pointer flex items-center gap-3 w-full overflow-hidden shrink-0 pt-1 mb-4"
          title={logomark.title}
        >
          <span className="w-8 flex justify-center shrink-0"><Logomark svgUrl={logomark.svgUrl} size={20} /></span>
          <span className="kol-helper-12 uppercase flex-1 min-w-0 truncate">{logomark.title}</span>
        </div>
      )}
      {items.map(row)}
      {/* THE SLOT — the spacer when nothing is portalled in, the panel when
        * something is. Always mounted so the panel keeps its own state across
        * an open/close; collapsed to zero and clipped while closed, which is
        * also what keeps it out of the 48px column. */}
      <div
        ref={slotRef}
        className="w-full min-h-0 overflow-x-hidden"
        style={{ flex: railOpen ? '1 1 auto' : '0 0 0px', overflowY: railOpen ? 'auto' : 'hidden' }}
      />
      {!railOpen && <div className="flex-1" />}
      {bottomItems.length > 0 && <div className="self-stretch -mx-2 border-t border-fg-08" />}
      {bottomItems.map(row)}
    </div>
  )
}
