// Centralized render loop — single RAF, topological sort, module evaluation

import { useRef, useEffect, useCallback } from 'react'

// Kahn's algorithm — returns sorted IDs, cycle-delayed set, and connection index
function buildGraph(modulesMap, connections) {
  const ids = [...modulesMap.keys()]
  const inDegree = new Map(ids.map(id => [id, 0]))
  const adjacency = new Map(ids.map(id => [id, []]))

  // Connection index: toModuleId → [connections targeting it]
  const connIndex = new Map()

  for (const conn of connections) {
    if (!modulesMap.has(conn.fromModuleId) || !modulesMap.has(conn.toModuleId)) continue
    adjacency.get(conn.fromModuleId).push(conn.toModuleId)
    inDegree.set(conn.toModuleId, (inDegree.get(conn.toModuleId) || 0) + 1)

    let list = connIndex.get(conn.toModuleId)
    if (!list) { list = []; connIndex.set(conn.toModuleId, list) }
    list.push(conn)
  }

  const queue = []
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id)
  }

  const sorted = []
  while (queue.length > 0) {
    const id = queue.shift()
    sorted.push(id)
    for (const downstream of adjacency.get(id)) {
      const newDeg = inDegree.get(downstream) - 1
      inDegree.set(downstream, newDeg)
      if (newDeg === 0) queue.push(downstream)
    }
  }

  // Modules not in sorted list are in cycles — use 1-frame delay
  const delayed = new Set()
  if (sorted.length < ids.length) {
    const sortedSet = new Set(sorted)
    for (const id of ids) {
      if (!sortedSet.has(id)) {
        sorted.push(id)
        delayed.add(id)
      }
    }
  }

  return { sorted, delayed, connIndex }
}

const EMPTY_CONNS = []

export function useRenderLoop(modulesRef, connectionsRef, power = true, timingRef) {
  const rafRef = useRef(null)
  const outputsRef = useRef(new Map())
  const prevOutputsRef = useRef(new Map())
  const startTimeRef = useRef(0)
  const lastFrameRef = useRef(0)
  const localTimingRef = useRef({ evalMs: 0, frameCount: 0 })
  const fpsAccRef = useRef({ frames: 0, lastSample: 0, fps: 60 })

  const powerRef = useRef(power)
  powerRef.current = power

  // Graph cache — version counter for stable invalidation
  const graphCacheRef = useRef(null)
  const cachedModuleCount = useRef(0)
  const cachedConnectionsRef = useRef(null)

  // Double-buffer for output swap (avoids new Map() every frame)
  const outputBufA = useRef(new Map())
  const outputBufB = useRef(new Map())
  const useA = useRef(true)

  // Offline stepping state
  const steppedT = useRef(0)
  const pausedRef = useRef(false)

  // Core processing — shared by tick (realtime) and stepFrame (offline)
  function processFrame(dt, t) {
    const modules = modulesRef.current
    const connections = connectionsRef.current

    // Invalidate graph cache if graph changed
    if (
      modules.size !== cachedModuleCount.current ||
      connections !== cachedConnectionsRef.current
    ) {
      graphCacheRef.current = buildGraph(modules, connections)
      cachedModuleCount.current = modules.size
      cachedConnectionsRef.current = connections
    }

    const { sorted, delayed, connIndex } = graphCacheRef.current

    if (!powerRef.current) {
      outputsRef.current.clear()
    } else {
      for (const id of sorted) {
        const mod = modules.get(id)
        if (!mod) continue

        if (mod.enabledRef && !mod.enabledRef.current) {
          outputsRef.current.delete(id)
          continue
        }

        const inputs = {}
        for (const portName of Object.keys(mod.inputs)) {
          inputs[portName] = null
        }

        const modConns = connIndex.get(id) || EMPTY_CONNS
        for (const conn of modConns) {
          const source = delayed.has(conn.fromModuleId) && !outputsRef.current.has(conn.fromModuleId)
            ? prevOutputsRef.current.get(conn.fromModuleId)
            : outputsRef.current.get(conn.fromModuleId)

          if (source && conn.toPort in inputs) {
            inputs[conn.toPort] = source[conn.fromPort] || null
          }
        }

        const result = mod.process(inputs, dt, t)
        if (result) {
          outputsRef.current.set(id, result)
          mod.lastOutputs = result
        }
      }
    }

    // Swap output buffers (no allocation)
    const prev = prevOutputsRef.current
    prev.clear()
    for (const [k, v] of outputsRef.current) prev.set(k, v)

    return graphCacheRef.current?.sorted?.length || 0
  }

  const tick = useCallback((now) => {
    if (pausedRef.current) return

    if (!startTimeRef.current) startTimeRef.current = now
    const t = (now - startTimeRef.current) / 1000
    const dt = lastFrameRef.current ? (now - lastFrameRef.current) / 1000 : 1 / 60
    lastFrameRef.current = now

    const evalStart = performance.now()
    const moduleCount = processFrame(dt, t)
    const evalMs = performance.now() - evalStart

    localTimingRef.current.evalMs = evalMs
    localTimingRef.current.frameCount++

    const frameDt = dt * 1000
    const fpsAcc = fpsAccRef.current
    fpsAcc.frames++
    if (now - fpsAcc.lastSample >= 1000) {
      fpsAcc.fps = fpsAcc.frames
      fpsAcc.frames = 0
      fpsAcc.lastSample = now
    }

    if (timingRef) {
      timingRef.current.frameMs = frameDt
      timingRef.current.evalMs = evalMs
      timingRef.current.fps = fpsAcc.fps
      timingRef.current.moduleCount = moduleCount
      timingRef.current.frameCount = localTimingRef.current.frameCount
    }

    if (localTimingRef.current.frameCount % 60 === 0) {
      console.debug(`[VM] eval: ${evalMs.toFixed(2)}ms (${moduleCount} modules)`)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [modulesRef, connectionsRef])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [tick])

  // Render loop control for offline recording
  const controlRef = useRef({
    stepFrame(dt) {
      steppedT.current += dt
      processFrame(dt, steppedT.current)
    },
    pause() {
      pausedRef.current = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    },
    resume() {
      pausedRef.current = false
      lastFrameRef.current = 0
      startTimeRef.current = 0
      rafRef.current = requestAnimationFrame(tick)
    },
  })
  // Keep resume closure fresh
  controlRef.current.resume = () => {
    pausedRef.current = false
    lastFrameRef.current = 0
    startTimeRef.current = 0
    rafRef.current = requestAnimationFrame(tick)
  }

  return { outputsRef, timingRef: localTimingRef, controlRef }
}
