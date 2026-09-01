// Canonical keyboard-shortcut list — ONE array feeding both surfaces
// (ShellHomeSystem): `SettingsShortcuts` on /settings and `ShortcutsOverlay`
// in the rack, both reading `combo` (kol-shell ≥0.9.0). Sectioned 2026-08-27
// because SettingsShortcuts lays sections out six columns × two, column-first.
//
// The section names are new copy (the flat list had none) — rename freely.
export const SHORTCUT_SECTIONS = [
  {
    section: 'App',
    items: [
      { label: 'Jump to rail item (Home first)', combo: '⌥ then 1–5' },
      { label: 'Settings (toggles back)', combo: ',' },
      { label: 'Settings on the stage (its own drawer)', combo: ',' },
    ],
  },
  {
    section: 'Rack',
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
    items: [
      { label: 'Show / hide modules', combo: 'H' },
    ],
  },
  {
    section: 'Cables',
    items: [
      { label: 'Cable lock', combo: 'C' },
      { label: 'Cable visibility', combo: 'O' },
      { label: 'Clear display', combo: 'D' },
    ],
  },
  {
    section: 'View',
    items: [
      { label: 'Lock view', combo: 'L' },
      { label: 'Zoom in / out', combo: '+ / −' },
      { label: 'Reset zoom', combo: '0' },
      { label: 'Snap positions', combo: '1–9' },
    ],
  },
  {
    section: 'Pointer',
    items: [
      { label: 'Pan (drag)', combo: 'Space' },
      { label: 'Zoom', combo: 'Alt+Scroll' },
      { label: 'Pan', combo: 'Scroll' },
      { label: 'Joystick axis lock', combo: 'Shift' },
    ],
  },
]
