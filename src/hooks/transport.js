// Transport — what a clean Space tap does, on the rack and the stage (plan 16 W6.2). Toggles the patch's timing
// roots: anything driving a clk/trig/gate input is a clock regardless of module type, so walk upstream from those
// drivers through every inbound cable to the sources with no inputs patched — those are the masters; followers stop
// by proxy. ponytail: rootless cycles are skipped; multiple roots all flip.
const TEMPO_PORTS = new Set(['clk', 'trig', 'gate'])

export function toggleTransport(conns, modulesRef) {
  const inbound = new Map()
  conns.forEach(c => {
    if (!inbound.has(c.toModuleId)) inbound.set(c.toModuleId, [])
    inbound.get(c.toModuleId).push(c.fromModuleId)
  })
  const roots = new Set()
  const seen = new Set()
  const visit = (id) => {
    if (seen.has(id)) return
    seen.add(id)
    const ins = inbound.get(id)
    if (!ins || ins.length === 0) { roots.add(id); return }
    ins.forEach(visit)
  }
  conns.forEach(c => { if (TEMPO_PORTS.has(c.toPort)) visit(c.fromModuleId) })
  roots.forEach(id => modulesRef.current.get(id)?.setEnabled?.(v => !v))
}
