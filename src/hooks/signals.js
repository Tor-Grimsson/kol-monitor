// Signal type definitions — the data contract for patch cables
//
// Scalar convention: signed, clamped to [-100, 100].
//   Unipolar signals (mix, opacity, density, clock/gate, VCA gain) use [0, 100] by producer convention.
//   Bipolar signals (LFO, attenuverter outputs, Maths channels) use [-100, 100] centered at 0.
//   0 is zero (silence / neutral). 100 is max positive. -100 is max negative.
//   Gate/trigger detection: unipolar binary gates use `> 50`; bipolar sources use `> 0`.

export const SIGNAL_TYPES = Object.freeze({
  SCALAR: 'scalar',
  COLOR: 'color',
  POINTS: 'points',
  PEN: 'pen',
})

function clamp(n, min, max) {
  return n < min ? min : n > max ? max : n
}

export function scalar(n) {
  return { type: 'scalar', value: clamp(n, -100, 100) }
}

export function color(r, g, b, a = 1) {
  return { type: 'color', value: { r, g, b, a } }
}

export function points(arr, edges = null) {
  return { type: 'points', value: arr, edges }
}

export const PEN_DEFAULTS = { thickness: 1.5, dash: 0, gap: 0, opacity: 100, cap: 'round', lofi: 0, color: null, fill: false }

export function pen(props) {
  return { type: 'pen', value: { ...PEN_DEFAULTS, ...props } }
}

// Extract a number from any signal type
export function readScalar(signal) {
  if (!signal) return 0
  if (signal.type === 'scalar') return signal.value
  if (signal.type === 'color') {
    const { r, g, b } = signal.value
    return (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100
  }
  if (signal.type === 'points') return signal.value.length
  return 0
}

export function isSignal(v) {
  return v != null && typeof v === 'object' && 'type' in v && 'value' in v
}

// Merge a CV input with its paired knob value.
// Caller's knob polarity determines merge range — unipolar knobs (0-100) clamp to [0, 100];
// bipolar knobs (-100 to 100) clamp to [-100, 100].
// - offset (default): clamp(knob + cv, range) — CV adds directly to knob (signed)
// - attenuate:        (knob / 100) * cv — knob scales how much CV passes
// - replace:          cv — CV wins, knob ignored
export function readCv(cvSignal, knobValue, mode = 'offset', { bipolar = false } = {}) {
  if (!cvSignal) return knobValue
  const cv = readScalar(cvSignal)
  if (mode === 'attenuate') return (knobValue / 100) * cv
  if (mode === 'replace') return cv
  return bipolar ? clamp(knobValue + cv, -100, 100) : clamp(knobValue + cv, 0, 100)
}
