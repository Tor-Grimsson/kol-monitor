import { SettingsScaffold, SettingsShortcuts, SettingsLinks, SettingsColophon } from '@kolkrabbi/kol-shell'
import { LabeledControlSection, SettingsRow } from '@kolkrabbi/kol-component'
// Deep imports are legal since kol-framework 0.20.0 (./src/* exports map)
import ThemeToggle from '@kolkrabbi/kol-framework/src/ThemeToggle.jsx'
import { SHORTCUT_SECTIONS } from '../data/shortcuts.js'

/**
 * SettingsPage — on kol-shell's `SettingsScaffold` (2026-08-15); the shortcuts
 * block, the link list and the colophon are the DS's since kol-shell 0.8.0
 * (ShellHomeSystem — adopted 2026-08-27 on kol-fxr's wiring). The header's
 * mono voice is this repo's own masthead, ruled app-tier in PageHeaderMonoTitle.
 *
 * kol-shell 0.24.0 STOPPED EXPORTING `SettingsSection` + `LabelRow` — both were
 * second implementations of things kol-component already shipped, and the DS
 * does not keep two of one thing. Migrated 2026-08-30:
 *   SettingsSection title=  →  LabeledControlSection label=   (was renamed from
 *     SettingsSection in kol-r2b2 2026-08-27 — it named where it was first used)
 *   LabelRow label=         →  SettingsRow label= align="fill"
 * `align="fill"` is the mapping kol-shell itself took for its own shortcut rows;
 * SettingsRow's `align` is `end` | `fill` only, so the old `center` has no peer —
 * `fill` keeps the control left in its cell, which is what `center` looked like.
 * SettingsRow UPPERCASES a string label and does not style a string child, so the
 * two prose rows below carry the ink/type LabelRow used to add for them.
 */

const TABS = [
  { value: 'settings', label: 'Settings', title: 'Settings', subtitle: 'Configuration and preferences' },
  { value: 'about', label: 'About', title: 'About', subtitle: 'Monitor by Kolkrabbi' },
  { value: 'repo', label: 'Repo', title: 'Repo', subtitle: 'Source and deployments' },
]

function SettingsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <LabeledControlSection label="Display">
        <div className="text-fg-48 kol-helper-12">Zoom defaults — coming soon</div>
      </LabeledControlSection>

      <LabeledControlSection label="Performance">
        <div className="text-fg-48 kol-helper-12">Frame rate cap, render quality — coming soon</div>
      </LabeledControlSection>

      <LabeledControlSection label="Patches">
        <div className="text-fg-48 kol-mono-14" style={{ maxWidth: 640, marginBottom: 8 }}>Monitor has no database or user accounts. The rack loads a default init patch on each visit. To keep your work, export it as a JSON file — this saves everything: case layout, modules, knob positions, and cable connections. Import that file to restore exactly where you left off.</div>
        {/* the span is what LabelRow used to add around a string child */}
        <SettingsRow label="Export" align="fill"><span className="text-fg-32 kol-helper-12">Downloads the current rack as a JSON file — modules, connections, and settings</span></SettingsRow>
        <SettingsRow label="Import" align="fill"><span className="text-fg-32 kol-helper-12">Loads a JSON patch file into the rack, restoring the full state</span></SettingsRow>
        <div className="text-fg-32 kol-helper-12" style={{ marginTop: 4 }}>Available in the Patch module and the sidebar Presets section.</div>
      </LabeledControlSection>

      <LabeledControlSection label="Keyboard Shortcuts">
        <SettingsShortcuts sections={SHORTCUT_SECTIONS} />
      </LabeledControlSection>
    </div>
  )
}

function AboutContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <LabeledControlSection label="Monitor">
        <div className="text-fg-48 kol-mono-14" style={{ maxWidth: 640 }}>Monitor treats math the way eurorack treats voltage — as a universal, scalable medium. Generators compute geometry through trigonometry and parametric equations. A 3D wireframe is 6 trig calls and a rotation matrix. A Lissajous curve is two sine functions. The system draws geometry, not pixels, which is why 50 modules run at 60fps in a browser.</div>
      </LabeledControlSection>

      <LabeledControlSection label="Video Modulo">
        <div className="text-fg-48 kol-mono-14" style={{ maxWidth: 640 }}>The modular rack engine at the core of Monitor. 50 modules across 5 categories — control, math, generators, display, utility — connected through virtual patch cables and evaluated in topological order.</div>
      </LabeledControlSection>

      <SettingsColophon />
    </div>
  )
}

function RepoContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <LabeledControlSection label="Links">
        <SettingsLinks links={[
          { label: 'GitHub', url: 'https://github.com/Tor-Grimsson/kol-monitor' },
          { label: 'Kolkrabbi', url: 'https://monitor.kolkrabbi.io' },
          { label: 'Vercel', url: 'https://kol-monitor-six.vercel.app/' },
        ]} />
      </LabeledControlSection>
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
      /* THE MASTHEAD CLUSTER IS THE SCAFFOLD'S since kol-shell 0.27.0
         (SettingsMastheadCluster) — order, gap and tone are its rules, off
         kol-fxr's approved render. The toggle MOVED here out of the body's
         Display section; two of it on one page is the defect the ticket names.
         No `picker` (this app has nothing to pick) and no `onOpenSettings`
         (no settings drawer — the gear is where one goes if we build it). */
      themeToggle={<ThemeToggle fill="none" tone="sunken" label={false} size="sm" />}
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
