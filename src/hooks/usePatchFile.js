// usePatchFile — save/load rack state as JSON files

export function savePatchFile(rack, connections, modulesRef, name = 'Untitled', description) {
  const modules = modulesRef.current

  const rows = rack.rows.map(row => ({
    height: row.height,
    modules: row.modules.map(m => {
      const entry = { type: m.type, id: m.id }
      // Only include non-default state
      const reg = modules.get(m.id)
      if (reg?.stateRef?.current) {
        const state = reg.stateRef.current
        if (Object.keys(state).length > 0) entry.state = state
      }
      return entry
    }),
  }))

  // Enabled modules
  const on = []
  for (const [id, mod] of modules) {
    if (mod.enabledRef?.current) on.push(id)
  }

  const patch = { name, rows, connections, on }
  if (description) patch.description = description

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

export function loadPatchFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result))
        } catch {
          resolve(null)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  })
}
