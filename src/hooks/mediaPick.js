/**
 * mediaPick — the ONE seam a file picked in the rail's Media browser reaches the rack through
 * (plan 13 W7, user 2026-10-15: *"sure can plug to svg module. but we might add more modules for
 * things from media"*). The picker publishes `{ url, name, kind }`; a module that takes files
 * subscribes. Today that is the SVG module; a later media-taking module subscribes the same way and
 * nothing here changes. Returns how many listeners took it, so the app can say when none did.
 */
import { useEffect, useRef } from 'react'

const listeners = new Set()

export function publishMediaPick(item) {
  let taken = 0
  for (const l of listeners) if (l(item)) taken++
  return taken
}

/** `handler(item)` returns true when it took the file. */
export function useMediaPick(handler) {
  const ref = useRef(handler)
  useEffect(() => { ref.current = handler })
  useEffect(() => {
    const l = (item) => ref.current(item)
    listeners.add(l)
    return () => listeners.delete(l)
  }, [])
}
