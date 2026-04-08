import { useState } from 'react'
import Divider from '../components/atoms/Divider'

const TABS = [
  { value: 'settings', label: 'Settings' },
  { value: 'about', label: 'About' },
  { value: 'repo', label: 'Repo' },
]

const TAB_META = {
  settings: { title: 'Settings', subtitle: 'Configuration and preferences' },
  about: { title: 'About', subtitle: 'Monitor by Kolkrabbi' },
  repo: { title: 'Repo', subtitle: 'Source and deployments' },
}

function SettingsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Display</h2>
        <div className="text-fg-48 kol-helper-xxs">Theme, zoom defaults — coming soon</div>
      </div>

      <div>
        <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Performance</h2>
        <div className="text-fg-48 kol-helper-xxs">Frame rate cap, render quality — coming soon</div>
      </div>

      <div>
        <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Patches</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="text-fg-48 kol-helper-xxs" style={{ lineHeight: 1.8, maxWidth: 640, marginBottom: 8 }}>Monitor has no database or user accounts. The rack loads a default init patch on each visit. To keep your work, export it as a JSON file — this saves everything: case layout, modules, knob positions, and cable connections. Import that file to restore exactly where you left off.</div>
          {[
            ['Export', 'Downloads the current rack as a JSON file — modules, connections, and settings'],
            ['Import', 'Loads a JSON patch file into the rack, restoring the full state'],
          ].map(([label, desc]) => (
            <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span className="text-fg-48 kol-helper-xxs" style={{ width: 120, flexShrink: 0 }}>{label}</span>
              <span className="text-fg-32 kol-helper-xxs">{desc}</span>
            </div>
          ))}
          <div className="text-fg-32 kol-helper-xxs" style={{ marginTop: 4 }}>Available in the Patch module and the sidebar Presets section.</div>
        </div>
      </div>

      <div>
        <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Keyboard Shortcuts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Shortcuts', 'S'], ['Sidebar', 'H'], ['Edit mode', 'E'], ['Mute all', 'M'],
            ['Lock view', 'L'], ['Cable lock', 'C'], ['Cable visibility', 'O'],
            ['Zoom in / out', '+ / −'], ['Reset zoom', '0'], ['Clear display', 'D'],
            ['Snap positions', '1–9'], ['Pan (drag)', 'Space'], ['Zoom', 'Alt+Scroll'], ['Pan', 'Scroll'],
          ].map(([label, key]) => (
            <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span className="text-fg-48 kol-helper-xxs" style={{ width: 120, flexShrink: 0 }}>{label}</span>
              <span className="text-fg-32 kol-helper-xxs">{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AboutContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Monitor</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="text-fg-48 kol-helper-xxs" style={{ lineHeight: 1.8, maxWidth: 640 }}>Monitor treats math the way eurorack treats voltage — as a universal, scalable medium. Generators compute geometry through trigonometry and parametric equations. A 3D wireframe is 6 trig calls and a rotation matrix. A Lissajous curve is two sine functions. The system draws geometry, not pixels, which is why 50 modules run at 60fps in a browser.</div>
        </div>
      </div>

      <div>
        <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Video Modulo</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="text-fg-48 kol-helper-xxs" style={{ lineHeight: 1.8, maxWidth: 640 }}>The modular rack engine at the core of Monitor. 50 modules across 5 categories — control, math, generators, display, utility — connected through virtual patch cables and evaluated in topological order.</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="text-fg-32 kol-helper-xxs">Kolkrabbi Vinnustofa</span>
        <span className="text-fg-32 kol-helper-xxs">2026</span>
      </div>
    </div>
  )
}

function RepoContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 className="text-fg-80 kol-helper-s" style={{ marginBottom: 16 }}>Links</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['GitHub', 'https://github.com/Tor-Grimsson/kol-monitor'],
            ['Kolkrabbi', 'https://monitor.kolkrabbi.io'],
            ['Vercel', 'https://kol-monitor-six.vercel.app/'],
          ].map(([label, url]) => (
            <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <span className="text-fg-32 kol-helper-xxs" style={{ width: 72, flexShrink: 0 }}>{label}</span>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-fg-64 kol-helper-xxs hover:text-fg-96 hover:underline">{url}</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState('settings')

  return (
    <div style={{ padding: '48px 48px', paddingTop: 48, overflow: 'hidden', height: '100vh', display: 'flex', flexDirection: 'column' }} className="bg-surface-primary">
      <h1 className="text-fg-96 kol-heading-sm" style={{ marginBottom: 8 }}>
        {TAB_META[tab].title}
      </h1>
      <p className="text-fg-48 kol-text-sm" style={{ marginBottom: 40 }}>
        {TAB_META[tab].subtitle}
      </p>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {TABS.map(t => (
          <span
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`kol-helper-s cursor-pointer select-none ${tab === t.value ? 'text-fg-96' : 'text-fg-32 hover:text-fg-48'}`}
          >{t.label}</span>
        ))}
      </div>

      <Divider className="mb-6" />

      <div style={{ flex: 1, overflow: 'auto', paddingTop: 4, paddingBottom: 4 }}>
        {tab === 'settings' && <SettingsContent />}
        {tab === 'about' && <AboutContent />}
        {tab === 'repo' && <RepoContent />}
      </div>
    </div>
  )
}
