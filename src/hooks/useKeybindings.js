// Keyboard shortcuts for the rack workspace
// Separated from VideoModulo for maintainability

import { useEffect } from 'react'
import { useRailKey } from '@kolkrabbi/kol-component/molecules/Rail'

// VideoModulo-specific keybindings (sidebar, edit, mute, cables, shortcuts, display, library search)
// Viewport keybindings (space, zoom, snap) are handled by RackViewport
export function useKeybindings({ setSidebarOpen, setViewLocked, viewLockedRef, rackStateRef, toggleAll, setCableLocked, setCableVisibility, setDisplayHidden, setShowLibrarySearch, setShowPatchTable }) {
  /* the rails' keys are their roles' (RailRolesOnMonitor 2026-10-25): H the Rack rail, P the patch table, E the bottom
     rail — which is edit mode, so E toggles it */
  useRailKey('page', () => setSidebarOpen(s => !s))
  useRailKey('patch', () => setShowPatchTable(v => !v))
  useRailKey('bottom', () => { const r = rackStateRef.current; r.setEditMode(!r.editMode) })

  useEffect(() => {
    const noInput = (e) => !e.target.closest('input, textarea')

    const onKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey

      // Library search overlay (Cmd/Ctrl+K) — works regardless of input focus
      if (mod && e.key === 'k') { e.preventDefault(); setShowLibrarySearch(v => !v); return }

      // Mute all
      if ((mod || noInput(e)) && e.key === 'm') { e.preventDefault(); toggleAll() }

      // Lock view
      if ((mod || noInput(e)) && e.key === 'l') { e.preventDefault(); setViewLocked(v => { viewLockedRef.current = !v; return !v }) }

      // Cable lock
      if (noInput(e) && !mod && e.key === 'c') { e.preventDefault(); setCableLocked(v => !v) }

      // Cable visibility
      if ((mod || noInput(e)) && e.key === 'o') { e.preventDefault(); setCableVisibility(v => v === 'on' ? 'off' : v === 'off' ? 'trans' : 'on') }

      // Shortcuts overlay
      /* `S` is the Hub's shortcuts sheet (AppHub), on every route — no rack-local copy */

      // Clear display — hide all UI controls
      if (noInput(e) && !mod && e.key === 'd') { e.preventDefault(); setDisplayHidden(v => !v) }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
