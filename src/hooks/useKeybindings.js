// Keyboard shortcuts for the rack workspace
// Separated from VideoModulo for maintainability

import { useEffect } from 'react'

export function useKeybindings({ rackOuterRef, rackRef, spaceDown, zoom, setZoom, setPanOffset, setSidebarOpen, setViewLocked, viewLockedRef, rackStateRef, toggleAll, setCableLocked, setCableVisibility, setShowShortcuts }) {
  useEffect(() => {
    const noInput = (e) => !e.target.closest('input, textarea')

    const onKeyDown = (e) => {
      // Space: grab cursor for pan
      if (e.code === 'Space' && !e.repeat && noInput(e)) {
        e.preventDefault()
        spaceDown.current = true
        if (rackOuterRef.current) rackOuterRef.current.style.cursor = 'grab'
      }

      // Alt: zoom cursor
      if (e.key === 'Alt' && !e.repeat) {
        if (rackOuterRef.current) rackOuterRef.current.style.cursor = 'zoom-in'
      }

      const mod = e.metaKey || e.ctrlKey

      // Zoom in/out/reset
      if ((mod || noInput(e)) && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(z => Math.min(2, z + 0.1)) }
      if ((mod || noInput(e)) && e.key === '-') { e.preventDefault(); setZoom(z => Math.max(0.5, z - 0.1)) }
      if ((mod || noInput(e)) && e.key === '0') { e.preventDefault(); setZoom(1); setPanOffset({ x: 0, y: 0 }) }

      // Sidebar
      if ((mod || noInput(e)) && e.key === 'h') { e.preventDefault(); setSidebarOpen(s => !s) }

      // Edit mode
      if ((mod || noInput(e)) && e.key === 'e') { e.preventDefault(); const r = rackStateRef.current; r.setEditMode(!r.editMode) }

      // Mute all
      if ((mod || noInput(e)) && e.key === 'm') { e.preventDefault(); toggleAll() }

      // Lock view
      if ((mod || noInput(e)) && e.key === 'l') { e.preventDefault(); setViewLocked(v => { viewLockedRef.current = !v; return !v }) }

      // Cable lock
      if (noInput(e) && !mod && e.key === 'c') { e.preventDefault(); setCableLocked(v => !v) }

      // Cable visibility
      if ((mod || noInput(e)) && e.key === 'o') { e.preventDefault(); setCableVisibility(v => v === 'on' ? 'off' : v === 'off' ? 'trans' : 'on') }

      // Shortcuts overlay
      if (noInput(e) && !mod && e.key === 's') { e.preventDefault(); setShowShortcuts(v => !v) }

      // Snap view: 4 5 6 = top-left/center/right, 1 2 3 = bottom-left/center/right
      if (noInput(e) && !mod && '123456'.includes(e.key)) {
        e.preventDefault()
        const el = rackRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const vw = window.innerWidth
        const vh = window.innerHeight
        const p = 48
        const targets = {
          4: { x: p, y: p },
          5: { x: (vw - rect.width) / 2, y: p },
          6: { x: vw - p - rect.width, y: p },
          1: { x: p, y: vh - p - rect.height },
          2: { x: (vw - rect.width) / 2, y: vh - p - rect.height },
          3: { x: vw - p - rect.width, y: vh - p - rect.height },
        }
        const t = targets[e.key]
        const dx = (t.x - rect.left) / zoom
        const dy = (t.y - rect.top) / zoom
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      }
    }

    const onKeyUp = (e) => {
      if (e.code === 'Space') { spaceDown.current = false; if (rackOuterRef.current) rackOuterRef.current.style.cursor = '' }
      if (e.key === 'Alt') { if (rackOuterRef.current) rackOuterRef.current.style.cursor = '' }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [zoom])
}
