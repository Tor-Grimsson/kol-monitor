// Module registry — type → component, default HP, category, label
// Used by sidebar catalog and rack renderer

import ClockModule from './modules/control/ClockModule.jsx'
import ClockDividerModule from './modules/control/ClockDividerModule.jsx'
import LFOModule from './modules/control/LFOModule.jsx'
import EnvelopeModule from './modules/control/EnvelopeModule.jsx'
import SequencerModule from './modules/control/SequencerModule.jsx'
import ConstantModule from './modules/control/ConstantModule.jsx'
import LogicModule from './modules/control/LogicModule.jsx'
import ComparatorModule from './modules/control/ComparatorModule.jsx'
import SampleHoldModule from './modules/control/SampleHoldModule.jsx'
import PenModule from './modules/control/PenModule.jsx'
import JoystickModule from './modules/control/JoystickModule.jsx'

import MultModule from './modules/math/MultModule.jsx'
import AttenuatorModule from './modules/math/AttenuatorModule.jsx'
import VCAModule from './modules/math/VCAModule.jsx'
import SwitchModule from './modules/math/SwitchModule.jsx'
import QuantizerModule from './modules/math/QuantizerModule.jsx'
import ScaleOffsetModule from './modules/math/ScaleOffsetModule.jsx'
import RingModModule from './modules/math/RingModModule.jsx'
import WaveshaperModule from './modules/math/WaveshaperModule.jsx'
import DelayModule from './modules/math/DelayModule.jsx'
import ReverbModule from './modules/math/ReverbModule.jsx'
import MixerModule from './modules/math/MixerModule.jsx'
import MathsModule from './modules/math/MathsModule.jsx'
import TransformModule from './modules/math/TransformModule.jsx'
import FilterModule from './modules/math/FilterModule.jsx'
import MagnetoModule from './modules/math/MagnetoModule.jsx'
import S2VModule from './modules/math/S2VModule.jsx'
import V2SModule from './modules/math/V2SModule.jsx'

import RGBOscillatorModule from './modules/generators/RGBOscillatorModule.jsx'
import WaveformModule from './modules/generators/WaveformModule.jsx'
import WireframeModule from './modules/generators/WireframeModule.jsx'
import NoiseModule from './modules/generators/NoiseModule.jsx'
import RampModule from './modules/generators/RampModule.jsx'
import SMX3Module from './modules/generators/SMX3Module.jsx'
import LineGenModule from './modules/generators/LineGenModule.jsx'
import RadialGenModule from './modules/generators/RadialGenModule.jsx'
import ModulatorGenModule from './modules/generators/ModulatorGenModule.jsx'
import GeneratorModule from './modules/generators/GenLofiModule.jsx'
import Generator2Module from './modules/generators/GenHifiModule.jsx'
import DitherModule from './modules/generators/DitherModule.jsx'
import SVGModule from './modules/generators/SVGModule.jsx'
import LifeModule from './modules/generators/LifeModule.jsx'

import ScopeModule from './modules/display/ScopeModule.jsx'
import MonitorModule from './modules/display/MonitorModule.jsx'
import OutputModule from './modules/display/OutputModule.jsx'
import ConsoleModule from './modules/display/ConsoleModule.jsx'
import RecorderModule from './modules/display/RecorderModule.jsx'

import PatchModule from './modules/utility/PatchModule.jsx'
import PowerModule from './modules/utility/PowerModule.jsx'
import PerfModule from './modules/utility/PerfModule.jsx'

export const MODULE_DEFS = {
  // Control
  clock:     { component: ClockModule,        hp: 4,  u: 3, category: 'control',    label: 'Clock',       description: 'Master tempo source for the entire patch. BPM knob sweeps from 20 to 300. Run/stop toggle starts and halts the clock. 8 division outputs (d1-d8) emit 30ms gate pulses at progressively divided rates. Patch d1 for quarter notes or d8 for slow rhythmic triggers.' },
  clockDiv:  { component: ClockDividerModule, hp: 4,  u: 3, category: 'control',    label: 'Clk Div',     description: 'Divides an incoming clock signal into 8 separate division outputs. Rotate input cyclically permutes the output assignments so divisions shift across jacks. Reset input clears all internal counters back to zero. Useful for creating polyrhythmic patterns from a single clock source.' },
  lfo:       { component: LFOModule,          hp: 6,  u: 3, category: 'control',    label: 'LFO',         description: 'Low frequency oscillator with 4 selectable wave shapes: sine, saw, triangle, and square. Rate knob sweeps from 0.1 to 20Hz. Depth and offset knobs shape the output range. Sync input resets the phase to zero on each trigger for tempo-locked modulation.' },
  envelope:  { component: EnvelopeModule,     hp: 6,  u: 3, category: 'control',    label: 'Envelope',    description: 'ADSR envelope generator with attack, decay, sustain, and release stages. Attack, decay, and release range from 5ms to 2 seconds. Accepts both gate and clock trigger inputs. Cycle mode loops the envelope continuously for self-running modulation.' },
  sequencer: { component: SequencerModule,    hp: 16, u: 3, category: 'control',    label: 'Sequencer',   description: '32-step sequencer spread across 4 pages (A-D). Buchla-style stepped faders with 10 snap positions per step. Each step has a 3-state gate toggle: on, skip, or off. Clock and reset inputs advance and restart the sequence. CV-controllable length from 1 to 32 steps.' },
  constant:  { component: ConstantModule,     hp: 4,  u: 1, category: 'control',    label: 'Constant',    description: 'Outputs a fixed scalar value set by a single knob ranging from 0 to 100. Simple and essential CV source for patching constant values into any input. Use it to bias offsets, set thresholds, or hold a steady parameter.' },
  logic:     { component: LogicModule,        hp: 8,  u: 1, category: 'control',    label: 'Logic',       description: 'Boolean logic processor for two inputs. 6 selectable modes: AND, OR, XOR, NOT, NAND, and NOR. Threshold is fixed at 50 to determine high or low state. Output is strictly 0 or 100. Useful for combining gates and building conditional signal paths.' },
  comparator:{ component: ComparatorModule,   hp: 6,  u: 1, category: 'control',    label: 'Comparator',  description: 'Compares an input signal against an adjustable threshold. Outputs a gate of 100 when the input exceeds the threshold, 0 otherwise. Threshold is CV-controllable for dynamic comparison. Converts continuous signals into binary gates for logic and triggering.' },
  sampleHold:{ component: SampleHoldModule,   hp: 6,  u: 1, category: 'control',    label: 'S&H',        description: 'Samples the input signal on each trigger rising edge and holds the captured value until the next trigger. Slew knob adds smooth glide between sampled values for portamento-style transitions. Pairs well with noise or LFO sources for stepped random modulation.' },
  pen:       { component: PenModule,          hp: 6,  u: 3, category: 'control',    label: 'Pen',         description: 'Controls the draw style consumed by display modules. Thickness ranges from 0.5 to 10 pixels with dash, gap, and opacity parameters. Cap style selects round, square, or butt line endings. Lofi toggle and 5 CV inputs for animated pen modulation. Outputs a pen object that shapes how points and edges are rendered.' },
  joystick:  { component: JoystickModule,    hp: 12, u: 1, category: 'control',    label: 'Joystick',    description: 'Interactive XY touchpad (96x96) with a vertical Z slider for three-axis manual control. Snap-to-center toggle returns the pad to midpoint on release. Outputs 3 independent scalar values (X, Y, Z) ranging from 0 to 100. Ideal for real-time performance control of multiple parameters simultaneously.' },

  // Math
  mult:      { component: MultModule,         hp: 8,  u: 1, category: 'math',       label: 'Mult',        description: 'Dual 1-to-4 signal splitter for distributing signals to multiple destinations. Input 2 is normalled from Input 1 when unpatched. Provides 8 buffered outputs total (1a-1d, 2a-2d). Essential utility for sending one signal to several modules without signal loss.' },
  attenuator:{ component: AttenuatorModule,   hp: 26, u: 1, category: 'math',       label: 'Atten',       description: '4-channel attenuverter with cascading signal flow. Each channel has a level knob (0-100%) and a unipolar/bipolar toggle for inversion. Cascading means an unpatched input inherits from the channel above. Essential for scaling, inverting, and combining CV signals before they reach their destination.' },
  vca:       { component: VCAModule,          hp: 8,  u: 1, category: 'math',       label: 'VCA',         description: 'Dual voltage-controlled amplifier that multiplies an input signal by a CV control value. Formula is output = input x (CV / 100), giving linear amplitude response. CV range of 0-100 means full attenuation to unity gain. Use it to dynamically control signal levels with envelopes, LFOs, or other modulation sources.' },
  switch:    { component: SwitchModule,       hp: 10, u: 1, category: 'math',       label: 'Switch',      description: 'Dual CV-controlled A/B signal switch. When CV exceeds 50, output selects input B; otherwise it selects input A. Works with any signal type including scalars, colors, and points. Useful for alternating between two sources rhythmically or conditionally.' },
  quantizer: { component: QuantizerModule,    hp: 4,  u: 1, category: 'math',       label: 'Quantizer',   description: 'Snaps a continuous signal to discrete evenly-spaced steps. Steps knob selects from 2 to 16 divisions across the 0-100 range. Input values are rounded to the nearest step boundary. Turns smooth modulation into staircase patterns for stepped visual effects.' },
  scaleOfs:  { component: ScaleOffsetModule,  hp: 4,  u: 1, category: 'math',       label: 'Scale/Ofs',   description: 'Scales and offsets an input signal to map it into a new range. Scale knob goes from 0 to 200% for attenuation or amplification. Offset knob ranges from -50 to +50 to shift the signal up or down. Essential for conditioning CV signals before they reach a destination module.' },
  ringMod:   { component: RingModModule,      hp: 6,  u: 1, category: 'math',       label: 'Ring Mod',    description: 'Ring modulator that multiplies two input signals together. Depth knob blends between dry input and the modulated result. Depth is CV-controllable for dynamic wet/dry animation. Creates sum-and-difference interactions between two signal sources.' },
  waveshaper:{ component: WaveshaperModule,   hp: 6,  u: 3, category: 'math',       label: 'Waveshaper',  description: 'Non-linear waveshaper with 8 distortion modes: exponential, logarithmic, s-curve, clip, fold, wrap, step, and sine. Amount and symmetry knobs control intensity and bias. Harmonic fold toggle adds extra overtone content. Works on scalars, colors, and point signals alike.' },
  delay:     { component: DelayModule,        hp: 6,  u: 3, category: 'math',       label: 'Delay',       description: 'Frame-based delay buffer holding up to 256 frames of history. Time, mix, copies (1-6), and feedback knobs each with CV input. Points signals merge past frames as trailing visual echoes. Feedback creates cascading repeats that decay over time.' },
  reverb:    { component: ReverbModule,       hp: 10, u: 1, category: 'math',       label: 'Ghost',       description: 'Multi-tap reverb using 12 prime-spaced delay taps for dense diffusion. Mix, size, and decay knobs each with CV input. Freeze toggle captures and holds the current reverb tail indefinitely. Source bypass and FX bypass switches for quick A/B comparison.' },
  mixer:     { component: MixerModule,        hp: 6,  u: 3, category: 'math',       label: 'Mixer',       description: '4-channel scalar mixer that sums weighted inputs to a single output. Each channel has an individual level knob ranging from 0 to 100%. All four inputs are combined additively at the output. Simple and essential for blending multiple CV or modulation sources.' },
  maths:     { component: MathsModule,        hp: 20, u: 3, category: 'math',       label: 'Maths',       description: 'Dual function generator inspired by Make Noise Maths. Each channel has rise and fall envelopes with logarithmic, linear, and exponential curve shapes. Cycle mode turns each channel into a self-running oscillator. 2 built-in attenuverter channels for signal scaling. Bus outputs provide sum, OR (max), and inverted signals across 14 inputs and 11 outputs.' },
  filter:    { component: FilterModule,      hp: 6,  u: 3, category: 'math',       label: 'Filter',      description: 'State variable filter with 4 modes: low-pass, high-pass, band-pass, and notch. Cutoff and resonance knobs each with CV input for modulated filtering. Processes scalars directly, colors per RGB channel, and points per vertex coordinate. Smooth signal shaping for taming harsh modulation or adding sweep effects.' },
  transform: { component: TransformModule,   hp: 6,  u: 3, category: 'math',       label: 'Xform',       description: '3D transform processor for points geometry. Position X/Y, scale (0.5x to 2x), and rotation on X/Y/Z axes (0-360 degrees). Perspective projection flattens 3D to 2D output. 6 CV inputs for animating every parameter. Preserves signal metadata through the transform chain.' },
  magneto:   { component: MagnetoModule,    hp: 28, u: 3, category: 'math',       label: 'Magneto',     description: '70s-style RGB video delay with 4 color-coded playback heads: red, green, blue, and amber. CRT chromatic offset separates color channels spatially. Tape degradation controls include age (dropout), crinkle (twist), wow (drift), and spring (zoom). 3 delay patterns (even/triplet/shift), 3 pan modes, per-head level and toggle. 120-frame buffer with infinite feedback mode and per-head clock outputs.' },
  s2v:       { component: S2VModule,         hp: 8,  u: 1, category: 'math',       label: 'S2V',         description: 'Converts scalar signals into visual points geometry. 5 display modes: bar, gauge, plot, meter, and scatter. Accepts 4 scalar inputs and generates a combined points output. Bridges the gap between CV signals and the visual display pipeline.' },
  v2s:       { component: V2SModule,         hp: 4,  u: 1, category: 'math',       label: 'V2S',         description: 'Converts visual points geometry back into scalar signals. Analyzes the incoming points data and extracts 4 measurements. Outputs point count, center X, center Y, and bounding area as independent scalars. Use it to create feedback loops where visuals drive modulation.' },

  // Generators
  rgb:       { component: RGBOscillatorModule,hp: 8,  u: 3, category: 'generators', label: 'RGB Osc',     description: 'Per-channel RGB color oscillator with independent control over each channel. Each channel has a CV input, rate knob, oscillator toggle (sine 0.1-10Hz), and color mode toggle. Individual R, G, and B scalar outputs plus a combined color output. Clock input syncs all oscillator phases simultaneously.' },
  waveform:  { component: WaveformModule,     hp: 6,  u: 3, category: 'generators', label: 'Waveform',    description: 'Generates a 64-point waveform as visual geometry. 4 selectable shapes: sine, saw, triangle, and square. Frequency (0.5-10Hz), amplitude, and speed knobs each with CV input. Clock input resets the phase for tempo-synced animation. Outputs points that trace the waveform shape.' },
  wireframe: { component: WireframeModule,    hp: 8,  u: 3, category: 'generators', label: 'Gen 3D',      description: '3D wireframe geometry generator with 7 built-in shapes: cube, tetrahedron, octahedron, icosahedron, sphere, torus, and cylinder. 3x3 grid of CV-controllable knobs for rotation X/Y/Z, speed, scale, resolution, and FOV. Animate toggle, axis display, and reset button. Color input tints the wireframe. Perspective projection outputs 2D points.' },
  noise:     { component: NoiseModule,        hp: 22, u: 1, category: 'generators', label: 'Noise',       description: 'Multi-function noise and random signal utility. Provides both pink and white noise outputs simultaneously. Built-in clock/random pulse generator running 0.1-20Hz. Sample-and-hold or track-and-hold mode with trigger input. Slew limiter with adjustable rate smooths any output. External clock input overrides the internal generator.' },
  ramp:      { component: RampModule,         hp: 6,  u: 1, category: 'generators', label: 'Ramp',        description: 'Ramp and triangle waveform generator with 3 selectable shapes: up, down, and triangle. Rate knob sweeps from 0.1 to 10Hz with CV input for modulated speed. Sync input resets the phase to zero on each trigger. Outputs a scalar signal cycling from 0 to 100.' },
  smx3:      { component: SMX3Module,         hp: 8,  u: 3, category: 'generators', label: 'SMX3',        description: '3x3 matrix mixer routing 3 inputs (A/B/C) to 3 outputs (R/G/B) via 9 bipolar knobs. Knobs are centered at 50 where 0 inverts the signal and 100 passes it at unity. Combined color output merges all three output channels. Creates complex color transformations and cross-channel modulation.' },
  lineGen:   { component: LineGenModule,      hp: 6,  u: 3, category: 'generators', label: 'LineGen',     description: '2D geometric pattern generator with 5 modes: line, grid, circle, spiral, and lissajous. Frequency, density (2-16 elements), and speed knobs each with CV input. Generates animated geometric patterns as points output. Density controls how many elements appear in each pattern.' },
  radialGen: { component: RadialGenModule,   hp: 12, u: 3, category: 'generators', label: 'Radial',      description: 'Harmonic radial shape generator with 7 presets: default, circle, triangle, rectangle, star, hexagon, and random. 6 parameter knobs each with CV input for detailed shape control. Internal LFO with 4 wave shapes animates parameters. Symmetry X/Y mirroring, fill, grid, and aspect lock toggles shape the final output.' },
  modGen:    { component: ModulatorGenModule, hp: 14, u: 3, category: 'generators', label: 'Modulator',   description: 'Breathing concentric circle generator with frequency modulation. 6 shape parameter sliders each with CV input control the ring geometry. Breath LFO with time, amplitude, and speed parameters animates the pattern. Quantize, absolute, and freeze toggles alter the output behavior. Stroke width is controllable for varying line thickness.' },
  generator: { component: GeneratorModule,    hp: 10, u: 3, category: 'generators', label: 'Gen Lofi',    description: 'Lo-fi texture generator sampling a 16x16 grid. 3 algorithms run simultaneously: gradient (linear/radial/conic), pattern (stripes/dots/checker), and wave (sin/saw/tri/sqr). Each algorithm has its own dedicated output jack. Animation syncs to clock input for tempo-locked textures.' },
  generator2:{ component: Generator2Module,   hp: 10, u: 3, category: 'generators', label: 'Gen Hifi',    description: 'Hi-fi texture generator with per-algorithm continuous geometry. Modes include pattern, wave, gradient, and color generation. Internal LFO modulates parameters automatically. HSL color mode with harmony sub-types: monochromatic, complementary, analogous, and triadic. Wave mode provides amplitude, duty, and offset controls with CV inputs.' },
  dither:    { component: DitherModule,      hp: 14, u: 3, category: 'generators', label: 'Dither',      description: 'Dithering engine with 3 layouts (grid/hex/radial) and 6 filters (halftone/flow/crosshatch/CRT/glitch/melt). 10 geometric shapes or 10 ASCII characters as dither elements. Raycast toggle enables accurate fill rendering. Blur knob smooths density transitions. Color input, size from 8 to 256 cells.' },
  svg:       { component: SVGModule,         hp: 10, u: 1, category: 'generators', label: 'SVG',         description: 'SVG file parser that converts vector paths into points geometry. Full path command support including M, L, H, V, C, S, Q, T, A, and Z. 20 built-in shapes with file upload for custom SVGs. Scale knob with CV input, color and pen inputs. Outputs points with aspect-lock preservation.' },
  life:      { component: LifeModule,        hp: 12, u: 3, category: 'generators', label: 'Life',        description: 'Cellular automaton simulator with 9 rulesets: Seeds, Diamoeba, Day and Night, Maze, Life, HighLife, Morley, Anneal, and Replicator. Resolution from 8 to 256 with zoom, density, and speed controls. Wrap toggle enables toroidal grid edges. Auto-reseed triggers when the population goes extinct. Clock and reset inputs with canvas preview.' },

  // Display
  scope:     { component: ScopeModule,        hp: 16, u: 1, category: 'display',    label: 'Scope',       description: '2-channel oscilloscope for monitoring signals. Split or overlay display modes for comparing two inputs. 128-sample ring buffer records signal history. Pen input controls the trace drawing style. Pass-through outputs forward the signals unchanged.' },
  monitor:   { component: MonitorModule,      hp: 12, u: 3, category: 'display',    label: 'Monitor',     description: '2-channel signal display with a larger canvas than scope. Split or overlay modes for dual-input comparison. 128-sample history buffer for scrolling traces. Pen input controls drawing style. Pass-through outputs let you monitor a signal without breaking the chain.' },
  output:    { component: OutputModule,       hp: 16, u: 3, category: 'display',    label: 'Output',      description: '4-layer compositing display as the final render destination. Inputs a, b, c, and d are layered with background brightness controlled by knob and CV. Pen input styles the rendering. No outputs, making it a terminal module. 128-sample per-channel history for signal monitoring.' },
  console:   { component: ConsoleModule,     hp: 48, u: 3, category: 'display',    label: 'Console',     description: '4-channel mixer with integrated display canvas. Per-channel level fader, send 1/2 knobs, and mute toggle for each input. 2 send/return buses with enable and return level controls. Master strip with level, sends, background, and on/off. Opacity-based mixing across 10 input jacks and 3 output jacks.' },
  recorder:  { component: RecorderModule,   hp: 20, u: 3, category: 'display',    label: 'Recorder',    description: 'Video export module with realtime and offline rendering modes. Records patch output to WebM video at 720p to 4K resolution. 7 aspect ratios (1:1, 3:5, 4:5, 9:16, 16:9, 5:3, 5:4) and 30 or 60fps. Offline mode steps frame-by-frame with fixed timing to guarantee smooth output even from heavy patches. 4 compositing inputs with pen and background control.' },

  // Utility
  patch:     { component: PatchModule,        hp: 6,  u: 1, category: 'utility',    label: 'Patch',       description: 'Preset manager with dropdown selector for organizing patches. Load, save, and clear buttons for patch management. Save exports the full patch as JSON to the clipboard including connections, enabled modules, and console state. Cable count display shows the current number of active patch connections.' },
  power:     { component: PowerModule,       hp: 4,  u: 1, category: 'utility',    label: 'Power',       description: 'Master power rocker switch with an animated toggle indicator. All-modules mute toggle enables or disables every module in the rack simultaneously. Controls the case-level power context shared across the system. Essential for quickly silencing or resuming the entire patch.' },
  perf:      { component: PerfModule,        hp: 4,  u: 1, category: 'utility',    label: 'Perf',        description: 'Real-time performance monitor displaying frame time in milliseconds, FPS counter, and active module count. Color-coded budget bar shifts from green to yellow to red as frame time increases. Samples at 4Hz for stable readings without flicker. Essential for diagnosing performance bottlenecks in complex patches.' },
}

export const CATEGORIES = ['control', 'math', 'generators', 'display', 'utility']

export function getModulesByCategory(category) {
  return Object.entries(MODULE_DEFS)
    .filter(([, def]) => def.category === category)
    .map(([type, def]) => ({ type, ...def }))
}
