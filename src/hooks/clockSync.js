// Real SYNC helper for modules with continuous animation loops.
//
// Usage in a module:
//   const syncRef = useRef(newClockSyncState())
//   // in process(inputs, dt, t):
//   advanceClockSync(syncRef.current, inputs.clk, t, dt, fallbackRate)
//   const phase = syncRef.current.phase   // [0, 1) continuously
//
// Behavior:
// - Before any clock tick: phase advances at `fallbackRate` (cycles per second),
//   driven by the module's own speed knob.
// - After two clock rising edges: period is measured from inter-tick interval;
//   phase advances at 1/period. Current cycle runs out naturally — NOT reset on
//   tick. That's the whole point vs the old reset-as-sync behavior.
// - On each subsequent tick, period re-measured. Tempo tracks.
//
// To add hard RESET alongside SYNC: the module reads its own `rst` jack and
// sets `state.phase = 0` on rising edge. Independent of this helper.

import { readScalar } from './signals'

export function newClockSyncState(initialPeriod = 1) {
  return {
    phase: 0,
    period: initialPeriod,
    lastTick: null,
    prevClk: false,
    locked: false,
  }
}

// Internal: measure period from clock rising edges. Updates state.period / state.locked.
// When clkInput is null (cable absent or source disabled), drop the lock so the
// caller's fallback rate takes over — otherwise a previously measured period
// would linger forever and the knob would appear dead.
function measureClockPeriod(state, clkInput, t) {
  if (!clkInput) {
    state.locked = false
    state.lastTick = null
    state.prevClk = false
    return
  }
  const clkHigh = readScalar(clkInput) > 0
  if (clkHigh && !state.prevClk) {
    if (state.lastTick !== null) {
      const p = t - state.lastTick
      if (p > 0) { state.period = p; state.locked = true }
    }
    state.lastTick = t
  }
  state.prevClk = clkHigh
}

// Phase-accumulator variant — use when the module has a phase ∈ [0, 1) that wraps.
// Reads state.phase after calling.
export function advanceClockSync(state, clkInput, t, dt, fallbackRate = 1) {
  measureClockPeriod(state, clkInput, t)
  const rate = state.locked && state.period > 0 ? 1 / state.period : fallbackRate
  state.phase += dt * rate
  if (state.phase >= 1) state.phase -= Math.floor(state.phase)
  else if (state.phase < 0) state.phase -= Math.floor(state.phase)
}

// Rate-query variant — use when the module has a free-form time accumulator
// (e.g. animTime, rotation angles). Returns effective cycles-per-second; caller
// multiplies by dt and adds to its own accumulator. No phase wrapping.
// Locked: 1/period (one unit per clock period). Free: fallbackRate.
export function measureClockRate(state, clkInput, t, fallbackRate = 1) {
  measureClockPeriod(state, clkInput, t)
  return state.locked && state.period > 0 ? 1 / state.period : fallbackRate
}
