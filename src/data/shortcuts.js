// Canonical keyboard-shortcut list — ONE array feeding both surfaces
// (ShellHomeSystem): `SettingsShortcuts` on /settings and `ShortcutsOverlay`
// in the rack, both reading `combo` (kol-shell ≥0.9.0). Sectioned 2026-08-27
// because SettingsShortcuts lays sections out six columns × two, column-first.
//
// The section names are new copy (the flat list had none) — rename freely.
//
// `routes` (kol-shell 0.65.0, CommandOverlayModes): the `S` sheet shows the current page's sections first
// and the rest muted under ELSEWHERE. App has none — it works everywhere. The keys themselves are already
// page-local: `useKeybindings` is mounted by the rack alone.
export const SHORTCUT_SECTIONS = [
  {
    section: 'App',
    items: [
      { label: 'Go to page', combo: '⌥ then 1–5' },
      { label: 'Settings', combo: ',' },
    ],
  },
  {
    section: 'Rack',
    routes: ['/rack'],
    items: [
      { label: 'Shortcuts', combo: 'S' },
      { label: 'Sidebar', combo: 'H' },
      { label: 'Add module', combo: '⌘ K' },
      { label: 'Edit mode', combo: 'E' },
      { label: 'Mute all', combo: 'M' },
    ],
  },
  {
    section: 'Stage',
    routes: ['/stage'],
    items: [
      { label: 'Modules', combo: 'H' },
    ],
  },
  {
    section: 'Cables',
    routes: ['/rack'],
    items: [
      { label: 'Cable lock', combo: 'C' },
      { label: 'Cable visibility', combo: 'O' },
      { label: 'Patch table', combo: 'P' },
      { label: 'Clear display', combo: 'D' },
    ],
  },
  {
    section: 'View',
    routes: ['/rack'],
    items: [
      { label: 'Lock view', combo: 'L' },
      { label: 'Zoom in / out', combo: '+ / −' },
      { label: 'Reset zoom', combo: '0' },
      { label: 'Snap positions', combo: '1–9' },
    ],
  },
  {
    section: 'Pointer',
    routes: ['/rack'],
    items: [
      { label: 'Pan', combo: 'Space' },
      { label: 'Zoom', combo: 'Alt+Scroll' },
      { label: 'Pan', combo: 'Scroll' },
      { label: 'Joystick axis lock', combo: 'Shift' },
    ],
  },
]
