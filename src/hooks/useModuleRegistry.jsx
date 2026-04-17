// Module registration context — ref-based Map, no React re-renders

import { createContext, useContext, useRef, useEffect, useMemo } from 'react'
import { getLastEnabledRef } from './useModuleEnabled'
import { getLastBypassRef } from './useModuleBypass'

const ModuleRegistryContext = createContext(null)

export function ModuleRegistryProvider({ children }) {
  const modulesRef = useRef(new Map())

  const value = useMemo(() => ({
    modulesRef,
    register(descriptor) {
      modulesRef.current.set(descriptor.id, descriptor)
    },
    unregister(id) {
      modulesRef.current.delete(id)
    },
    updateProcess(id, fn) {
      const desc = modulesRef.current.get(id)
      if (desc) desc.process = fn
    },
  }), [])

  return (
    <ModuleRegistryContext.Provider value={value}>
      {children}
    </ModuleRegistryContext.Provider>
  )
}

export function useModuleRegistry() {
  return useContext(ModuleRegistryContext)
}

// Convenience hook for modules — register on mount, unregister on unmount
// Optional `bypass` declares pass-through mapping(s). Accepts either a single
// `{ in, out }` pair or an array of pairs (for multi-channel modules like a
// dual VCA). Process keeps running (hot buffers / no glitch on toggle) — only
// the declared output ports are swapped to their input counterparts when the
// captured bypassRef is true.
export function useModule({ id, inputs, outputs, process, stateRef, bypass }) {
  const registry = useModuleRegistry()
  const processRef = useRef(process)
  processRef.current = process
  // Auto-grab enabledRef from useModuleEnabled (called before useModule in every module)
  const capturedEnabledRef = useRef(getLastEnabledRef())
  // Auto-grab bypassRef from useModuleBypass — only consult when bypass config
  // was declared (otherwise _lastBypassRef leaks from another module's render)
  const capturedBypassRef = useRef(bypass ? getLastBypassRef() : null)
  const bypassPairsRef = useRef(bypass ? (Array.isArray(bypass) ? bypass : [bypass]) : null)

  useEffect(() => {
    const pairs = bypassPairsRef.current
    const bypassRef = capturedBypassRef.current
    const wrappedProcess = pairs && bypassRef
      ? (ins, dt, t) => {
          const result = processRef.current(ins, dt, t)
          if (!bypassRef.current || !ins) return result
          const out = { ...result }
          for (let i = 0; i < pairs.length; i++) {
            const { in: inPort, out: outPort } = pairs[i]
            if (ins[inPort] !== undefined) out[outPort] = ins[inPort]
          }
          return out
        }
      : (...args) => processRef.current(...args)

    const descriptor = {
      id,
      inputs,
      outputs,
      stateRef,
      enabledRef: capturedEnabledRef.current,
      process: wrappedProcess,
    }
    registry.register(descriptor)
    return () => registry.unregister(id)
  }, [id, registry])
}
