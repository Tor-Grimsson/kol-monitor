// check-drawsignal-alpha — the G1 (fable-audit-2) alpha-discipline self-check.
// Mock Canvas2D context records globalAlpha at every stroke/fill; asserts the
// four fixed behaviours. Run: node scripts/check-drawsignal-alpha.mjs
// ponytail: assert-based, no framework — fails loud, exits 0 quiet.

import assert from 'node:assert/strict'
import { drawSignal } from '../src/modules/display/drawSignal.js'
import { pen } from '../src/hooks/signals.js'

function mockCtx() {
  const paints = [] // { op, alpha } at each stroke/fill/fillRect/fillText
  const rec = (op) => () => paints.push({ op, alpha: ctx.globalAlpha })
  const noop = () => {}
  const ctx = {
    globalAlpha: 1, lineWidth: 1, lineCap: 'round', strokeStyle: '', fillStyle: '',
    font: '', textAlign: '', paints,
    setLineDash: noop, beginPath: noop, moveTo: noop, lineTo: noop, closePath: noop,
    arc: noop, save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    stroke: rec('stroke'), fill: rec('fill'), fillRect: rec('fillRect'), fillText: rec('fillText'),
  }
  return ctx
}

const HIST = new Float32Array(4)
const near = (a, b) => Math.abs(a - b) < 1e-9

// 1. drawColor honours the caller's baseline (Console fader) and restores it
{
  const ctx = mockCtx()
  ctx.globalAlpha = 0.6
  drawSignal(ctx, { type: 'color', value: { r: 1, g: 0, b: 0, a: 1 } }, 0, 0, 10, 10, HIST, 0, 4, null)
  const rect = ctx.paints.find(p => p.op === 'fillRect')
  assert.ok(near(rect.alpha, 0.6), `drawColor fill at ${rect.alpha}, want 0.6 (fader honoured)`)
  assert.ok(near(ctx.globalAlpha, 0.6), `drawColor left alpha at ${ctx.globalAlpha}, want 0.6 restored`)
}

// 2. A group without opacity does NOT inherit the previous group's
{
  const ctx = mockCtx()
  const g = (opacity) => ({ pts: [{ x: 0, y: 0 }, { x: 1, y: 1 }], edges: [[0, 1]], ...(opacity != null ? { opacity } : {}) })
  const sig = { type: 'points', value: [], edges: [], groups: [g(0.3), g(null)] }
  drawSignal(ctx, sig, 0, 0, 10, 10, HIST, 0, 4, null)
  const strokes = ctx.paints.filter(p => p.op === 'stroke')
  assert.equal(strokes.length, 2, `want 2 group strokes, got ${strokes.length}`)
  assert.ok(near(strokes[0].alpha, 0.3), `group 1 at ${strokes[0].alpha}, want 0.3`)
  assert.ok(near(strokes[1].alpha, 1), `group 2 at ${strokes[1].alpha}, want 1 (no leak from group 1)`)
}

// 3. Grid + pen opacity: no double-apply, no frame-over-frame compounding
{
  const ctx = mockCtx()
  const sig = { type: 'points', value: [{ x: 0, y: 0 }, { x: 1, y: 1 }], edges: [[0, 1]], grid: true }
  const p50 = pen({ opacity: 50 })
  for (let frame = 0; frame < 3; frame++) {
    drawSignal(ctx, sig, 0, 0, 10, 10, HIST, 0, 4, p50)
    const edgeStroke = ctx.paints[ctx.paints.length - 1]
    assert.ok(near(edgeStroke.alpha, 0.5), `frame ${frame}: edge stroke at ${edgeStroke.alpha}, want 0.5 (single pen apply)`)
    assert.ok(near(ctx.globalAlpha, 1), `frame ${frame}: alpha left at ${ctx.globalAlpha}, want 1 (no compounding)`)
    ctx.paints.length = 0
  }
}

// 4. Axes dim does not leak into the next instance
{
  const ctx = mockCtx()
  const sig = {
    type: 'points', value: [{ x: 0, y: 0 }, { x: 1, y: 1 }], edges: [[0, 1]], aspectLock: true,
    axes: [{ color: { r: 1, g: 0, b: 0 }, pts: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }],
    instances: [{ rotation: 0 }, { rotation: 1 }],
  }
  drawSignal(ctx, sig, 0, 0, 10, 10, HIST, 0, 4, null)
  const strokes = ctx.paints.filter(p => p.op === 'stroke')
  // per instance: 1 edge stroke + 1 axis stroke → [edge, axis, edge, axis]
  assert.equal(strokes.length, 4, `want 4 strokes, got ${strokes.length}`)
  assert.ok(near(strokes[0].alpha, 1), `inst 1 edges at ${strokes[0].alpha}, want 1`)
  assert.ok(near(strokes[1].alpha, 0.5), `inst 1 axes at ${strokes[1].alpha}, want 0.5`)
  assert.ok(near(strokes[2].alpha, 1), `inst 2 edges at ${strokes[2].alpha}, want 1 (no leak from axes)`)
  assert.ok(near(strokes[3].alpha, 0.5), `inst 2 axes at ${strokes[3].alpha}, want 0.5`)
}

console.log('check-drawsignal-alpha: 4/4 ok')
