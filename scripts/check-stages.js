// check-stages — asserts every port named in src/data/stages.js actually exists
// on the module that owns it.
//
// The render loop drops a connection naming an unknown port SILENTLY (there is
// a dev-only console warning, and that is only visible in a browser). That is
// how 17 presets died unnoticed across the session-43/47/48 renames. A stage is
// a hand-written port graph, so it gets the same exposure — this is the check.
//
//   pnpm exec node scripts/check-stages.js

import process from 'node:process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { stages, STAGE_CV_ID, cvConnections } = await import(resolve(root, 'src/data/stages.js'))

// type → source path, read straight out of the registry's import lines.
const registry = readFileSync(resolve(root, 'src/modules/registry.js'), 'utf8')
const imports = new Map()
for (const m of registry.matchAll(/^import (\w+) from '\.\/(.+?)'/gm)) imports.set(m[1], m[2])
const typeToFile = new Map()
for (const m of registry.matchAll(/^\s{2}(\w+):\s*\{\s*component:\s*(\w+)/gm)) {
  const file = imports.get(m[2])
  if (file) typeToFile.set(m[1], resolve(root, 'src/modules', file))
}

// The `useModule({ inputs: {...}, outputs: {...} })` declaration is the truth —
// registry `controls[]` is prose for the docs page ('d1–d8', 'dryCV/spdCV/...').
function portsOf(file) {
  const src = readFileSync(file, 'utf8')
  const read = (label) => {
    const at = src.indexOf(`${label}: {`)
    if (at === -1) return null
    let depth = 0
    let i = src.indexOf('{', at)
    const start = i
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++
      else if (src[i] === '}' && --depth === 0) break
    }
    const body = src.slice(start + 1, i)
    return new Set([...body.matchAll(/(\w+)\s*:\s*\{/g)].map(m => m[1]))
  }
  const inputs = read('inputs') || new Set()
  let outputs = read('outputs')
  if (!outputs) {
    // computed outputs — Clock builds d1…dN from a DIVS array
    const divs = src.match(/const DIVS = \[([^\]]+)\]/)
    outputs = divs
      ? new Set(divs[1].split(',').map(n => `d${n.trim()}`))
      : new Set()
  }
  return { inputs, outputs }
}

let failures = 0
const fail = (msg) => { console.error(`  ✗ ${msg}`); failures++ }

for (const [key, stage] of Object.entries(stages)) {
  console.log(`\n${key}`)
  const types = new Map()
  for (const row of stage.rows) for (const m of row.modules) types.set(m.id, m.type)

  const cache = new Map()
  const ports = (id) => {
    if (!cache.has(id)) {
      const file = typeToFile.get(types.get(id))
      cache.set(id, file ? portsOf(file) : null)
    }
    return cache.get(id)
  }

  if (!stage.tap || !types.has(stage.tap.module)) fail(`tap names an unknown module: ${stage.tap?.module}`)
  else if (!ports(stage.tap.module).outputs.has(stage.tap.port)) fail(`tap ${stage.tap.module}.${stage.tap.port} — no such output`)

  for (const c of [...stage.connections, ...cvConnections(stage.cv || [])]) {
    if (c.fromModuleId === STAGE_CV_ID) {
      const n = (stage.cv || []).length
      const i = Number(c.fromPort.slice(1))
      if (!(i >= 0 && i < n)) fail(`cv fader ${c.fromPort} is out of range (${n} faders)`)
    } else if (!types.has(c.fromModuleId)) {
      fail(`connection from unknown module ${c.fromModuleId}`)
    } else if (!ports(c.fromModuleId).outputs.has(c.fromPort)) {
      fail(`${c.fromModuleId}.${c.fromPort} — no such output (${types.get(c.fromModuleId)})`)
    }

    if (!types.has(c.toModuleId)) fail(`connection to unknown module ${c.toModuleId}`)
    else if (!ports(c.toModuleId).inputs.has(c.toPort)) fail(`${c.toModuleId}.${c.toPort} — no such input (${types.get(c.toModuleId)})`)
  }

  for (const [id, type] of types) {
    if (!typeToFile.has(type)) fail(`${id}: '${type}' is not in the registry`)
  }
  const count = stage.rows.map(r => r.modules.length).reduce((a, b) => a + b, 0)
  console.log(`  ${count} modules · ${stage.connections.length} cables · ${(stage.cv || []).length} faders`)
}

console.log(failures === 0 ? '\n✓ every stage port resolves' : `\n✗ ${failures} bad port(s)`)
process.exit(failures === 0 ? 0 : 1)
