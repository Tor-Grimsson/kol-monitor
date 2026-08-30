import { SettingsScaffold, SettingsSection, LabelRow, SettingsShortcuts, SettingsLinks, SettingsColophon } from '@kolkrabbi/kol-shell'
// Deep imports are legal since kol-framework 0.20.0 (./src/* exports map)
import ThemeToggle from '@kolkrabbi/kol-framework/src/ThemeToggle.jsx'
import { SHORTCUT_SECTIONS } from '../data/shortcuts.js'

/**
 * SettingsPage — on kol-shell's `SettingsScaffold` (2026-08-15); the shortcuts
 * block, the link list and the colophon are the DS's since kol-shell 0.8.0
 * (ShellHomeSystem — adopted 2026-08-27 on kol-fxr's wiring). The header's
 * mono voice is this repo's own masthead, ruled app-tier in PageHeaderMonoTitle.
 */

const TABS = [
  { value: 'settings', label: 'Settings', title: 'Settings', subtitle: 'Configuration and preferences' },
  { value: 'about', label: 'About', title: 'About', subtitle: 'Monitor by Kolkrabbi' },
  { value: 'repo', label: 'Repo', title: 'Repo', subtitle: 'Source and deployments' },
]

function SettingsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SettingsSection title="Display">
        <LabelRow label="Theme" align="center">
          {/* fill="subtle": on a page this toggle IS a button (the component's
              own spec); system lives behind alt-click, per the DS ruling. */}
          <ThemeToggle fill="subtle" size="sm" />
        </LabelRow>
        <div className="text-fg-48 kol-helper-12">Zoom defaults — coming soon</div>
      </SettingsSection>

      <SettingsSection title="Performance">
        <div className="text-fg-48 kol-helper-12">Frame rate cap, render quality — coming soon</div>
      </SettingsSection>

      <SettingsSection title="Patches">
        <div className="text-fg-48 kol-mono-14" style={{ maxWidth: 640, marginBottom: 8 }}>Monitor has no database or user accounts. The rack loads a default init patch on each visit. To keep your work, export it as a JSON file — this saves everything: case layout, modules, knob positions, and cable connections. Import that file to restore exactly where you left off.</div>
        <LabelRow label="Export">Downloads the current rack as a JSON file — modules, connections, and settings</LabelRow>
        <LabelRow label="Import">Loads a JSON patch file into the rack, restoring the full state</LabelRow>
        <div className="text-fg-32 kol-helper-12" style={{ marginTop: 4 }}>Available in the Patch module and the sidebar Presets section.</div>
      </SettingsSection>

      <SettingsSection title="Keyboard Shortcuts">
        <SettingsShortcuts sections={SHORTCUT_SECTIONS} />
      </SettingsSection>
    </div>
  )
}

function AboutContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SettingsSection title="Monitor">
        <div className="text-fg-48 kol-mono-14" style={{ maxWidth: 640 }}>Monitor treats math the way eurorack treats voltage — as a universal, scalable medium. Generators compute geometry through trigonometry and parametric equations. A 3D wireframe is 6 trig calls and a rotation matrix. A Lissajous curve is two sine functions. The system draws geometry, not pixels, which is why 50 modules run at 60fps in a browser.</div>
      </SettingsSection>

      <SettingsSection title="Video Modulo">
        <div className="text-fg-48 kol-mono-14" style={{ maxWidth: 640 }}>The modular rack engine at the core of Monitor. 50 modules across 5 categories — control, math, generators, display, utility — connected through virtual patch cables and evaluated in topological order.</div>
      </SettingsSection>

      <SettingsColophon />
    </div>
  )
}

function RepoContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SettingsSection title="Links">
        <SettingsLinks links={[
          { label: 'GitHub', url: 'https://github.com/Tor-Grimsson/kol-monitor' },
          { label: 'Kolkrabbi', url: 'https://monitor.kolkrabbi.io' },
          { label: 'Vercel', url: 'https://kol-monitor-six.vercel.app/' },
        ]} />
      </SettingsSection>
    </div>
  )
}

export default function SettingsPage() {
  return (
    /* `header` spreads onto the scaffold's PageHeader (kol-shell 0.7.1). */
    <SettingsScaffold
      tabs={TABS}
      defaultTab="settings"
      header={{ size: 'sm', voice: 'mono' }}
      renderContent={(tab) => (
        <>
          {tab === 'settings' && <SettingsContent />}
          {tab === 'about' && <AboutContent />}
          {tab === 'repo' && <RepoContent />}
        </>
      )}
    />
  )
}
