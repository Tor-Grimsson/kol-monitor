// Expression engine — compile a text expression into a (t, f, min, max, bus) => value function.
// Ported from kol-mirrors.
//
// Available in expressions:
//   t       — time in seconds
//   f       — frame counter
//   min/max — clamp bounds passed from caller (typically -100 and 100 under signed scalars)
//   bus.X   — external signal values by port name (passed as __bus object)
//   sin/cos/abs/floor/ceil/round/sqrt/pow/PI/PHI
//   wave(x), saw(x), tri(x), pulse(x, w), rand(), ease(x, c), bell(x), exp(x), log(x), step(x, n)
//
// Helpers scale their output by `max` — so `wave(t)` returns 0 to max for unipolar semantics.
// For bipolar output under signed scalars, write e.g. `sin(t * PI * 2) * 100` or `wave(t*2)*2-100`.

// Helpers span the caller's [min, max] range so the display range drives the signal range.
// E.g. min=-100, max=100: wave(t) oscillates from -100 to +100.
//      min=0,    max=100: wave(t) oscillates from 0 to 100.
const MATH_HELPERS = `
  var sin=Math.sin,cos=Math.cos,abs=Math.abs,floor=Math.floor,ceil=Math.ceil,
      round=Math.round,sqrt=Math.sqrt,pow=Math.pow,PI=Math.PI,PHI=1.618033988749895,
      __span=max-min,
      __map=function(u){return min+u*__span},
      wave=function(x){return __map(sin(x)*0.5+0.5)},
      saw=function(x){var p=((x%1)+1)%1;return __map(p)},
      pulse=function(x,w){w=w||0.5;var p=((x%1)+1)%1;return p<w?max:min},
      rand=function(){return __map(Math.random())},
      tri=function(x){var p=((x%1)+1)%1;return __map(p<0.5?p*2:(1-p)*2)},
      ease=function(x,c){c=c||2;var p=((x%1)+1)%1;var v=p<0.5?p*2:(1-p)*2;return __map(pow(v,c))},
      bell=function(x){var p=((x%1)+1)%1;return __map(Math.exp(-pow((p-0.5)*6,2)))},
      exp=function(x){var p=((x%1)+1)%1;return __map((Math.exp(p*3)-1)/(Math.exp(3)-1))},
      log=function(x){var p=((x%1)+1)%1;return __map(Math.log(1+p*9)/Math.log(10))},
      step=function(x,n){n=n||4;var p=((x%1)+1)%1;return __map(floor(p*n)/n)};
`

export function compile(expr, busKeys) {
  if (!expr) return null
  try {
    const keys = busKeys || []
    const busVars = keys.length
      ? 'var bus=__bus||{},' + keys.map(k => `${k}=bus.${k}||0`).join(',') + ';'
      : 'var bus=__bus||{};'
    return new Function('t', 'f', 'min', 'max', '__bus', `${busVars}${MATH_HELPERS}return (${expr})`)
  } catch {
    return null
  }
}
