import { LabeledControlSection, SettingsRow } from '@kolkrabbi/kol-component'

/**
 * SettingsPage — `/settings`, as the PIECES the Studio's `HubSettings` renders
 * (kol-shell `AppStudio`, 2026-10-15 — mirror's shape). The scaffold, SETTINGS ·
 * ABOUT · REPO, the masthead's theme toggle, the colophon, the link list and the
 * keyboard-shortcut rows are the Hub's (the shortcuts come from the one array
 * the S sheet reads, `src/data/shortcuts.js`, through `shortcuts=`). What is
 * monitor's stays here as components: the settings body (`SettingsContent`) and
 * the About prose (`AboutContent`). The repo links live beside
 * the `APP` in `App.jsx` (react-refresh: components only here).
 *
 * SettingsRow UPPERCASES a string label and does not style a string child, so the
 * two prose rows below carry their own ink/type.
 */

export function SettingsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <LabeledControlSection label="Display">
        <div className="text-fg-48 kol-helper-12">Zoom defaults — coming soon</div>
      </LabeledControlSection>

      <LabeledControlSection label="Performance">
        <div className="text-fg-48 kol-helper-12">Frame rate cap, render quality — coming soon</div>
      </LabeledControlSection>

      <LabeledControlSection label="Patches">
        <div className="text-fg-48 kol-mono-14" style={{ maxWidth: 640, marginBottom: 8 }}>Sign in to sync your patches across devices; signed out, everything stays in this browser.</div>
        {/* the span is what LabelRow used to add around a string child */}
        <SettingsRow label="Export" align="fill"><span className="text-fg-32 kol-helper-12">Downloads the current rack as a JSON file — modules, connections, and settings</span></SettingsRow>
        <SettingsRow label="Import" align="fill"><span className="text-fg-32 kol-helper-12">Loads a JSON patch file into the rack, restoring the full state</span></SettingsRow>
        <div className="text-fg-32 kol-helper-12" style={{ marginTop: 4 }}>Available in the Patch module and the sidebar Presets section.</div>
      </LabeledControlSection>
    </div>
  )
}

/* About — the Hub puts this under a section labelled with the app's name ("Monitor")
   and adds the colophon below; the Video Modulo section rides inside it */
export function AboutContent() {
  return (
    <>
      Monitor treats math the way eurorack treats voltage — as a universal, scalable medium. Generators compute geometry through trigonometry and parametric equations. A 3D wireframe is 6 trig calls and a rotation matrix. A Lissajous curve is two sine functions. The system draws geometry, not pixels, which is why 50 modules run at 60fps in a browser.
      <div style={{ marginTop: 32 }}>
        <LabeledControlSection label="Video Modulo">
          <div className="text-fg-48 kol-mono-14" style={{ maxWidth: 640 }}>The modular rack engine at the core of Monitor. 50 modules across 5 categories — control, math, generators, display, utility — connected through virtual patch cables and evaluated in topological order.</div>
        </LabeledControlSection>
      </div>
    </>
  )
}
