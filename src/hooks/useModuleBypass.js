// Per-module bypass state. When bypassed, useModule wraps the process fn:
// process still runs (keeps internal buffers hot — no glitch on toggle),
// but the declared output port is replaced with the declared input port.

import { useState, useRef } from 'react'

// Shared ref accessible by useModule on registration. Consumed-and-cleared
// so non-bypass modules rendered after a bypass one don't accidentally pick
// up a stale ref. (Opt-in hook; unlike useModuleEnabled which is universal.)
let _lastBypassRef = null
export function getLastBypassRef() {
  const ref = _lastBypassRef
  _lastBypassRef = null
  return ref
}

export function useModuleBypass(initial = false) {
  const [bypass, setBypass] = useState(initial)
  const bypassRef = useRef(bypass)
  bypassRef.current = bypass

  // Expose for useModule to pick up (same pattern as useModuleEnabled)
  _lastBypassRef = bypassRef

  return [bypass, setBypass]
}
