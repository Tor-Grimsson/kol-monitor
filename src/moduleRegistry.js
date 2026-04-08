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
  clock:     { component: ClockModule,        hp: 4,  u: 3, category: 'control',    label: 'Clock',       description: 'Master tempo source for the entire patch. BPM knob sweeps from 20 to 300. Run/stop toggle starts and halts the clock. 8 division outputs (d1-d8) emit 30ms gate pulses at progressively divided rates. Patch d1 for quarter notes or d8 for slow rhythmic triggers.', controls: [
    { type: 'toggle', name: 'Run/Stop', description: 'Start and halt the clock' },
    { type: 'knob', name: 'BPM', range: '20–300', description: 'Master tempo in beats per minute' },
    { type: 'output', name: 'd1–d8', signal: 'scalar', description: '8 gate outputs at progressive divisions (/1 through /8)' },
  ] },
  clockDiv:  { component: ClockDividerModule, hp: 4,  u: 3, category: 'control',    label: 'Clk Div',     description: 'Divides an incoming clock signal into 8 separate division outputs. Rotate input cyclically permutes the output assignments so divisions shift across jacks. Reset input clears all internal counters back to zero. Useful for creating polyrhythmic patterns from a single clock source.', controls: [
    { type: 'input', name: 'in', signal: 'scalar', description: 'Clock input, rising edge triggers divisions' },
    { type: 'input', name: 'rot', signal: 'scalar', description: 'Rotate division-to-output assignment' },
    { type: 'input', name: 'rst', signal: 'scalar', description: 'Reset all counters to zero' },
    { type: 'output', name: 'd1–d8', signal: 'scalar', description: '8 divided gate outputs' },
  ] },
  lfo:       { component: LFOModule,          hp: 6,  u: 3, category: 'control',    label: 'LFO',         description: 'Low frequency oscillator with 4 selectable wave shapes: sine, saw, triangle, and square. Rate knob sweeps from 0.1 to 20Hz. Depth and offset knobs shape the output range. Sync input resets the phase to zero on each trigger for tempo-locked modulation.', controls: [
    { type: 'selector', name: 'Shape', options: 'sin, saw, tri, sqr', description: 'Wave shape selection' },
    { type: 'knob', name: 'Rate', range: '0.1–20 Hz', description: 'Oscillator frequency' },
    { type: 'knob', name: 'Depth', range: '0–100%', description: 'Output amplitude scaling' },
    { type: 'knob', name: 'Offset', range: '0–100%', description: 'Output DC offset' },
    { type: 'input', name: 'sync', signal: 'scalar', description: 'Phase reset on rising edge' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'LFO value 0–100' },
  ] },
  envelope:  { component: EnvelopeModule,     hp: 6,  u: 3, category: 'control',    label: 'Envelope',    description: 'ADSR envelope generator with attack, decay, sustain, and release stages. Attack, decay, and release range from 5ms to 2 seconds. Accepts both gate and clock trigger inputs. Cycle mode loops the envelope continuously for self-running modulation.', controls: [
    { type: 'knob', name: 'A', range: '5ms–2s', description: 'Attack time' },
    { type: 'knob', name: 'D', range: '5ms–2s', description: 'Decay time' },
    { type: 'knob', name: 'S', range: '0–100%', description: 'Sustain level' },
    { type: 'knob', name: 'R', range: '5ms–2s', description: 'Release time' },
    { type: 'toggle', name: 'Cycle', description: 'Auto-retrigger after release' },
    { type: 'input', name: 'gate', signal: 'scalar', description: 'Gate input, rising edge starts attack' },
    { type: 'input', name: 'clk', signal: 'scalar', description: 'Clock retrigger, forces attack restart' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'Envelope level 0–100' },
  ] },
  sequencer: { component: SequencerModule,    hp: 16, u: 3, category: 'control',    label: 'Sequencer',   description: '32-step sequencer spread across 4 pages (A-D). Buchla-style stepped faders with 10 snap positions per step. Each step has a 3-state gate toggle: on, skip, or off. Clock and reset inputs advance and restart the sequence. CV-controllable length from 1 to 32 steps.', controls: [
    { type: 'selector', name: 'Page', options: 'A, B, C, D', description: '4 pages of 8 steps each' },
    { type: 'knob', name: 'Length', range: '1–32 steps', description: 'Sequence length, CV-controllable' },
    { type: 'input', name: 'clock', signal: 'scalar', description: 'Advance to next step' },
    { type: 'input', name: 'reset', signal: 'scalar', description: 'Reset to step 1' },
    { type: 'input', name: 'lenCV', signal: 'scalar', description: 'CV for sequence length' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'Current step value 0–100' },
    { type: 'output', name: 'gate', signal: 'scalar', description: '30ms pulse on each active step' },
  ] },
  constant:  { component: ConstantModule,     hp: 4,  u: 1, category: 'control',    label: 'Constant',    description: 'Outputs a fixed scalar value set by a single knob ranging from 0 to 100. Simple and essential CV source for patching constant values into any input. Use it to bias offsets, set thresholds, or hold a steady parameter.', controls: [
    { type: 'knob', name: 'Value', range: '0–100', description: 'Fixed output value' },
    { type: 'output', name: 'value', signal: 'scalar', description: 'Constant scalar output' },
  ] },
  logic:     { component: LogicModule,        hp: 8,  u: 1, category: 'control',    label: 'Logic',       description: 'Boolean logic processor for two inputs. 6 selectable modes: AND, OR, XOR, NOT, NAND, and NOR. Threshold is fixed at 50 to determine high or low state. Output is strictly 0 or 100. Useful for combining gates and building conditional signal paths.', controls: [
    { type: 'selector', name: 'Mode', options: 'AND, OR, XOR, NOT, NAND, NOR', description: 'Boolean operation' },
    { type: 'input', name: 'a', signal: 'scalar', description: 'Input A (>50 = high)' },
    { type: 'input', name: 'b', signal: 'scalar', description: 'Input B (>50 = high)' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'Logic result, 0 or 100' },
  ] },
  comparator:{ component: ComparatorModule,   hp: 6,  u: 1, category: 'control',    label: 'Comparator',  description: 'Compares an input signal against an adjustable threshold. Outputs a gate of 100 when the input exceeds the threshold, 0 otherwise. Threshold is CV-controllable for dynamic comparison. Converts continuous signals into binary gates for logic and triggering.', controls: [
    { type: 'knob', name: 'Threshold', range: '0–100', description: 'Comparison threshold' },
    { type: 'input', name: 'thrCV', signal: 'scalar', description: 'CV overrides threshold knob' },
    { type: 'input', name: 'in', signal: 'scalar', description: 'Signal to compare' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'Gate: 100 when input > threshold' },
  ] },
  sampleHold:{ component: SampleHoldModule,   hp: 6,  u: 1, category: 'control',    label: 'S&H',        description: 'Samples the input signal on each trigger rising edge and holds the captured value until the next trigger. Slew knob adds smooth glide between sampled values for portamento-style transitions. Pairs well with noise or LFO sources for stepped random modulation.', controls: [
    { type: 'knob', name: 'Slew', range: '0–100%', description: 'Glide smoothing between held values' },
    { type: 'input', name: 'in', signal: 'scalar', description: 'Signal to sample' },
    { type: 'input', name: 'trig', signal: 'scalar', description: 'Trigger captures current input' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'Held value with optional slew' },
  ] },
  pen:       { component: PenModule,          hp: 6,  u: 3, category: 'control',    label: 'Pen',         description: 'Controls the draw style consumed by display modules. Thickness ranges from 0.5 to 10 pixels with dash, gap, and opacity parameters. Cap style selects round, square, or butt line endings. Lofi toggle and 5 CV inputs for animated pen modulation. Outputs a pen object that shapes how points and edges are rendered.', controls: [
    { type: 'selector', name: 'Cap', options: 'round, square, butt', description: 'Line cap style' },
    { type: 'knob', name: 'Thickness', range: '0.5–10 px', description: 'Stroke width' },
    { type: 'knob', name: 'Dash', range: '0–20 px', description: 'Dash length' },
    { type: 'knob', name: 'Gap', range: '0–20 px', description: 'Gap between dashes' },
    { type: 'knob', name: 'Opacity', range: '0–100%', description: 'Stroke opacity' },
    { type: 'knob', name: 'Lofi', range: '0–100', description: 'Lo-fi effect amount' },
    { type: 'input', name: 'clr', signal: 'color', description: 'Stroke color override' },
    { type: 'output', name: 'out', signal: 'pen', description: 'Pen style object for display modules' },
  ] },
  joystick:  { component: JoystickModule,    hp: 12, u: 1, category: 'control',    label: 'Joystick',    description: 'Interactive XY touchpad (96x96) with a vertical Z slider for three-axis manual control. Snap-to-center toggle returns the pad to midpoint on release. Outputs 3 independent scalar values (X, Y, Z) ranging from 0 to 100. Ideal for real-time performance control of multiple parameters simultaneously.', controls: [
    { type: 'toggle', name: 'Snap', description: 'Return to center on release' },
    { type: 'output', name: 'x', signal: 'scalar', description: 'Horizontal position 0–100' },
    { type: 'output', name: 'y', signal: 'scalar', description: 'Vertical position 0–100' },
    { type: 'output', name: 'z', signal: 'scalar', description: 'Z slider value 0–100' },
  ] },

  // Math
  mult:      { component: MultModule,         hp: 8,  u: 1, category: 'math',       label: 'Mult',        description: 'Dual 1-to-4 signal splitter for distributing signals to multiple destinations. Input 2 is normalled from Input 1 when unpatched. Provides 8 buffered outputs total (1a-1d, 2a-2d). Essential utility for sending one signal to several modules without signal loss.', controls: [
    { type: 'input', name: 'in1', signal: 'scalar', description: 'Bus 1 signal input' },
    { type: 'input', name: 'in2', signal: 'scalar', description: 'Bus 2 input, normalled to in1' },
    { type: 'output', name: '1a–1d', signal: 'scalar', description: '4 copies of bus 1' },
    { type: 'output', name: '2a–2d', signal: 'scalar', description: '4 copies of bus 2' },
  ] },
  attenuator:{ component: AttenuatorModule,   hp: 26, u: 1, category: 'math',       label: 'Atten',       description: '4-channel attenuverter with cascading signal flow. Each channel has a level knob (0-100%) and a unipolar/bipolar toggle for inversion. Cascading means an unpatched input inherits from the channel above. Essential for scaling, inverting, and combining CV signals before they reach their destination.', controls: [
    { type: 'knob', name: 'a–d', range: '0–100%', description: 'Per-channel level' },
    { type: 'toggle', name: 'uni/bi', description: 'Unipolar or bipolar mode per channel' },
    { type: 'input', name: 'a–d', signal: 'scalar', description: 'Per-channel input, cascades when unpatched' },
    { type: 'output', name: 'a–d', signal: 'scalar', description: 'Per-channel scaled output' },
  ] },
  vca:       { component: VCAModule,          hp: 8,  u: 1, category: 'math',       label: 'VCA',         description: 'Dual voltage-controlled amplifier that multiplies an input signal by a CV control value. Formula is output = input x (CV / 100), giving linear amplitude response. CV range of 0-100 means full attenuation to unity gain. Use it to dynamically control signal levels with envelopes, LFOs, or other modulation sources.', controls: [
    { type: 'input', name: 'in1', signal: 'scalar', description: 'VCA 1 signal input' },
    { type: 'input', name: 'cv1', signal: 'scalar', description: 'VCA 1 control voltage' },
    { type: 'output', name: 'out1', signal: 'scalar', description: 'in1 × (cv1 / 100)' },
    { type: 'input', name: 'in2', signal: 'scalar', description: 'VCA 2 signal input' },
    { type: 'input', name: 'cv2', signal: 'scalar', description: 'VCA 2 control voltage' },
    { type: 'output', name: 'out2', signal: 'scalar', description: 'in2 × (cv2 / 100)' },
  ] },
  switch:    { component: SwitchModule,       hp: 10, u: 1, category: 'math',       label: 'Switch',      description: 'Dual CV-controlled A/B signal switch. When CV exceeds 50, output selects input B; otherwise it selects input A. Works with any signal type including scalars, colors, and points. Useful for alternating between two sources rhythmically or conditionally.', controls: [
    { type: 'input', name: 'a1', signal: 'any', description: 'Switch 1 input A (CV ≤ 50)' },
    { type: 'input', name: 'b1', signal: 'any', description: 'Switch 1 input B (CV > 50)' },
    { type: 'input', name: 'cv1', signal: 'scalar', description: 'Switch 1 selector' },
    { type: 'output', name: 'out1', signal: 'any', description: 'Switch 1 selected output' },
    { type: 'input', name: 'a2', signal: 'any', description: 'Switch 2 input A' },
    { type: 'input', name: 'b2', signal: 'any', description: 'Switch 2 input B' },
    { type: 'input', name: 'cv2', signal: 'scalar', description: 'Switch 2 selector' },
    { type: 'output', name: 'out2', signal: 'any', description: 'Switch 2 selected output' },
  ] },
  quantizer: { component: QuantizerModule,    hp: 4,  u: 1, category: 'math',       label: 'Quantizer',   description: 'Snaps a continuous signal to discrete evenly-spaced steps. Steps knob selects from 2 to 16 divisions across the 0-100 range. Input values are rounded to the nearest step boundary. Turns smooth modulation into staircase patterns for stepped visual effects.', controls: [
    { type: 'knob', name: 'Steps', range: '2–16', description: 'Number of discrete steps' },
    { type: 'input', name: 'in', signal: 'scalar', description: 'Continuous signal input' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'Quantized output' },
  ] },
  scaleOfs:  { component: ScaleOffsetModule,  hp: 4,  u: 1, category: 'math',       label: 'Scale/Ofs',   description: 'Scales and offsets an input signal to map it into a new range. Scale knob goes from 0 to 200% for attenuation or amplification. Offset knob ranges from -50 to +50 to shift the signal up or down. Essential for conditioning CV signals before they reach a destination module.', controls: [
    { type: 'knob', name: 'Scale', range: '0–200%', description: 'Signal multiplier' },
    { type: 'knob', name: 'Offset', range: '-50 to +50', description: 'DC offset shift' },
    { type: 'input', name: 'in', signal: 'scalar', description: 'Signal input' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'Scaled and offset output' },
  ] },
  ringMod:   { component: RingModModule,      hp: 6,  u: 1, category: 'math',       label: 'Ring Mod',    description: 'Ring modulator that multiplies two input signals together. Depth knob blends between dry input and the modulated result. Depth is CV-controllable for dynamic wet/dry animation. Creates sum-and-difference interactions between two signal sources.', controls: [
    { type: 'knob', name: 'Depth', range: '0–100%', description: 'Dry/wet blend' },
    { type: 'input', name: 'a', signal: 'scalar', description: 'Carrier signal' },
    { type: 'input', name: 'b', signal: 'scalar', description: 'Modulator signal' },
    { type: 'input', name: 'depthCV', signal: 'scalar', description: 'CV for depth' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'Ring modulated output' },
  ] },
  waveshaper:{ component: WaveshaperModule,   hp: 6,  u: 3, category: 'math',       label: 'Waveshaper',  description: 'Non-linear waveshaper with 8 distortion modes: exponential, logarithmic, s-curve, clip, fold, wrap, step, and sine. Amount and symmetry knobs control intensity and bias. Harmonic fold toggle adds extra overtone content. Works on scalars, colors, and point signals alike.', controls: [
    { type: 'selector', name: 'Mode', options: 'exp, log, scurve, clip, fold, wrap, step, sine', description: 'Shaping curve type' },
    { type: 'knob', name: 'Amount', range: '0–100%', description: 'Shaping intensity' },
    { type: 'knob', name: 'Symmetry', range: '0–100', description: 'Curve bias' },
    { type: 'knob', name: 'Smooth', range: '0–100', description: 'Post-shape compression' },
    { type: 'toggle', name: 'Harmonic', description: 'Fold deviation instead of compress' },
    { type: 'input', name: 'in', signal: 'any', description: 'Signal input (scalar, color, points)' },
    { type: 'output', name: 'out', signal: 'any', description: 'Shaped output' },
  ] },
  delay:     { component: DelayModule,        hp: 6,  u: 3, category: 'math',       label: 'Delay',       description: 'Frame-based delay buffer holding up to 256 frames of history. Time, mix, copies (1-6), and feedback knobs each with CV input. Points signals merge past frames as trailing visual echoes. Feedback creates cascading repeats that decay over time.', controls: [
    { type: 'knob', name: 'Time', range: '1–256 frames', description: 'Delay length' },
    { type: 'knob', name: 'Mix', range: '0–100%', description: 'Dry/wet blend' },
    { type: 'knob', name: 'Copy', range: '1–6 taps', description: 'Number of delay copies' },
    { type: 'knob', name: 'Feedback', range: '0–100%', description: 'Repeat decay amount' },
    { type: 'input', name: 'in', signal: 'any', description: 'Signal input' },
    { type: 'output', name: 'out', signal: 'any', description: 'Delayed output' },
  ] },
  reverb:    { component: ReverbModule,       hp: 10, u: 1, category: 'math',       label: 'Ghost',       description: 'Multi-tap reverb using 12 prime-spaced delay taps for dense diffusion. Mix, size, and decay knobs each with CV input. Freeze toggle captures and holds the current reverb tail indefinitely. Source bypass and FX bypass switches for quick A/B comparison.', controls: [
    { type: 'knob', name: 'Mix', range: '0–100%', description: 'Dry/wet blend' },
    { type: 'knob', name: 'Size', range: '0–100', description: 'Room size, scales tap spacing' },
    { type: 'knob', name: 'Decay', range: '0–100', description: 'Per-tap attenuation' },
    { type: 'toggle', name: 'Freeze', description: 'Hold current reverb tail' },
    { type: 'toggle', name: 'Source', description: 'Bypass dry signal (wet only)' },
    { type: 'toggle', name: 'Bypass', description: 'Pass input through unprocessed' },
    { type: 'input', name: 'in', signal: 'any', description: 'Signal input' },
    { type: 'output', name: 'out', signal: 'any', description: 'Reverb output' },
  ] },
  mixer:     { component: MixerModule,        hp: 6,  u: 3, category: 'math',       label: 'Mixer',       description: '4-channel scalar mixer that sums weighted inputs to a single output. Each channel has an individual level knob ranging from 0 to 100%. All four inputs are combined additively at the output. Simple and essential for blending multiple CV or modulation sources.', controls: [
    { type: 'knob', name: 'a–d', range: '0–100%', description: 'Per-channel level' },
    { type: 'input', name: 'a–d', signal: 'scalar', description: '4 signal inputs' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'Weighted sum' },
  ] },
  maths:     { component: MathsModule,        hp: 20, u: 3, category: 'math',       label: 'Maths',       description: 'Dual function generator inspired by Make Noise Maths. Each channel has rise and fall envelopes with logarithmic, linear, and exponential curve shapes. Cycle mode turns each channel into a self-running oscillator. 2 built-in attenuverter channels for signal scaling. Bus outputs provide sum, OR (max), and inverted signals across 14 inputs and 11 outputs.', controls: [
    { type: 'knob', name: 'Rise 1/2', range: '0–100', description: 'Rise time per channel' },
    { type: 'knob', name: 'Fall 1/2', range: '0–100', description: 'Fall time per channel' },
    { type: 'knob', name: 'Curve 1/2', range: 'log–lin–exp', description: 'Response curve shape' },
    { type: 'toggle', name: 'Cycle 1/2', description: 'Auto-retrigger on completion' },
    { type: 'knob', name: 'Atten 1–4', range: '0–100', description: 'Bipolar attenuverter per channel' },
    { type: 'input', name: 'trig/sig/CV', signal: 'scalar', description: '14 inputs: trigger, signal, rise/fall/both CV, cycle gate' },
    { type: 'output', name: 'out/eor/eoc/sum/or/inv', signal: 'scalar', description: '11 outputs: per-channel + bus' },
  ] },
  filter:    { component: FilterModule,      hp: 6,  u: 3, category: 'math',       label: 'Filter',      description: 'State variable filter with 4 modes: low-pass, high-pass, band-pass, and notch. Cutoff and resonance knobs each with CV input for modulated filtering. Processes scalars directly, colors per RGB channel, and points per vertex coordinate. Smooth signal shaping for taming harsh modulation or adding sweep effects.', controls: [
    { type: 'selector', name: 'Mode', options: 'LP, HP, BP, notch', description: 'Filter type' },
    { type: 'knob', name: 'Cutoff', range: '0–100', description: 'Filter frequency' },
    { type: 'knob', name: 'Resonance', range: '0–100', description: 'Resonant emphasis' },
    { type: 'input', name: 'in', signal: 'any', description: 'Signal input (scalar, color, points)' },
    { type: 'input', name: 'cutCV', signal: 'scalar', description: 'CV for cutoff' },
    { type: 'input', name: 'resCV', signal: 'scalar', description: 'CV for resonance' },
    { type: 'output', name: 'out', signal: 'any', description: 'Filtered output' },
  ] },
  transform: { component: TransformModule,   hp: 6,  u: 3, category: 'math',       label: 'Xform',       description: '3D transform processor for points geometry. Position X/Y, scale (0.5x to 2x), and rotation on X/Y/Z axes (0-360 degrees). Perspective projection flattens 3D to 2D output. 6 CV inputs for animating every parameter. Preserves signal metadata through the transform chain.', controls: [
    { type: 'knob', name: 'X', range: '0–100', description: 'Horizontal position' },
    { type: 'knob', name: 'Y', range: '0–100', description: 'Vertical position' },
    { type: 'knob', name: 'Scale', range: '0–2×', description: 'Size multiplier' },
    { type: 'knob', name: 'rX/rY/rZ', range: '0–360°', description: 'Rotation per axis' },
    { type: 'input', name: 'in', signal: 'points', description: 'Geometry input' },
    { type: 'output', name: 'out', signal: 'points', description: 'Transformed with perspective' },
  ] },
  magneto:   { component: MagnetoModule,    hp: 28, u: 3, category: 'math',       label: 'Magneto',     description: '70s-style RGB video delay with 4 color-coded playback heads: red, green, blue, and amber. CRT chromatic offset separates color channels spatially. Tape degradation controls include age (dropout), crinkle (twist), wow (drift), and spring (zoom). 3 delay patterns (even/triplet/shift), 3 pan modes, per-head level and toggle. 120-frame buffer with infinite feedback mode and per-head clock outputs.', controls: [
    { type: 'knob', name: 'Dry/Wet', range: '0–100%', description: 'Dry and wet signal levels' },
    { type: 'knob', name: 'Speed', range: '0–100', description: 'Tape playback rate' },
    { type: 'knob', name: 'Head 1–4', range: '0–100%', description: 'Per-head echo level' },
    { type: 'knob', name: 'Repeats', range: '1–8', description: 'Echo count per head' },
    { type: 'knob', name: 'Age/Crinkle/Wow/Spring', range: '0–100', description: 'Tape degradation controls' },
    { type: 'selector', name: 'Heads', options: 'even, triplet, shift', description: 'Delay spacing pattern' },
    { type: 'selector', name: 'Pan', options: 'LRLR, center, LRRL', description: 'Head rotation direction' },
    { type: 'toggle', name: 'Head 1–4', description: 'Per-head enable/disable' },
    { type: 'selector', name: 'Mode', options: 'echo, loop, sample', description: 'Stroke, fill, or both' },
    { type: 'input', name: 'in', signal: 'any', description: 'Signal input' },
    { type: 'input', name: 'clr', signal: 'color', description: 'Color for dry output' },
    { type: 'output', name: 'out', signal: 'points', description: 'Combined dry + wet with head colors' },
    { type: 'output', name: 'clk1–4', signal: 'scalar', description: 'Per-head clock outputs' },
  ] },
  s2v:       { component: S2VModule,         hp: 8,  u: 1, category: 'math',       label: 'S2V',         description: 'Converts scalar signals into visual points geometry. 5 display modes: bar, gauge, plot, meter, and scatter. Accepts 4 scalar inputs and generates a combined points output. Bridges the gap between CV signals and the visual display pipeline.', controls: [
    { type: 'selector', name: 'Mode', options: 'bar, gauge, plot, meter, scatter', description: 'Visualization type' },
    { type: 'input', name: 'a–d', signal: 'scalar', description: '4 scalar inputs' },
    { type: 'output', name: 'out', signal: 'points', description: 'Visual geometry output' },
  ] },
  v2s:       { component: V2SModule,         hp: 4,  u: 1, category: 'math',       label: 'V2S',         description: 'Converts visual points geometry back into scalar signals. Analyzes the incoming points data and extracts 4 measurements. Outputs point count, center X, center Y, and bounding area as independent scalars. Use it to create feedback loops where visuals drive modulation.', controls: [
    { type: 'input', name: 'in', signal: 'points', description: 'Geometry input' },
    { type: 'output', name: 'cnt', signal: 'scalar', description: 'Point count 0–100' },
    { type: 'output', name: 'x', signal: 'scalar', description: 'Center of mass X' },
    { type: 'output', name: 'y', signal: 'scalar', description: 'Center of mass Y' },
    { type: 'output', name: 'area', signal: 'scalar', description: 'Bounding box area' },
  ] },

  // Generators
  rgb:       { component: RGBOscillatorModule,hp: 8,  u: 3, category: 'generators', label: 'RGB Osc',     description: 'Per-channel RGB color oscillator with independent control over each channel. Each channel has a CV input, rate knob, oscillator toggle (sine 0.1-10Hz), and color mode toggle. Individual R, G, and B scalar outputs plus a combined color output. Clock input syncs all oscillator phases simultaneously.', controls: [
    { type: 'knob', name: 'R/G/B', range: '0–100', description: 'Per-channel rate or brightness' },
    { type: 'toggle', name: 'Osc R/G/B', description: 'Enable sine oscillator per channel' },
    { type: 'toggle', name: 'Clr R/G/B', description: 'Output as color signal vs scalar' },
    { type: 'input', name: 'r/g/b in', signal: 'scalar', description: 'CV per channel' },
    { type: 'input', name: 'clk', signal: 'scalar', description: 'Reset oscillator phases' },
    { type: 'output', name: 'r/g/b out', signal: 'scalar|color', description: 'Per-channel output' },
    { type: 'output', name: 'color', signal: 'color', description: 'Combined RGB color' },
  ] },
  waveform:  { component: WaveformModule,     hp: 6,  u: 3, category: 'generators', label: 'Waveform',    description: 'Generates a 64-point waveform as visual geometry. 4 selectable shapes: sine, saw, triangle, and square. Frequency (0.5-10Hz), amplitude, and speed knobs each with CV input. Clock input resets the phase for tempo-synced animation. Outputs points that trace the waveform shape.', controls: [
    { type: 'selector', name: 'Shape', options: 'sin, saw, tri, sqr', description: 'Waveform type' },
    { type: 'knob', name: 'Freq', range: '0.5–10 Hz', description: 'Spatial frequency' },
    { type: 'knob', name: 'Amp', range: '0–100%', description: 'Wave height' },
    { type: 'knob', name: 'Speed', range: '0–100', description: 'Animation rate' },
    { type: 'input', name: 'clk', signal: 'scalar', description: 'Phase reset' },
    { type: 'output', name: 'out', signal: 'points', description: '64-point waveform curve' },
  ] },
  wireframe: { component: WireframeModule,    hp: 8,  u: 3, category: 'generators', label: 'Gen 3D',      description: '3D wireframe geometry generator with 7 built-in shapes: cube, tetrahedron, octahedron, icosahedron, sphere, torus, and cylinder. 3x3 grid of CV-controllable knobs for rotation X/Y/Z, speed, scale, resolution, and FOV. Animate toggle, axis display, and reset button. Color input tints the wireframe. Perspective projection outputs 2D points.', controls: [
    { type: 'selector', name: 'Shape', options: 'cube, tetra, octa, ico, sphere, torus, cyl', description: '3D geometry' },
    { type: 'knob', name: 'rX/rY/rZ', range: '0–360°', description: 'Rotation per axis with CV' },
    { type: 'knob', name: 'Speed', range: '0–100', description: 'Animation rate with CV' },
    { type: 'knob', name: 'Scale', range: '0–2×', description: 'Size multiplier with CV' },
    { type: 'knob', name: 'Res', range: '8–64', description: 'Vertex count with CV' },
    { type: 'knob', name: 'FOV', range: '1–6', description: 'Perspective depth with CV' },
    { type: 'toggle', name: 'Animate', description: 'Auto-rotate over time' },
    { type: 'toggle', name: 'XYZ', description: 'Show colored axis lines' },
    { type: 'button', name: 'Reset', description: 'Zero all rotation' },
    { type: 'input', name: 'clr', signal: 'color', description: 'Wireframe tint' },
    { type: 'output', name: 'out', signal: 'points', description: '2D projected wireframe' },
  ] },
  noise:     { component: NoiseModule,        hp: 22, u: 1, category: 'generators', label: 'Noise',       description: 'Multi-function noise and random signal utility. Provides both pink and white noise outputs simultaneously. Built-in clock/random pulse generator running 0.1-20Hz. Sample-and-hold or track-and-hold mode with trigger input. Slew limiter with adjustable rate smooths any output. External clock input overrides the internal generator.', controls: [
    { type: 'knob', name: 'Rate', range: '0.1–20 Hz', description: 'Internal clock speed' },
    { type: 'knob', name: 'Slew', range: '0–100', description: 'Output smoothing time' },
    { type: 'toggle', name: 'Clk/Rnd', description: 'Regular or random pulse timing' },
    { type: 'toggle', name: 'Smp/Trk', description: 'Sample-on-edge or track-while-high' },
    { type: 'input', name: 'trig', signal: 'scalar', description: 'External S&H trigger' },
    { type: 'output', name: 'pink', signal: 'scalar', description: 'Pink noise' },
    { type: 'output', name: 'white', signal: 'scalar', description: 'White noise' },
    { type: 'output', name: 'pulse', signal: 'scalar', description: 'Gate output' },
    { type: 'output', name: 'hold', signal: 'scalar', description: 'Sample & hold value' },
    { type: 'output', name: 'slew', signal: 'scalar', description: 'Smoothed output' },
  ] },
  ramp:      { component: RampModule,         hp: 6,  u: 1, category: 'generators', label: 'Ramp',        description: 'Ramp and triangle waveform generator with 3 selectable shapes: up, down, and triangle. Rate knob sweeps from 0.1 to 10Hz with CV input for modulated speed. Sync input resets the phase to zero on each trigger. Outputs a scalar signal cycling from 0 to 100.', controls: [
    { type: 'selector', name: 'Shape', options: 'up, down, tri', description: 'Ramp direction' },
    { type: 'knob', name: 'Rate', range: '0.1–10 Hz', description: 'Oscillation speed' },
    { type: 'input', name: 'rateCV', signal: 'scalar', description: 'CV for rate' },
    { type: 'input', name: 'rst', signal: 'scalar', description: 'Phase reset' },
    { type: 'output', name: 'out', signal: 'scalar', description: 'Ramp output 0–100' },
  ] },
  smx3:      { component: SMX3Module,         hp: 8,  u: 3, category: 'generators', label: 'SMX3',        description: '3x3 matrix mixer routing 3 inputs (A/B/C) to 3 outputs (R/G/B) via 9 bipolar knobs. Knobs are centered at 50 where 0 inverts the signal and 100 passes it at unity. Combined color output merges all three output channels. Creates complex color transformations and cross-channel modulation.', controls: [
    { type: 'knob', name: 'Ra–Bc', range: '0–100', description: '9 bipolar matrix weights (50 = zero)' },
    { type: 'input', name: 'a/b/c', signal: 'scalar', description: '3 signal inputs' },
    { type: 'output', name: 'r/g/b', signal: 'scalar', description: '3 weighted sum outputs' },
    { type: 'output', name: 'clr', signal: 'color', description: 'Combined RGB color' },
  ] },
  lineGen:   { component: LineGenModule,      hp: 6,  u: 3, category: 'generators', label: 'LineGen',     description: '2D geometric pattern generator with 5 modes: line, grid, circle, spiral, and lissajous. Frequency, density (2-16 elements), and speed knobs each with CV input. Generates animated geometric patterns as points output. Density controls how many elements appear in each pattern.', controls: [
    { type: 'selector', name: 'Shape', options: 'line, grid, circle, spiral, lissajous', description: '2D pattern type' },
    { type: 'knob', name: 'Freq', range: '0.5–10', description: 'Pattern complexity with CV' },
    { type: 'knob', name: 'Density', range: '2–16', description: 'Element count with CV' },
    { type: 'knob', name: 'Speed', range: '0–100', description: 'Animation rate with CV' },
    { type: 'output', name: 'out', signal: 'points', description: '2D pattern geometry' },
  ] },
  radialGen: { component: RadialGenModule,   hp: 12, u: 3, category: 'generators', label: 'Radial',      description: 'Harmonic radial shape generator with 7 presets: default, circle, triangle, rectangle, star, hexagon, and random. 6 parameter knobs each with CV input for detailed shape control. Internal LFO with 4 wave shapes animates parameters. Symmetry X/Y mirroring, fill, grid, and aspect lock toggles shape the final output.', controls: [
    { type: 'selector', name: 'Preset', options: 'default, circle, triangle, rect, star, hex, random', description: 'Shape preset' },
    { type: 'knob', name: 'Rad/Amp/Frq/Res/Scl/Rot', range: '0–100', description: '6 shape parameters with CV' },
    { type: 'selector', name: 'LFO Wave', options: 'sin, tri, sqr, random', description: 'Internal LFO shape' },
    { type: 'knob', name: 'LFO Amt/Frq', range: '0–100', description: 'LFO modulation with CV' },
    { type: 'toggle', name: 'Sym X/Y', description: 'Mirror symmetry per axis' },
    { type: 'toggle', name: 'Fill/Grid/1:1', description: 'Output shape options' },
    { type: 'output', name: 'out', signal: 'points', description: 'Radial shape geometry' },
  ] },
  modGen:    { component: ModulatorGenModule, hp: 14, u: 3, category: 'generators', label: 'Modulator',   description: 'Breathing concentric circle generator with frequency modulation. 6 shape parameter sliders each with CV input control the ring geometry. Breath LFO with time, amplitude, and speed parameters animates the pattern. Quantize, absolute, and freeze toggles alter the output behavior. Stroke width is controllable for varying line thickness.', controls: [
    { type: 'slider', name: 'Int/Frq/Sep/Scl/Cir/Res', range: '0–100', description: '6 shape parameters with CV' },
    { type: 'slider', name: 'Breath/Bam/Spd', range: '0–100', description: 'Breath LFO controls with CV' },
    { type: 'toggle', name: 'Absolute', description: 'Change intensity interaction' },
    { type: 'toggle', name: 'Quantize', description: 'Snap frequency to integers' },
    { type: 'toggle', name: 'Freeze', description: 'Stop animation' },
    { type: 'input', name: 'str', signal: 'scalar', description: 'Stroke width 0.5–5' },
    { type: 'output', name: 'out', signal: 'points', description: 'Concentric FM circles' },
  ] },
  generator: { component: GeneratorModule,    hp: 10, u: 3, category: 'generators', label: 'Gen Lofi',    description: 'Lo-fi texture generator sampling a 16x16 grid. 3 algorithms run simultaneously: gradient (linear/radial/conic), pattern (stripes/dots/checker), and wave (sin/saw/tri/sqr). Each algorithm has its own dedicated output jack. Animation syncs to clock input for tempo-locked textures.', controls: [
    { type: 'selector', name: 'Tab', options: 'gradient, pattern, wave', description: 'Sub-type editing tab' },
    { type: 'knob', name: 'p1–p4', range: '0–100', description: 'Per-mode parameters with CV' },
    { type: 'knob', name: 'Rate', range: '0–100', description: 'Animation speed with CV' },
    { type: 'toggle', name: 'Animate', description: 'Enable animation' },
    { type: 'input', name: 'clk', signal: 'scalar', description: 'Reset animation phase' },
    { type: 'output', name: 'grad', signal: 'points', description: 'Gradient output' },
    { type: 'output', name: 'ptrn', signal: 'points', description: 'Pattern output' },
    { type: 'output', name: 'wave', signal: 'points', description: 'Wave output' },
  ] },
  generator2:{ component: Generator2Module,   hp: 10, u: 3, category: 'generators', label: 'Gen Hifi',    description: 'Hi-fi texture generator with per-algorithm continuous geometry. Modes include pattern, wave, gradient, and color generation. Internal LFO modulates parameters automatically. HSL color mode with harmony sub-types: monochromatic, complementary, analogous, and triadic. Wave mode provides amplitude, duty, and offset controls with CV inputs.', controls: [
    { type: 'selector', name: 'Mode', options: 'gradient, pattern, wave, color', description: 'Generator algorithm' },
    { type: 'knob', name: 'p1–p4', range: '0–100', description: 'Per-mode parameters with CV' },
    { type: 'knob', name: 'Amp/Dty/Ofs', range: '0–100', description: 'Wave mode controls with CV' },
    { type: 'knob', name: 'H/S/L', range: '0–100', description: 'HSL color controls' },
    { type: 'toggle', name: 'Animate/LFO/Dir', description: 'Animation and LFO toggles' },
    { type: 'input', name: 'clk', signal: 'scalar', description: 'Reset LFO phase' },
    { type: 'output', name: 'out', signal: 'points', description: 'Geometry output' },
    { type: 'output', name: 'clr', signal: 'color', description: 'Color output from HSL' },
  ] },
  dither:    { component: DitherModule,      hp: 14, u: 3, category: 'generators', label: 'Dither',      description: 'Dithering engine with 3 layouts (grid/hex/radial) and 6 filters (halftone/flow/crosshatch/CRT/glitch/melt). 10 geometric shapes or 10 ASCII characters as dither elements. Raycast toggle enables accurate fill rendering. Blur knob smooths density transitions. Color input, size from 8 to 256 cells.', controls: [
    { type: 'selector', name: 'Engine/Filter', options: 'grid, hex, radial | halftone, flow, crosshatch, CRT, glitch, melt', description: 'Layout or algorithm mode' },
    { type: 'selector', name: 'Shape/ASCII', description: '10 geometric shapes or 10 ASCII characters' },
    { type: 'knob', name: 'Size', range: '4–48 cells', description: 'Cell count with CV' },
    { type: 'knob', name: 'Gap/Scale/Contrast', range: '0–100', description: 'Cell spacing and appearance with CV' },
    { type: 'knob', name: 'Blur', range: '0–5 passes', description: 'Input density smoothing' },
    { type: 'toggle', name: 'Raycast/Invert/Fill/Animate', description: 'Rendering options' },
    { type: 'input', name: 'in', signal: 'scalar|points', description: 'Density source' },
    { type: 'input', name: 'clr', signal: 'color', description: 'Output color' },
    { type: 'output', name: 'out', signal: 'points', description: 'Dithered geometry' },
  ] },
  svg:       { component: SVGModule,         hp: 10, u: 1, category: 'generators', label: 'SVG',         description: 'SVG file parser that converts vector paths into points geometry. Full path command support including M, L, H, V, C, S, Q, T, A, and Z. 20 built-in shapes with file upload for custom SVGs. Scale knob with CV input, color and pen inputs. Outputs points with aspect-lock preservation.', controls: [
    { type: 'selector', name: 'File', description: '20 built-in SVGs + custom uploads' },
    { type: 'knob', name: 'Scale', range: '0–2×', description: 'Size multiplier with CV' },
    { type: 'button', name: 'Load', description: 'Upload custom SVG file' },
    { type: 'button', name: 'Clear', description: 'Clear current selection' },
    { type: 'input', name: 'clr', signal: 'color', description: 'Stroke color' },
    { type: 'input', name: 'pen', signal: 'pen', description: 'Pen style pass-through' },
    { type: 'output', name: 'out', signal: 'points', description: 'Parsed SVG geometry' },
  ] },
  life:      { component: LifeModule,        hp: 12, u: 3, category: 'generators', label: 'Life',        description: 'Cellular automaton simulator with 9 rulesets: Seeds, Diamoeba, Day and Night, Maze, Life, HighLife, Morley, Anneal, and Replicator. Resolution from 8 to 256 with zoom, density, and speed controls. Wrap toggle enables toroidal grid edges. Auto-reseed triggers when the population goes extinct. Clock and reset inputs with canvas preview.', controls: [
    { type: 'knob', name: 'Rule', range: '9 presets', description: 'Seeds, Diamoeba, Day&Night, Maze, Life, HighLife, Morley, Anneal, Replicator' },
    { type: 'knob', name: 'Resolution', range: '8–256', description: 'Grid size with CV' },
    { type: 'knob', name: 'Speed', range: '0.5–15.5 gen/s', description: 'Simulation rate with CV' },
    { type: 'knob', name: 'Density', range: '0–100%', description: 'Seed fill percentage with CV' },
    { type: 'knob', name: 'Zoom', range: '1–4×', description: 'Preview canvas zoom' },
    { type: 'toggle', name: 'Wrap', description: 'Toroidal grid edges' },
    { type: 'button', name: 'Seed A/B', description: 'Random or smart re-seed' },
    { type: 'input', name: 'clk', signal: 'scalar', description: 'External clock advances one generation' },
    { type: 'input', name: 'rst', signal: 'scalar', description: 'Reset trigger' },
    { type: 'input', name: 'clr', signal: 'color', description: 'Cell color' },
    { type: 'output', name: 'out', signal: 'points', description: 'Live cells as filled quads' },
  ] },

  // Display
  scope:     { component: ScopeModule,        hp: 16, u: 1, category: 'display',    label: 'Scope',       description: '2-channel oscilloscope for monitoring signals. Split or overlay display modes for comparing two inputs. 128-sample ring buffer records signal history. Pen input controls the trace drawing style. Pass-through outputs forward the signals unchanged.', controls: [
    { type: 'toggle', name: 'Split/Overlay', description: 'Side-by-side or stacked display' },
    { type: 'input', name: 'a', signal: 'any', description: 'Channel A signal' },
    { type: 'input', name: 'b', signal: 'any', description: 'Channel B signal' },
    { type: 'input', name: 'pen', signal: 'pen', description: 'Trace drawing style' },
    { type: 'output', name: 'a', signal: 'any', description: 'Pass-through of input A' },
    { type: 'output', name: 'b', signal: 'any', description: 'Pass-through of input B' },
  ] },
  monitor:   { component: MonitorModule,      hp: 12, u: 3, category: 'display',    label: 'Monitor',     description: '2-channel signal display with a larger canvas than scope. Split or overlay modes for dual-input comparison. 128-sample history buffer for scrolling traces. Pen input controls drawing style. Pass-through outputs let you monitor a signal without breaking the chain.', controls: [
    { type: 'toggle', name: 'Split/Overlay', description: 'Side-by-side or stacked display' },
    { type: 'input', name: 'a', signal: 'any', description: 'Channel A signal' },
    { type: 'input', name: 'b', signal: 'any', description: 'Channel B signal' },
    { type: 'input', name: 'pen', signal: 'pen', description: 'Trace drawing style' },
    { type: 'output', name: 'a', signal: 'any', description: 'Pass-through of input A' },
    { type: 'output', name: 'b', signal: 'any', description: 'Pass-through of input B' },
  ] },
  output:    { component: OutputModule,       hp: 16, u: 3, category: 'display',    label: 'Output',      description: '4-layer compositing display as the final render destination. Inputs a, b, c, and d are layered with background brightness controlled by knob and CV. Pen input styles the rendering. No outputs, making it a terminal module. 128-sample per-channel history for signal monitoring.', controls: [
    { type: 'knob', name: 'Background', range: '0–100', description: 'Background brightness (black to white)' },
    { type: 'input', name: 'a/b/c/d', signal: 'any', description: '4 compositing layer inputs' },
    { type: 'input', name: 'pen', signal: 'pen', description: 'Drawing style' },
    { type: 'input', name: 'bg', signal: 'scalar', description: 'CV for background brightness' },
  ] },
  console:   { component: ConsoleModule,     hp: 48, u: 3, category: 'display',    label: 'Console',     description: '4-channel mixer with integrated display canvas. Per-channel level fader, send 1/2 knobs, and mute toggle for each input. 2 send/return buses with enable and return level controls. Master strip with level, sends, background, and on/off. Opacity-based mixing across 10 input jacks and 3 output jacks.', controls: [
    { type: 'slider', name: 'Level a–d', range: '0–100%', description: 'Per-channel fader' },
    { type: 'knob', name: 'Send 1/2', range: '0–100%', description: 'Per-channel send level' },
    { type: 'toggle', name: 'Mute a–d', description: 'Per-channel on/off' },
    { type: 'knob', name: 'Return 1/2', range: '0–100%', description: 'Return bus level' },
    { type: 'slider', name: 'Master', range: '0–100%', description: 'Master output fader' },
    { type: 'knob', name: 'Background', range: '0–100', description: 'Canvas background brightness' },
    { type: 'input', name: 'a/b/c/d', signal: 'any', description: '4 channel inputs' },
    { type: 'input', name: 'pen', signal: 'pen', description: 'Drawing style' },
    { type: 'output', name: 'snd1/snd2', signal: 'any', description: 'Send bus outputs' },
    { type: 'output', name: 'out', signal: 'any', description: 'Master output' },
  ] },
  recorder:  { component: RecorderModule,   hp: 20, u: 3, category: 'display',    label: 'Recorder',    description: 'Video export module with realtime and offline rendering modes. Records patch output to WebM video at 720p to 4K resolution. 7 aspect ratios (1:1, 3:5, 4:5, 9:16, 16:9, 5:3, 5:4) and 30 or 60fps. Offline mode steps frame-by-frame with fixed timing to guarantee smooth output even from heavy patches. 4 compositing inputs with pen and background control.', controls: [
    { type: 'selector', name: 'Resolution', options: '720, 1080, 1440, 2160', description: 'Output pixel height' },
    { type: 'selector', name: 'FPS', options: '30, 60', description: 'Frame rate' },
    { type: 'selector', name: 'Aspect', options: '1:1, 3:5, 4:5, 9:16, 16:9, 5:3, 5:4', description: 'Output aspect ratio' },
    { type: 'knob', name: 'Duration', range: '1–60 s', description: 'Recording length' },
    { type: 'toggle', name: 'Live/Render', description: 'Realtime capture or offline frame-step' },
    { type: 'input', name: 'a/b/c/d', signal: 'any', description: '4 compositing layer inputs' },
    { type: 'input', name: 'pen', signal: 'pen', description: 'Drawing style' },
    { type: 'input', name: 'bg', signal: 'scalar', description: 'Background brightness CV' },
  ] },

  // Utility
  patch:     { component: PatchModule,        hp: 6,  u: 1, category: 'utility',    label: 'Patch',       description: 'Preset manager with dropdown selector for organizing patches. Load, save, and clear buttons for patch management. Save exports the full patch as JSON to the clipboard including connections, enabled modules, and console state. Cable count display shows the current number of active patch connections.', controls: [
    { type: 'selector', name: 'Preset', description: 'Patch preset selector' },
    { type: 'button', name: 'Load', description: 'Load selected patch' },
    { type: 'button', name: 'Save', description: 'Save current state to clipboard' },
    { type: 'button', name: 'Clear', description: 'Clear all connections' },
  ] },
  power:     { component: PowerModule,       hp: 4,  u: 1, category: 'utility',    label: 'Power',       description: 'Master power rocker switch with an animated toggle indicator. All-modules mute toggle enables or disables every module in the rack simultaneously. Controls the case-level power context shared across the system. Essential for quickly silencing or resuming the entire patch.', controls: [
    { type: 'toggle', name: 'Power', description: 'Master case power on/off' },
    { type: 'toggle', name: 'All', description: 'Enable/disable all modules at once' },
  ] },
  perf:      { component: PerfModule,        hp: 4,  u: 1, category: 'utility',    label: 'Perf',        description: 'Real-time performance monitor displaying frame time in milliseconds, FPS counter, and active module count. Color-coded budget bar shifts from green to yellow to red as frame time increases. Samples at 4Hz for stable readings without flicker. Essential for diagnosing performance bottlenecks in complex patches.', controls: [
    { type: 'display', name: 'Eval ms', description: 'Frame evaluation time' },
    { type: 'display', name: 'FPS', description: 'Current frames per second' },
    { type: 'display', name: 'Modules', description: 'Active module count' },
  ] },
}

export const CATEGORIES = ['control', 'math', 'generators', 'display', 'utility']

export function getModulesByCategory(category) {
  return Object.entries(MODULE_DEFS)
    .filter(([, def]) => def.category === category)
    .map(([type, def]) => ({ type, ...def }))
}
