// /dev → Card flip — the three `backReveal` treatments side by side on real patches (output front, rack back), so
// the pick is made on a working copy before the Library and Home change (user 2026-10-24: "I dont like the flip on
// image only, can we try flip on card?"). Hover a card, or tab to it.
import { useEffect, useState } from 'react'
import ContentCard from '@kolkrabbi/kol-component/molecules/ContentCard'
import { FlipCard } from '@kolkrabbi/kol-hardware'
import { patchImages } from '../shipped'
import { useHoverFlip } from '../../hooks/useHoverFlip'

const NAMES = ['init', 'morph', 'trail-spin', 'slit-echo']
const MODES = [
  { mode: 'flip-card', label: 'Flip card — the whole card turns' },
  { mode: 'flip-image', label: 'Flip image — the cover turns (today)' },
  { mode: 'hover', label: 'Hover — the back cuts in' },
]

/* THE TRUE FLIP (user 2026-10-24: "it doesnt truly flip the card, there is still the background that remains"): the
   WHOLE card turns — plate, text, controls — and the back is a second full face on the card's own surface carrying the
   rack. Hover turns it, leaving turns it back.
   kol-hardware's FlipCard since 0.7.0 (FlipCardFaceSwap): faces swap by backface, so the back shows from edge-on. */
function TrueFlip({ name, flipped }) {
  const [front, back] = patchImages(name)
  /* Settings → Hover flips card (default off) adds hover on top of F */
  const hoverFlip = useHoverFlip()
  const [over, setOver] = useState(false)
  return (
    <div onMouseEnter={() => hoverFlip && setOver(true)} onMouseLeave={() => setOver(false)}>
      <FlipCard
        flipped={flipped !== (hoverFlip && over)}
        front={<ContentCard variant="app" title={name} date={Date.parse('2026-10-24')} media={front.src} mark={{ icon: 'nav-rack', label: 'Patch' }} fit="cover" />}
        back={<div className="size-full overflow-hidden rounded-[var(--kol-radius-sm,4px)] bg-surface-secondary"><img src={back.src} alt={`${name} rack`} className="size-full object-cover" style={{ objectPosition: 'top left', scale: 1.1, transformOrigin: 'top left' }} /></div>}
      />
    </div>
  )
}

export default function CardFlipPage() {
  const [flipped, setFlipped] = useState(false)
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, [contenteditable]')) return
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); setFlipped((v) => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <span className="kol-mono-12 uppercase text-fg-48">True flip — the whole card turns over · press F</span>
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {NAMES.map((name) => <TrueFlip key={name} name={name} flipped={flipped} />)}
        </div>
      </section>
      {MODES.map(({ mode, label }) => (
        <section key={mode} className="flex flex-col gap-3">
          <span className="kol-mono-12 uppercase text-fg-48">{label}</span>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {NAMES.map((name) => {
              const [front, back] = patchImages(name)
              return (
                <ContentCard
                  key={name}
                  variant="app"
                  title={name}
                  date={Date.parse('2026-10-24')}
                  media={front.src}
                  back={back.src}
                  backReveal={mode}
                  mark={{ icon: 'nav-rack', label: 'Patch' }}
                  fit="cover"
                />
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
