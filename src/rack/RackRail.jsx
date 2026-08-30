import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Button from '@kolkrabbi/kol-component/atoms/Button'
import { GRAB } from '@kolkrabbi/kol-component/utilities/motion'
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
 * edge, the drag, the width variable, the rows — is NavRail's, copied because
 * `useGrabEdge` / `useRailDrag` are module-private upstream.
 *
 * THE TICKET THIS PROVES (to file at kol-ds-ui once the user has seen it):
 *   1. a sub row that carries an action instead of a path
 *   2. a trailing `meta` string on a row (`1U 8hp`, a connection count)
 *   3. a consumer slot in the open state, for chrome that is not a row list
 * When that ships, this file is retired to `_tmp/` and `railComponent` goes
 * back to the default.
 *
 * KEEP IN SYNC: copied from @kolkrabbi/kol-shell@0.17.0 `src/NavRail.jsx`.
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

/* THE GRAB EDGE — proximity, not contact; along the line it dwells at the
 * pointer and re-targets past `GRAB.stick`. NavRail's, verbatim. */
function useGrabEdge(ref) {
  useEffect(() => {
    let raf = 0
    const onMove = ({ clientX, clientY }) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const h = ref.current
        if (!h) return
        const r = h.getBoundingClientRect()
        const dist = Math.abs(clientX - (r.left + r.width / 2))
        const near = dist <= GRAB.near || (h.classList.contains('is-near') && dist <= GRAB.sleep)
        h.classList.toggle('is-near', near)
        if (!near) return
        const edge = (r.height * (1 - GRAB.range)) / 2
        const along = Math.min(Math.max(clientY - r.top, edge), r.height - edge)
        if (h.dataset.grabSeeded && Math.abs(along - Number(h.dataset.grabTarget)) < GRAB.stick) return
        h.dataset.grabTarget = String(along)
        const vars = { '--kol-rail-grab-y': `${along}px` }
        if (h.dataset.grabSeeded) gsap.to(h, { ...vars, ...GRAB.travel, overwrite: 'auto' })
        else { gsap.set(h, vars); h.dataset.grabSeeded = '1' }
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [ref])
}

/* THE DRAG — the width follows the pointer between closed and open; release
 * snaps to the nearer state, a click toggles. NavRail's, verbatim. */
function useRailDrag(railRef, grabRef, onSnap) {
  useEffect(() => {
    const strip = grabRef.current, rail = railRef.current, root = document.documentElement
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
  }, [railRef, grabRef, onSnap])
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
}) {
  const railRef = useRef(null)
  const grabRef = useRef(null)
  const slotRef = useRef(null)
  const ctx = useRailSlot()
  const [railOpen, setRailOpen] = useState(false)
  useGrabEdge(grabRef)
  useRailDrag(railRef, grabRef, setRailOpen)

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
      style={{ width: `var(${RAIL_W})` }}
    >
      <div ref={grabRef} className="kol-rail-grab" />
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
