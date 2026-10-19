import { useState } from 'react'
import { CATEGORIES, getModulesByCategory, MODULE_DEFS } from '../modules/registry'
import Button from '../components/atoms/Button'

/**
 * RackRailPanel — the module catalog, back where the sidebar's MODULES section
 * used to be, but rendered into the RAIL's opened width instead of a second
 * panel beside it (user, 2026-08-28: "lets not put it in in that expanded
 * thing, but lets adjust the new rail to accept the same things").
 *
 * Recovered from `bdc1fbe:src/ModuloSidebar.jsx:114–167` — the last commit that
 * had it. `229b5f2` cut the section and left the `flex-1` spacer plus five dead
 * symbols behind in `ModuloSidebar.jsx`; nothing was ever filed to `_tmp/`.
 * Restored as it was, with the retired `kol-helper-xs` t-shirt class swapped for
 * `kol-helper-12`.
 *
 * Every row here is an ACTION — a module row inserts into the first row with
 * space, a workbench row returns a held module to the rack — and the DS rail's
 * second level only navigates. So the rail carries a consumer SLOT instead
 * (kol-shell 0.64.0, `NavRailConsumerSlot`, filed from here): `VideoModulo`
 * portals this panel in through `useRailSlot`. The `RackRail` fork that carried
 * the slot before is in `_tmp/2026-10-15-rail-slot-retired/`.
 */
const CATEGORY_LABELS = {
  control: 'Control',
  math: 'Math',
  generators: 'Generators',
  display: 'Display',
  utility: 'Utility',
}

export default function RackRailPanel({ rack }) {
  const [openCats, setOpenCats] = useState(() => new Set(CATEGORIES))

  const toggleCat = (cat) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const findRowWithSpace = (hp, u) => {
    const targetHeight = u === 1 ? '1u' : '3u'
    for (const row of rack.rows) {
      if (row.height !== targetHeight) continue
      const used = row.modules.reduce((sum, m) => sum + m.hp, 0)
      if (used + hp <= rack.caseHp) return row.id
    }
    return null
  }

  return (
    <div className="p-4">
      <div className="kol-helper-12 text-fg-48 mb-3 uppercase">Modules</div>
      {CATEGORIES.map(cat => {
        const modules = getModulesByCategory(cat)
        const isOpen = openCats.has(cat)
        return (
          <div key={cat} className="mb-2">
            <Button variant="nav" size="sm" className="mb-1" aria-expanded={isOpen} onClick={() => toggleCat(cat)}>
              {isOpen ? '▾' : '▸'} {CATEGORY_LABELS[cat]}
            </Button>
            {isOpen && (
              <div className="flex flex-col gap-0.5">
                {modules.map(mod => {
                  /* no row with room → the DS disabled state, not a row that takes the click and does nothing */
                  const rowId = findRowWithSpace(mod.hp, mod.u)
                  return (
                    <Button
                      key={mod.type}
                      variant="nav"
                      size="sm"
                      className="w-full justify-between"
                      disabled={!rowId}
                      onClick={() => rack.addModule(mod.type, rowId)}
                    >
                      <span>{mod.label}</span>
                      <span className="text-fg-32">{mod.u === 1 ? '1U' : '3U'} {mod.hp}hp</span>
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Workbench modules */}
      {rack.workbench.length > 0 && (
        <div className="mt-3">
          <div className="kol-helper-12 text-fg-48 mb-2 uppercase px-3">Workbench</div>
          <div className="flex flex-col gap-0.5">
            {rack.workbench.map(mod => (
              <Button
                key={mod.id}
                variant="nav"
                size="sm"
                className="w-full justify-between"
                onClick={() => rack.returnFromWorkbench(mod.id)}
              >
                <span>{MODULE_DEFS[mod.type]?.label || mod.type}</span>
                <span className="text-fg-32">{mod.hp}hp</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
