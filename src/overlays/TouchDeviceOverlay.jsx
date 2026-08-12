import { useEffect, useState } from 'react'

const STORAGE_KEY = 'kol-touch-warning-dismissed'

export default function TouchDeviceOverlay() {
  const [isCoarse, setIsCoarse] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(pointer: coarse)')
    const update = () => setIsCoarse(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  if (!isCoarse || dismissed) return null

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    setDismissed(true)
  }

  return (
    <div
      className="fixed inset-0 select-none bg-fg-inverse-08"
      style={{ display: 'grid', placeItems: 'center', backdropFilter: 'blur(2px)', zIndex: 100 }}
    >
      <div
        className="bg-surface-primary border border-fg-08"
        style={{ width: 360, borderRadius: 4, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div className="kol-heading-sm text-fg-96">Desktop recommended</div>
        <div className="kol-helper-12 text-fg-64" style={{ lineHeight: 1.5 }}>
          Monitor is built for mouse and keyboard — drag patch cables, tweak knobs, and use keyboard shortcuts. Touch input isn't supported yet.
        </div>
        <button
          onClick={dismiss}
          className="kol-helper-12 text-fg-96 bg-fg-08 border border-fg-08 cursor-pointer"
          style={{ padding: '8px 12px', borderRadius: 4, marginTop: 4, alignSelf: 'flex-end' }}
        >
          Continue anyway
        </button>
      </div>
    </div>
  )
}
