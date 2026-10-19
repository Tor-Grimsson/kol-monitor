import { createMediaClient } from '@kolkrabbi/kol-media-client'

/**
 * The kol-media stores, for the rail's Media picker (plan 13 W7, 2026-10-15 — kol-mirror's client).
 * `buckets: true` takes kol-media-client's own bucket table as shipped — which store needs proxying
 * is that package's to know, not this repo's. `proxied()` routes through the same-origin `/media/`
 * rewrite (vite.config.js · vercel.json).
 */
export const client = createMediaClient({ buckets: true })
