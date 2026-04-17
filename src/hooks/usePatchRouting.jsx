// Patch cable routing — purely structural connections, no config mutation
// Adapted from arc-case/case-03, port-based instead of busKey/configKey

import { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react'

// Split contexts: callbacks/refs are stable across the app's lifetime;
// data (connections + pendingOutput + per-module port map) changes on patch.
// Consumers that only need callbacks (most app chrome) do not re-render on cable changes.
const PatchCallbackContext = createContext(null)
const PatchDataContext = createContext(null)

const EMPTY_PORT_SET = new Set()

export function PatchRoutingProvider({ initialConnections, children }) {
  const [pendingOutput, setPendingOutput] = useState(null)
  const [connections, setConnections] = useState(initialConnections || [])
  const connectionsRef = useRef([])
  const jackRefs = useRef({})
  const pendingRef = useRef(null)
  const dragActive = useRef(false)

  // Keep refs in sync with state
  useEffect(() => { pendingRef.current = pendingOutput }, [pendingOutput])
  useEffect(() => { connectionsRef.current = connections }, [connections])

  // ESC to cancel
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') { setPendingOutput(null); dragActive.current = false }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Global pointerup — find nearest input jack, create connection
  useEffect(() => {
    const handleUp = (e) => {
      if (!dragActive.current || !pendingRef.current) return
      dragActive.current = false

      let closest = null
      let closestDist = 24
      for (const [jackId, el] of Object.entries(jackRefs.current)) {
        if (!jackId.includes(':in:')) continue
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2)
        if (dist < closestDist) {
          closestDist = dist
          closest = jackId
        }
      }

      if (closest) {
        // Parse jack ID: {moduleId}:in:{port}
        const parts = closest.split(':in:')
        if (parts.length === 2) {
          const toModuleId = parts[0]
          const toPort = parts[1]
          const pending = pendingRef.current

          setConnections(conns => {
            // Toggle: if already connected to this input, disconnect
            const existing = conns.findIndex(
              c => c.toModuleId === toModuleId && c.toPort === toPort
            )
            if (existing >= 0) {
              return conns.filter((_, i) => i !== existing)
            }
            return [...conns, {
              fromModuleId: pending.moduleId,
              fromPort: pending.port,
              toModuleId,
              toPort,
            }]
          })
        }
      }
      setPendingOutput(null)
    }
    window.addEventListener('pointerup', handleUp)
    return () => window.removeEventListener('pointerup', handleUp)
  }, [])

  const registerJack = useCallback((id, element) => {
    if (element) {
      jackRefs.current[id] = element
      element.dataset.jackId = id
    } else {
      delete jackRefs.current[id]
    }
  }, [])

  const selectOutput = useCallback((moduleId, port) => {
    setPendingOutput({ moduleId, port })
    dragActive.current = true
  }, [])

  const removeConnection = useCallback((toModuleId, toPort) => {
    setConnections(prev => prev.filter(
      c => !(c.toModuleId === toModuleId && c.toPort === toPort)
    ))
  }, [])

  const loadPatch = useCallback((connections) => {
    setConnections(connections)
    setPendingOutput(null)
  }, [])

  const lockedRef = useRef(false)
  const visibilityRef = useRef('on')

  // Stable across app lifetime — callback identities and refs never change after mount
  const callbacks = useMemo(() => ({
    connectionsRef,
    jackRefs,
    lockedRef,
    visibilityRef,
    registerJack,
    selectOutput,
    removeConnection,
    loadPatch,
  }), [registerJack, selectOutput, removeConnection, loadPatch])

  // Pre-compute per-module connected-input map once per connection change.
  // Replaces N × O(connections) per-module scans with a single O(connections) pass.
  const portsByModule = useMemo(() => {
    const m = new Map()
    for (const c of connections) {
      let s = m.get(c.toModuleId)
      if (!s) { s = new Set(); m.set(c.toModuleId, s) }
      s.add(c.toPort)
    }
    return m
  }, [connections])

  const data = useMemo(() => ({
    pendingOutput,
    connections,
    portsByModule,
  }), [pendingOutput, connections, portsByModule])

  return (
    <PatchCallbackContext.Provider value={callbacks}>
      <PatchDataContext.Provider value={data}>
        {children}
      </PatchDataContext.Provider>
    </PatchCallbackContext.Provider>
  )
}

// Backward-compat hook — reads both contexts and merges. Use only when both are needed;
// prefer the narrow hooks below (usePatchCallbacks / usePatchData) when you can.
export function usePatchRouting() {
  const cb = useContext(PatchCallbackContext)
  const data = useContext(PatchDataContext)
  if (!cb || !data) return null
  return { ...cb, ...data }
}

export function usePatchCallbacks() { return useContext(PatchCallbackContext) }
export function usePatchData() { return useContext(PatchDataContext) }

// O(1) per-module port lookup via pre-computed map.
// Returns the same Set reference across renders where the module's port set is unchanged,
// so downstream memoization can survive cable changes to other modules.
export function useConnectedPorts(moduleId) {
  const data = useContext(PatchDataContext)
  if (!data) return EMPTY_PORT_SET
  return data.portsByModule.get(moduleId) || EMPTY_PORT_SET
}
