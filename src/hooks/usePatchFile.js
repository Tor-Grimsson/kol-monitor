// usePatchFile — save/load rack state as JSON files

/* THE PATCH, AS DATA — rows in left-to-right order with each module's offset and non-default state, the
   cables, the modules that are on. One shape for the file Export writes and the library Save keeps
   (plan 13 W7; the Patch module's clipboard copy built the same thing by hand). */
export function snapshotPatch(rack, connections, modulesRef, name = 'Untitled', description) {
  const modules = modulesRef.current
  const rows = rack.rows.map(row => ({
    height: row.height,
    modules: [...row.modules]
      .sort((a, b) => a.offset - b.offset)
      .map(m => {
        const entry = { type: m.type, id: m.id, offset: m.offset }
        const state = modules.get(m.id)?.stateRef?.current
        if (state && Object.keys(state).length > 0) entry.state = { ...state }
        return entry
      }),
  }))
  const on = []
  for (const [id, mod] of modules) if (mod.enabledRef?.current) on.push(id)
  const patch = { name, caseHp: rack.caseHp, rows, connections: connections.map(c => ({ ...c })), on }
  if (description) patch.description = description
  return patch
}

export function savePatchFile(rack, connections, modulesRef, name = 'Untitled', description) {
  downloadPatch(snapshotPatch(rack, connections, modulesRef, name, description))
}

/* a patch object → the Export file; the Library's download control writes the same file */
export function downloadPatch(patch, name = patch.name || 'Untitled') {
  const json = JSON.stringify(patch, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const date = new Date().toISOString().slice(0, 10)
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  a.download = `monitor-${slug}-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/* resolves the patch, or null when no file was picked; REJECTS when the file is not a patch (bad JSON, or
   neither rows nor connections) — so a caller can say so instead of silently doing nothing */
export function loadPatchFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => {
        let patch
        try {
          patch = JSON.parse(reader.result)
        } catch {
          return reject(new Error('not-a-patch'))
        }
        if (!patch || (!patch.rows && !patch.connections)) return reject(new Error('not-a-patch'))
        resolve(patch)
      }
      reader.readAsText(file)
    }
    input.click()
  })
}
