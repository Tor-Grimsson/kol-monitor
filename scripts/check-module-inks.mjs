#!/usr/bin/env node
// check-module-inks — count raw colour literals in the module tier
// (`rgba()` / `#hex` in src/modules), split into CHROME (inks, fills, borders,
// shadows on the themed panel — the audit's target) and CANVAS (fillStyle /
// strokeStyle / gradients on a screen — content, exempt). The module panel is
// `bg-surface-secondary` (themed); a white-alpha ink on it vanishes on light.
// Ledger: .kol/llm-plan/12-module-inks-audit.md. Run: `pnpm check:inks`.
// `--list` prints every chrome hit as file:line.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'src/modules'
const LIT = /(rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)|#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?![0-9a-zA-Z_]))/g
const CANVAS = /(fillStyle|strokeStyle|shadowColor|createLinearGradient|createRadialGradient|addColorStop|ctx\.)/
// Black-alpha in a shadow is a shadow, not an ink — physically dark on both
// themes. Blessed by the 2026-08-30 sweep (check 5) and the audit's §6.
const SHADOW = /(boxShadow|textShadow|drop-shadow|floodColor|feDropShadow)/
const BLACK = /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,/
// `// inks: canvas` on a line is a stated, greppable exemption for a constant that
// only ever reaches a canvas (a trace colour, a grid on the screen well).
const MARK = /inks: canvas/
const list = process.argv.includes('--list')

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|mjs)$/.test(f) ? [p] : [] })

let chrome = 0, canvas = 0, shadow = 0
const perFile = new Map()
for (const p of walk(ROOT)) {
  readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
    let hits = line.match(LIT)
    if (!hits) return
    if (CANVAS.test(line) || MARK.test(line)) { canvas += hits.length; return }
    if (SHADOW.test(line)) { const s = hits.filter((h) => BLACK.test(h)).length; shadow += s; hits = hits.filter((h) => !BLACK.test(h)); if (!hits.length) return }
    chrome += hits.length
    perFile.set(p, (perFile.get(p) || 0) + hits.length)
    if (list) console.log(`${p}:${i + 1}  ${hits.join(' ')}`)
  })
}
const top = [...perFile].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([f, n]) => `${n} ${f.replace(ROOT + '/', '')}`).join(' · ')
console.log(`check-module-inks: chrome ${chrome} in ${perFile.size} files · shadow ${shadow} (blessed) · canvas ${canvas} (exempt)`)
if (chrome) console.log(`  top: ${top}`)
