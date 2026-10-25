/**
 * SettingsPage — monitor's settings as the ROWS of the Hub's settings rail (2026-10-24): every word is monitor's,
 * the Hub draws every label, value and note in its own class. Shortcuts · About · Repo are the Hub's own tabs on
 * every rail, drawn from `shortcuts`, `APP.about` and `APP.links` — the last two live here as data. The old page
 * (`SettingsContent` / `AboutContent` as JSX) is in `_tmp/2026-10-24-settings-typed-rows/`.
 */
import { useHoverFlip, setHoverFlip } from '../hooks/useHoverFlip'

/* a hook, not a constant: the Hub's rail takes TYPED rows only (no `render`), so a live switch is its `on` + `onChange` */
export const useSettings = () => {
  const hoverFlip = useHoverFlip()
  return {
  sections: [
    { label: 'Display', note: 'Zoom defaults — coming soon', rows: [{ label: 'Hover flips card', type: 'switch', on: hoverFlip, onChange: () => setHoverFlip(!hoverFlip) }] },
    { label: 'Performance', note: 'Frame rate cap, render quality — coming soon' },
    {
      label: 'Patches',
      note: [
        'Sign in to sync your patches across devices; signed out, everything stays in this browser.',
        'Available in the Patch module and the sidebar Presets section.',
      ],
      rows: [
        { label: 'Export', value: 'Downloads the current rack as a JSON file — modules, connections, and settings', align: 'fill' },
        { label: 'Import', value: 'Loads a JSON patch file into the rack, restoring the full state', align: 'fill' },
      ],
    },
  ],
  }
}

/* About as DATA — paragraphs the Hub draws */
export const ABOUT = [
  'Monitor treats math the way eurorack treats voltage — as a universal, scalable medium. Generators compute geometry through trigonometry and parametric equations. A 3D wireframe is 6 trig calls and a rotation matrix. A Lissajous curve is two sine functions. The system draws geometry, not pixels, which is why 50 modules run at 60fps in a browser.',
  'The modular rack engine at the core of Monitor. 50 modules across 5 categories — control, math, generators, display, utility — connected through virtual patch cables and evaluated in topological order.',
]

export const LINKS = [
  { label: 'GitHub', url: 'https://github.com/Tor-Grimsson/kol-monitor' },
  { label: 'Kolkrabbi', url: 'https://monitor.kolkrabbi.io' },
  { label: 'Vercel', url: 'https://kol-monitor-six.vercel.app/' },
]
