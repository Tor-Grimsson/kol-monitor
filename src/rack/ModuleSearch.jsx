// ModuleSearch — ⌘K "add module", ONE component for the rack and Create (plan 14 W2, user 2026-10-17:
// "it should add modules in create and rack … use categories … so it would be a two step modal").
// kol-component's ShellSearchOverlay with its own drill-in: category rows carry `keepOpen`, so a pick
// swaps the list to that category, and the overlay's back arrow (`onBack`) returns. Typing searches every
// module, grouped by category.
import { useState } from 'react'
import { ShellSearchOverlay } from '@kolkrabbi/kol-component'
import { MODULE_DEFS, CATEGORIES } from '../modules/registry'
import { TOTAL_HP } from '../modules/utility/eurorack'

const title = (s) => s[0].toUpperCase() + s.slice(1)

const MODULE_ROWS = Object.entries(MODULE_DEFS).map(([type, def]) => ({
  id: type, label: def.label, hint: `${def.hp}HP ${def.u}U`, group: title(def.category), hp: def.hp, u: def.u, category: def.category,
}))

/* the drill-ins: the five categories, then the two sizes */
const COUNT = (pick) => MODULE_ROWS.filter(pick).length
const SCOPES = [
  ...CATEGORIES.map((c) => ({ id: `cat:${c}`, label: title(c), group: 'Categories', pick: (m) => m.category === c })),
  { id: 'u:1', label: '1U', group: 'Size', pick: (m) => m.u === 1 },
  { id: 'u:3', label: '3U', group: 'Size', pick: (m) => m.u !== 1 },
].map((s) => ({ ...s, hint: `${COUNT(s.pick)} modules`, keepOpen: true }))

/* the first row of the module's height with room for it */
function findCompatibleRow(rows, mod, capacity = TOTAL_HP) {
  const targetHeight = mod.u === 1 ? '1u' : '3u'
  return rows.find((r) => r.height === targetHeight && r.modules.reduce((s, m) => s + m.hp, 0) + mod.hp <= capacity)
}

export default function ModuleSearch({ open, onClose, rows, capacity, onAdd }) {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState(null)
  /* a module with no row to land in is a disabled row — muted, skipped by ↑↓, never added */
  const roomed = (list) => list.map((m) => (findCompatibleRow(rows, m, capacity) ? m : { ...m, disabled: true, disabledHint: 'no room' }))
  const q = query.trim().toLowerCase()
  const results = q ? roomed(MODULE_ROWS.filter((m) => m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.category.includes(q))) : []
  const suggestions = scope ? roomed(MODULE_ROWS.filter(scope.pick)) : SCOPES

  const close = () => { setQuery(''); setScope(null); onClose() }
  return (
    <ShellSearchOverlay
      open={open}
      onClose={close}
      query={query}
      onQueryChange={setQuery}
      results={results}
      suggestions={suggestions}
      placeholder="Search modules…"
      selectLabel="Add module"
      /* the KOL's back arrow (kol-component 0.265.0, CommandOverlayModes): it, or Backspace on an empty field */
      onBack={scope ? () => setScope(null) : undefined}
      backLabel="All modules"
      onSelect={(item) => {
        const s = SCOPES.find((x) => x.id === item.id)
        if (s) return setScope(s)
        const row = findCompatibleRow(rows, item, capacity)
        if (row) onAdd(item.id, row.id)
        setScope(null)
        setQuery('')
      }}
    />
  )
}
