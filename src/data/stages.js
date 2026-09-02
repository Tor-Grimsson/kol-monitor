// Stage presets — a small patch, one tapped output port, and the handful of CV
// destinations the stage puts under a fader.
//
// `rows` / `connections` are the SAME shape `patches.js` uses, so StagePage
// loads a stage through `rack.loadPreset` + `routing.loadPatch` and there is no
// second patch format to keep in sync.
//
// `tap` names the port the full-screen canvas draws — the stage is a display
// module in everything but chrome, so it reads a signal and hands it to
// `drawSignal` like any other (ARCHITECTURE §1: Canvas2D is the common language).
//
// `cv[i]` is the stage's STARTING mark set — the page can add or drop marks at
// runtime, reading each module's CV inputs off its own registry descriptor.
// Mark i binds to `STAGE_CV_ID.p<i>`. The strip registers a headless
// module carrying those outputs, so a fader is an ordinary signal source and the
// render loop needs no injection path — the connections are generated from this
// list, not written by hand.
//
// Faders ride the module's own CV convention (`readCv`): an `offset` port ADDS
// to its knob, an `attenuate` port SCALES it. Knob defaults below are set low
// where the fader needs headroom.
//
// NOTHING here carries `enabled: true` — a stage loads STOPPED (user,
// 2026-08-28) and the page's [Play] arms it through the case's `toggleAll`,
// the same switch the rack's `m` throws.

export const STAGE_CV_ID = 'stagecv'

// The monitor is a patch DESTINATION, not a fixed tap (user, 2026-09-02). Each
// stage's `tap` is only the cable the stage LOADS with — the screen follows
// whatever is patched here after that.
export const STAGE_OUT_ID = 'monitor'

export const stages = {
  tape: {
    label: 'Tape',
    trails: 0,
    dockScale: 1,
    tap: { module: 'mag1', port: 'out' },
    rows: [
      { height: '3u', modules: [
        { type: 'generator2', id: 'gen1', state: { animate: true, speed: 34, colorS: 80 } },
        { type: 'dither', id: 'dith1', state: {} },
        { type: 'magneto', id: 'mag1', state: {} },
      ] },
    ],
    connections: [
      { fromModuleId: 'gen1', fromPort: 'out', toModuleId: 'dith1', toPort: 'in' },
      { fromModuleId: 'gen1', fromPort: 'color', toModuleId: 'dith1', toPort: 'clr' },
      { fromModuleId: 'dith1', fromPort: 'out', toModuleId: 'mag1', toPort: 'in' },
    ],
    cv: [
      { label: 'Cells', module: 'dith1', port: 'size', value: 0 },
      { label: 'Angle', module: 'dith1', port: 'ang', value: 0, min: -100 },
      { label: 'Scale', module: 'dith1', port: 'scl', value: 0 },
      { label: 'Repeat', module: 'mag1', port: 'rptCV', value: 45 },
      { label: 'Speed', module: 'mag1', port: 'spdCV', value: 0, min: -100 },
      { label: 'Wow', module: 'mag1', port: 'wowCV', value: 0 },
    ],
  },

  maths: {
    label: 'Maths',
    trails: 0,
    dockScale: 1,
    tap: { module: 'rad1', port: 'out' },
    rows: [
      { height: '3u', modules: [
        { type: 'clock', id: 'clk1', state: { bpm: 96, running: true } },
        { type: 'envelope', id: 'env1', state: { attack: 6, decay: 44, sustain: 30, release: 60 } },
        { type: 'maths', id: 'mth1', state: {} },
        { type: 'radialGen', id: 'rad1', state: { amplitude: 35, resolution: 55, strokeWidth: 30 } },
      ] },
    ],
    connections: [
      { fromModuleId: 'clk1', fromPort: 'd2', toModuleId: 'env1', toPort: 'trig' },
      { fromModuleId: 'env1', fromPort: 'out', toModuleId: 'mth1', toPort: 'sig1' },
      { fromModuleId: 'mth1', fromPort: 'out1', toModuleId: 'rad1', toPort: 'scl' },
      { fromModuleId: 'mth1', fromPort: 'inv', toModuleId: 'rad1', toPort: 'rot' },
    ],
    cv: [
      { label: 'Freq', module: 'rad1', port: 'frq', value: 0 },
      { label: 'Res', module: 'rad1', port: 'res', value: 0 },
      { label: 'Radius', module: 'rad1', port: 'rad', value: 0, min: -100 },
      { label: 'Amp', module: 'rad1', port: 'amp', value: 60 },
      { label: 'Stroke', module: 'rad1', port: 'str', value: 0 },
    ],
  },
}

export const STAGE_KEYS = Object.keys(stages)

// The marked list IS the patch's CV half — one connection per fader, in order.
// Takes the LIVE marks (the page lets you add and drop them), not the preset.
export function cvConnections(marks) {
  return (marks || []).map((c, i) => ({
    fromModuleId: STAGE_CV_ID,
    fromPort: `p${i}`,
    toModuleId: c.module,
    toPort: c.port,
  }))
}
