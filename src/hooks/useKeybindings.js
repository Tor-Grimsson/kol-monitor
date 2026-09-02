// Keyboard shortcuts for the rack workspace
// Separated from VideoModulo for maintainability

import { useEffect } from 'react'

// VideoModulo-specific keybindings (sidebar, edit, mute, cables, shortcuts, display, library search)
// Viewport keybindings (space, zoom, snap) are handled by RackViewport
export function useKeybindings({ setSidebarOpen, setViewLocked, viewLockedRef, rackStateRef, toggleAll, setCableLocked, setCableVisibility, setShowShortcuts, setDisplayHidden, setShowLibrarySearch, setShowPatchTable }) {
  useEffect(() => {
    const noInput = (e) => !e.target.closest('input, textarea')

    const onKeyDown = (e) => {
      const mod = e.metaKey || e.ctrlKey

      // Library search overlay (Cmd/Ctrl+K) — works regardless of input focus
      if (mod && e.key === 'k') { e.preventDefault(); setShowLibrarySearch(v => !v); return }

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

      // Patch table (P)
      if (noInput(e) && !mod && e.key === 'p') { e.preventDefault(); setShowPatchTable(v => !v) }

      // Clear display — hide all UI controls
      if (noInput(e) && !mod && e.key === 'd') { e.preventDefault(); setDisplayHidden(v => !v) }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
