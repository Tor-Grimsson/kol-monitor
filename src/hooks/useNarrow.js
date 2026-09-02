// useNarrow — true below 768 (the shell's drawer breakpoint). One column, thumbs,
// page scroll: the phone layout of a page that is two columns on a desk.
import { useSyncExternalStore } from 'react'

const NARROW = '(max-width: 767px)'
const subscribe = (cb) => { const mq = window.matchMedia(NARROW); mq.addEventListener('change', cb); return () => mq.removeEventListener('change', cb) }
export const useNarrow = () => useSyncExternalStore(subscribe, () => window.matchMedia(NARROW).matches, () => false)
