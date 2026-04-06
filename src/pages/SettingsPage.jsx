import PageHeader from '../components/PageHeader'
import Divider from '../components/atoms/Divider'

export default function SettingsPage() {
  return (
    <div style={{ padding: '48px 48px', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="bg-surface-primary">
      <PageHeader
        title="Settings"
        subtitle="Configuration and preferences"
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="kol-helper-s">Preferences</h2>
      </div>

      <Divider className="mb-6" />

      <div style={{ flex: 1 }}>
        <section style={{ marginBottom: 32 }}>
          <h3 className="text-fg-80 kol-helper-xs" style={{ marginBottom: 12 }}>Display</h3>
          <p className="text-fg-48 kol-helper-xxs" style={{ lineHeight: 1.6 }}>Theme, zoom defaults — coming soon</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 className="text-fg-80 kol-helper-xs" style={{ marginBottom: 12 }}>Performance</h3>
          <p className="text-fg-48 kol-helper-xxs" style={{ lineHeight: 1.6 }}>Frame rate cap, render quality — coming soon</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 className="text-fg-80 kol-helper-xs" style={{ marginBottom: 12 }}>Keyboard Shortcuts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '8px 48px', maxWidth: 320 }}>
            <span className="text-fg-48 kol-helper-xxs">Shortcuts</span><span className="text-fg-48 kol-helper-xxs">S</span>
            <span className="text-fg-48 kol-helper-xxs">Sidebar</span><span className="text-fg-48 kol-helper-xxs">H</span>
            <span className="text-fg-48 kol-helper-xxs">Edit mode</span><span className="text-fg-48 kol-helper-xxs">E</span>
            <span className="text-fg-48 kol-helper-xxs">Mute all</span><span className="text-fg-48 kol-helper-xxs">M</span>
            <span className="text-fg-48 kol-helper-xxs">Lock view</span><span className="text-fg-48 kol-helper-xxs">L</span>
            <span className="text-fg-48 kol-helper-xxs">Cable lock</span><span className="text-fg-48 kol-helper-xxs">C</span>
            <span className="text-fg-48 kol-helper-xxs">Cable visibility</span><span className="text-fg-48 kol-helper-xxs">O</span>
            <span className="text-fg-48 kol-helper-xxs">Zoom in / out</span><span className="text-fg-48 kol-helper-xxs">+ / −</span>
            <span className="text-fg-48 kol-helper-xxs">Reset zoom</span><span className="text-fg-48 kol-helper-xxs">0</span>
            <span className="text-fg-48 kol-helper-xxs">Clear display</span><span className="text-fg-48 kol-helper-xxs">D</span>
            <span className="text-fg-48 kol-helper-xxs">Snap positions</span><span className="text-fg-48 kol-helper-xxs">1–9</span>
            <span className="text-fg-48 kol-helper-xxs">Pan (drag)</span><span className="text-fg-48 kol-helper-xxs">Space</span>
            <span className="text-fg-48 kol-helper-xxs">Zoom</span><span className="text-fg-48 kol-helper-xxs">Alt+Scroll</span>
            <span className="text-fg-48 kol-helper-xxs">Pan</span><span className="text-fg-48 kol-helper-xxs">Scroll</span>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 className="text-fg-80 kol-helper-xs" style={{ marginBottom: 12 }}>About</h3>
          <p className="text-fg-48 kol-helper-xxs" style={{ lineHeight: 1.6 }}>Video Modulo — Video synthesis workstation</p>
          <p className="text-fg-32 kol-helper-xxs" style={{ marginTop: 4 }}>Part of the Kolkrabbi Apparat suite</p>
          <div className="text-fg-64 kol-helper-xxs" style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a href="https://kolkrabbi.io" target="_blank" rel="noopener noreferrer" className="text-fg-64 hover:text-fg-96 hover:underline">Kolkrabbi Vinnustofa</a>
            <span className="text-fg-48">2026</span>
          </div>
        </section>
      </div>
    </div>
  )
}
