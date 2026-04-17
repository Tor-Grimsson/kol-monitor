// Precomputed sin/cos lookup tables — cheap substitute for Math.sin / Math.cos
// in per-vertex hot paths. Accuracy is ~0.09° (360° / 4096 entries), visually
// indistinguishable for vector synthesis.
//
// Usage:
//   import { sinLut, cosLut } from '../../hooks/trigLut'
//   const y = sinLut(angle)   // replaces Math.sin(angle)
//
// Wrapping: any finite float angle works (positive, negative, larger than 2π).
// Bitwise mask + int32 conversion is faster than Math.sin for typical vertex counts.

const LUT_SIZE = 4096
const LUT_MASK = LUT_SIZE - 1
const TWO_PI = Math.PI * 2
const LUT_PER_RAD = LUT_SIZE / TWO_PI

const SIN_LUT = new Float32Array(LUT_SIZE)
const COS_LUT = new Float32Array(LUT_SIZE)
for (let i = 0; i < LUT_SIZE; i++) {
  const a = (i / LUT_SIZE) * TWO_PI
  SIN_LUT[i] = Math.sin(a)
  COS_LUT[i] = Math.cos(a)
}

export function sinLut(angle) {
  return SIN_LUT[((angle * LUT_PER_RAD) | 0) & LUT_MASK]
}

export function cosLut(angle) {
  return COS_LUT[((angle * LUT_PER_RAD) | 0) & LUT_MASK]
}
