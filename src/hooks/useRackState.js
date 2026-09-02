// Rack state — manages rows, modules with HP offsets, parked modules, edit mode

import { useState, useCallback, useMemo } from 'react'
import { MODULE_DEFS } from '../modules/registry'
import { TOTAL_HP } from '../modules/utility/eurorack'
import { patches } from '../data/patches'

let nextId = 1
function uid(type) { return `${type}_${nextId++}` }

const ON = new Set(patches.ref?.on || [])
const CONSOLE_INIT = new Map((patches.ref?.console || []).map(c => [c.id, c]))

// Pack modules left-to-right, calculating offsets
function packModules(modules) {
  let offset = 0
  return modules.map(m => {
    const consoleData = CONSOLE_INIT.get(m.id)
    const state = { ...m.state, ...consoleData, enabled: ON.has(m.id) }
    const mod = { ...m, offset, state }
    offset += m.hp
    return mod
  })
}

const DEFAULT_ROWS = [
  {
    id: 'row1', height: '1u', modules: packModules([
      { type: 'power', id: 'power1', hp: 4 },
      { type: 'perf', id: 'perf1', hp: 4 },
      { type: 'patch', id: 'patch1', hp: 6 },
      { type: 'mult', id: 'mult1', hp: 8 },
      { type: 'noise', id: 'noise1', hp: 22 },
      { type: 'attenuator', id: 'atten1', hp: 26 },
      { type: 'vca', id: 'vca1', hp: 8 },
      { type: 'logic', id: 'logic1', hp: 8 },
      { type: 'comparator', id: 'comp1', hp: 6 },
      { type: 'joystick', id: 'joy1', hp: 12 },
    ]),
  },
  {
    id: 'row2', height: '3u', modules: packModules([
      { type: 'clock', id: 'clk1', hp: 4 },
      { type: 'clockDiv', id: 'div1', hp: 4 },
      { type: 'lfo', id: 'lfo1', hp: 6 },
      { type: 'envelope', id: 'env1', hp: 6 },
      { type: 'sequencer', id: 'seq1', hp: 16 },
      { type: 'pen', id: 'pen1', hp: 6 },
      { type: 'mixer', id: 'mix1', hp: 6 },
      { type: 'waveform', id: 'wave1', hp: 6 },
      { type: 'rgb', id: 'rgb1', hp: 8 },
      { type: 'wireframe', id: 'wire1', hp: 8 },
      { type: 'smx3', id: 'smx1', hp: 8 },
      { type: 'lineGen', id: 'line1', hp: 6 },
      { type: 'waveshaper', id: 'wshp1', hp: 6 },
      { type: 'delay', id: 'delay1', hp: 6 },
    ]),
  },
  {
    id: 'row3', height: '3u', modules: packModules([
      { type: 'transform', id: 'xform1', hp: 6 },
      { type: 'maths', id: 'maths1', hp: 20 },
      { type: 'filter', id: 'filt1', hp: 6 },
      { type: 'radialGen', id: 'radial1', hp: 12 },
      { type: 'modGen', id: 'modgen1', hp: 14 },
      { type: 'monitor', id: 'mon1', hp: 12 },
      { type: 'magneto', id: 'mag1', hp: 28 },
    ]),
  },
  {
    id: 'row4', height: '3u', modules: packModules([
      { type: 'generator', id: 'gen1', hp: 10 },
      { type: 'generator2', id: 'gen2', hp: 10 },
      { type: 'dither', id: 'dith1', hp: 14 },
      { type: 'console', id: 'con1', hp: 48 },
      { type: 'life', id: 'life1', hp: 12 },
    ]),
  },
  {
    id: 'row5', height: '1u', modules: packModules([
      { type: 'patch', id: 'patch1', hp: 6 },
      { type: 'switch', id: 'sw1', hp: 10 },
      { type: 'ringMod', id: 'ring1', hp: 6 },
      { type: 'reverb', id: 'verb1', hp: 10 },
      { type: 'ramp', id: 'ramp1', hp: 6 },
      { type: 'scope', id: 'scope1', hp: 16 },
      { type: 'constant', id: 'const1', hp: 4 },
      { type: 'quantizer', id: 'quant1', hp: 4 },
      { type: 'scaleOfs', id: 'scl1', hp: 4 },
      { type: 'svg', id: 'svg1', hp: 10 },
      { type: 's2v', id: 's2v1', hp: 8 },
      { type: 'v2s', id: 'v2s1', hp: 4 },
    ]),
  },
]

let rowCounter = 5

// Find first gap in a row that fits the given HP width
export function findFreeOffset(modules, hp) {
  const sorted = [...modules].sort((a, b) => a.offset - b.offset)
  let pos = 0
  for (const m of sorted) {
    if (pos + hp <= m.offset) return pos
    pos = m.offset + m.hp
  }
  return pos + hp <= TOTAL_HP ? pos : null
}

// `initialRows`: the stage's own provider starts EMPTY. Booting on DEFAULT_ROWS
// flashed the whole default rack through the dock for a frame — its duplicate
// `patch1` key left an orphaned Patch slot behind and the cable overlay measured
// the jacks against that rack (2026-09-02).
export function useRackState(initialRows = DEFAULT_ROWS) {
  const [rows, setRows] = useState(initialRows)
  const [workbench, setWorkbench] = useState([])
  const [editMode, setEditMode] = useState(false)

  const addModule = useCallback((type, rowId) => {
    const def = MODULE_DEFS[type]
    if (!def) return
    const targetHeight = (def.u || 3) === 1 ? '1u' : '3u'
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row
      if (row.height !== targetHeight) return row
      const offset = findFreeOffset(row.modules, def.hp)
      if (offset === null) return row
      const mod = { type, id: uid(type), hp: def.hp, offset }
      return { ...row, modules: [...row.modules, mod] }
    }))
  }, [])

  // Send a module from rack to workbench
  const sendToWorkbench = useCallback((moduleId) => {
    let found = null
    setRows(prev => prev.map(row => {
      const mod = row.modules.find(m => m.id === moduleId)
      if (mod) found = mod
      return { ...row, modules: row.modules.filter(m => m.id !== moduleId) }
    }))
    if (found) setWorkbench(prev => [...prev, found])
  }, [])

  // Return a module from workbench to first available rack slot
  const returnFromWorkbench = useCallback((moduleId) => {
    setWorkbench(prev => {
      const mod = prev.find(m => m.id === moduleId)
      if (!mod) return prev
      const def = MODULE_DEFS[mod.type]
      const targetHeight = (def?.u || 3) === 1 ? '1u' : '3u'
      setRows(r => {
        const updated = [...r]
        for (const row of updated) {
          if (row.height !== targetHeight) continue
          const offset = findFreeOffset(row.modules, mod.hp)
          if (offset !== null) {
            row.modules = [...row.modules, { ...mod, offset }]
            return [...updated]
          }
        }
        return updated
      })
      return prev.filter(m => m.id !== moduleId)
    })
  }, [])

  const addRow = useCallback((height = '3u') => {
    const id = `row${rowCounter++}`
    setRows(prev => [...prev, { id, height, modules: [] }])
  }, [])

  const removeRow = useCallback((rowId) => {
    setRows(prev => {
      const row = prev.find(r => r.id === rowId)
      if (row && row.modules.length > 0) {
        setWorkbench(p => [...p, ...row.modules])
      }
      return prev.filter(r => r.id !== rowId)
    })
  }, [])

  const setRowHeight = useCallback((rowId, height) => {
    setRows(prev => prev.map(row =>
      row.id === rowId ? { ...row, height } : row
    ))
  }, [])

  // Swap a module with its neighbor in the same row. Preserves surrounding gaps,
  // collapses the gap between the two swapped modules.
  const swapInRow = useCallback((rowId, modId, direction) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row
      const sorted = [...row.modules].sort((a, b) => a.offset - b.offset)
      const i = sorted.findIndex(m => m.id === modId)
      if (i < 0) return row
      const j = direction === 'left' ? i - 1 : i + 1
      if (j < 0 || j >= sorted.length) return row
      const a = sorted[i]
      const b = sorted[j]
      const leftmost = Math.min(a.offset, b.offset)
      const first = direction === 'left' ? a : b
      const second = direction === 'left' ? b : a
      const firstNew = { ...first, offset: leftmost }
      const secondNew = { ...second, offset: leftmost + first.hp }
      return { ...row, modules: row.modules.map(m => {
        if (m.id === first.id) return firstNew
        if (m.id === second.id) return secondNew
        return m
      }) }
    }))
  }, [])

  // Move a module to another row. Target row must match height and have space.
  const moveToRow = useCallback((modId, targetRowId) => {
    setRows(prev => {
      let mod = null
      const withoutMod = prev.map(row => {
        const found = row.modules.find(m => m.id === modId)
        if (found) mod = found
        return found ? { ...row, modules: row.modules.filter(m => m.id !== modId) } : row
      })
      if (!mod) return prev
      const targetIdx = withoutMod.findIndex(r => r.id === targetRowId)
      if (targetIdx < 0) return prev
      const target = withoutMod[targetIdx]
      const def = MODULE_DEFS[mod.type]
      const targetHeight = (def?.u || 3) === 1 ? '1u' : '3u'
      if (target.height !== targetHeight) return prev
      const offset = findFreeOffset(target.modules, mod.hp)
      if (offset === null) return prev
      withoutMod[targetIdx] = { ...target, modules: [...target.modules, { ...mod, offset }] }
      return withoutMod
    })
  }, [])

  const moveModule = useCallback((rowIdx, modId, newOffset) => {
    const snapped = Math.round(newOffset / 2) * 2
    setRows(prev => prev.map((row, ri) => {
      if (ri !== rowIdx) return row
      const mod = row.modules.find(m => m.id === modId)
      if (!mod) return row
      const others = row.modules.filter(m => m.id !== modId)
      const clamped = Math.max(0, Math.min(TOTAL_HP - mod.hp, snapped))
      const end = clamped + mod.hp
      const overlaps = others.some(m => clamped < m.offset + m.hp && end > m.offset)
      if (overlaps) return row
      return { ...row, modules: row.modules.map(m => m.id === modId ? { ...m, offset: clamped } : m) }
    }))
  }, [])

  // Load a preset: builds rows from preset definition. If saved entries carry
  // explicit `offset`, honour them (preserves gaps). Otherwise pack left-to-right.
  const loadPreset = useCallback((preset) => {
    if (!preset || !preset.rows) return
    const newRows = preset.rows.map((r, i) => {
      let nextOffset = 0
      const modules = r.modules.map(m => {
        const def = MODULE_DEFS[m.type]
        const hp = def?.hp || 4
        const offset = typeof m.offset === 'number' ? m.offset : nextOffset
        nextOffset = offset + hp
        return { type: m.type, id: m.id, hp, u: def?.u || 3, offset, state: m.state }
      })
      return { id: `row-${i}`, height: r.height, modules }
    })
    setRows(newRows)
    setWorkbench([])
  }, [])

  const resetRack = useCallback(() => {
    setRows([
      { id: `row${rowCounter++}`, height: '1u', modules: [] },
      { id: `row${rowCounter++}`, height: '3u', modules: [] },
    ])
    setWorkbench([])
  }, [])

  return useMemo(() => ({
    rows,
    workbench,
    editMode,
    setEditMode,
    loadPreset,
    resetRack,
    addModule,
    moveModule,
    swapInRow,
    moveToRow,
    sendToWorkbench,
    returnFromWorkbench,
    addRow,
    removeRow,
    setRowHeight,
  }), [rows, workbench, editMode, setEditMode, loadPreset, resetRack, addModule, moveModule, swapInRow, moveToRow, sendToWorkbench, returnFromWorkbench, addRow, removeRow, setRowHeight])
}
