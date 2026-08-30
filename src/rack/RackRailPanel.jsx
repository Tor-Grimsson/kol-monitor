import { useState } from 'react'
import { CATEGORIES, getModulesByCategory, MODULE_DEFS } from '../modules/registry'
import { TOTAL_HP } from '../modules/utility/eurorack'

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
 * THIS IS THE ARGUMENT FOR THE TICKET. Every row here is an ACTION — a module
 * row inserts into the first row with space, a workbench row returns a held
 * module to the rack — and the DS rail's second level only navigates. See
 * `RackRail.jsx`.
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
      if (used + hp <= TOTAL_HP) return row.id
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
            <div
              onClick={() => toggleCat(cat)}
              className="kol-helper-12 text-fg-48 hover:text-fg-64 cursor-pointer select-none mb-1 px-3"
            >
              {isOpen ? '▾' : '▸'} {CATEGORY_LABELS[cat]}
            </div>
            {isOpen && (
              <div className="flex flex-col gap-0.5">
                {modules.map(mod => (
                  <button
                    key={mod.type}
                    onClick={() => {
                      const rowId = findRowWithSpace(mod.hp, mod.u)
                      if (rowId) rack.addModule(mod.type, rowId)
                    }}
                    className="text-left px-3 h-6 rounded kol-helper-12 text-fg-64 hover:text-fg-96 hover:bg-fg-04 transition-colors flex items-center justify-between"
                  >
                    <span>{mod.label}</span>
                    <span className="text-fg-32">{mod.u === 1 ? '1U' : '3U'} {mod.hp}hp</span>
                  </button>
                ))}
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
              <button
                key={mod.id}
                onClick={() => rack.returnFromWorkbench(mod.id)}
                className="text-left px-3 h-6 rounded kol-helper-12 text-fg-48 hover:text-fg-64 hover:bg-fg-04 transition-colors flex items-center justify-between"
              >
                <span>{MODULE_DEFS[mod.type]?.label || mod.type}</span>
                <span className="text-fg-32">{mod.hp}hp</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
