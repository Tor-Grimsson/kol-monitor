// TabStyles — the Dev tab's TABS: the KOL's tab components, each with the edit sheet's proposed
// tabs (plan 14 4.5), on the sheet's own ground, so the style is picked by eye (user 2026-10-17:
// "show me those tab styles on dev page"). Proposal-only labels; nothing here is wired.

import { useState } from 'react'
import TabsRow from '@kolkrabbi/kol-component/molecules/TabsRow'
import TabChips from '@kolkrabbi/kol-component/molecules/TabChips'
import SegmentedToggle from '@kolkrabbi/kol-component/atoms/SegmentedToggle'
import { TabStrip } from '@kolkrabbi/kol-shell'

const TABS = [
  { id: 'edit', label: 'Edit' },
  { id: 'rack', label: 'Rack' },
  { id: 'library', label: 'Library' },
]
const OPTIONS = TABS.map((t) => ({ value: t.id, label: t.label }))
const ICONS = { edit: 'edit', rack: 'nav-rack', library: 'nav-library' }

function Row({ name, where, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-3">
        <span className="kol-mono-12">{name}</span>
        <span className="kol-helper-10 text-fg-48">{where}</span>
      </div>
      {/* the edit sheet's header ground */}
      <div className="flex h-14 items-center bg-surface-secondary px-6">{children}</div>
    </div>
  )
}

export default function TabStyles() {
  const [v, setV] = useState('edit')
  return (
    <div className="flex max-w-[720px] flex-col gap-6">
      <Row name="TabsRow" where="kol-component · the edit sheet today">
        <TabsRow tabs={TABS} value={v} onChange={setV} />
      </Row>
      <Row name="TabChips" where="kol-component · Button variant=tab">
        <TabChips tabs={TABS} value={v} onChange={setV} />
      </Row>
      <Row name="TabStrip" where="kol-shell · this Dev page's header">
        <TabStrip options={OPTIONS} value={v} onChange={setV} />
      </Row>
      <Row name="SegmentedToggle" where="kol-component · variant default">
        <SegmentedToggle options={OPTIONS} value={v} onChange={setV} size="sm" ariaLabel="Sheet" />
      </Row>
      <Row name="SegmentedToggle" where="kol-component · variant tonal">
        <SegmentedToggle options={OPTIONS} value={v} onChange={setV} size="sm" variant="tonal" ariaLabel="Sheet" />
      </Row>
      {/* `look="stacked"` renders inline (kol-component 0.266.0, TabsStackedLayout); the phone bar is
          `placement="phone"`. Shown in a phone-width frame for scale */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="kol-mono-12">MobileTabBar</span>
          <span className="kol-helper-10 text-fg-48">kol-component · icon over label · shown in a phone-width frame</span>
        </div>
        <div className="flex h-[200px] w-[390px] max-w-full flex-col justify-end border border-fg-08 bg-surface-secondary">
          <TabsRow look="stacked" tabs={TABS.map((t) => ({ ...t, icon: ICONS[t.id] }))} value={v} onChange={setV} />
        </div>
      </div>
    </div>
  )
}
