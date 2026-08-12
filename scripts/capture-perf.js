#!/usr/bin/env node
// capture-perf.js — CPU-profile a rack patch via Puppeteer + CDP Profiler.
// Usage: pnpm exec node scripts/capture-perf.js [--patch <name>] [--seconds 3]
// Requires: `pnpm build` already run (uses `vite preview`).
// Writes: a_torg/performance/capture-<patch>-<ts>.json + a stdout summary.

import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, mkdirSync } from 'fs'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PORT = 5180
const BASE = `http://localhost:${PORT}`
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT_DIR = join(ROOT, 'a_torg/performance')

const patchIdx = process.argv.indexOf('--patch')
const PATCH = patchIdx !== -1 ? process.argv[patchIdx + 1] : 'magneto'
const secIdx = process.argv.indexOf('--seconds')
const SECONDS = secIdx !== -1 ? Number(process.argv[secIdx + 1]) : 3

async function startPreviewServer() {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none' },
  })
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Preview server timeout')), 15000)
    server.stdout.on('data', (d) => {
      const s = d.toString()
      if (s.includes('Local:') || s.includes('ready in')) { clearTimeout(timeout); resolve() }
    })
    server.stderr.on('data', (d) => {
      if (d.toString().includes('EADDRINUSE')) { clearTimeout(timeout); reject(new Error(`Port ${PORT} busy`)) }
    })
    server.on('error', (e) => { clearTimeout(timeout); reject(e) })
  })
  return server
}

// Aggregate a CDP CPU profile into per-function self time (hitCount per node),
// then resolve parent chains so we can attribute time to named frames.
function summarize(profile) {
  const { nodes, samples, timeDeltas } = profile
  const byId = new Map(nodes.map(n => [n.id, n]))

  // Sum sample time into the leaf node (self time)
  const selfHits = new Map() // id -> accumulated ms
  for (let i = 0; i < samples.length; i++) {
    const id = samples[i]
    const dt = (timeDeltas[i] || 0) / 1000 // µs → ms
    selfHits.set(id, (selfHits.get(id) || 0) + dt)
  }

  const totalMs = [...selfHits.values()].reduce((s, v) => s + v, 0)

  // Build rows with resolved function info
  const rows = []
  for (const [id, ms] of selfHits) {
    const n = byId.get(id)
    const f = n.callFrame
    rows.push({
      name: f.functionName || '(anonymous)',
      url: (f.url || '').replace(/^https?:\/\/[^/]+/, ''),
      line: f.lineNumber,
      ms,
      pct: (ms / totalMs) * 100,
    })
  }
  rows.sort((a, b) => b.ms - a.ms)
  return { rows, totalMs }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  console.log(`Starting preview server on :${PORT}...`)
  const server = await startPreviewServer()

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: CHROME,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000'],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })

    const url = PATCH === 'default'
      ? `${BASE}/rack`
      : `${BASE}/rack/patch/${PATCH}`
    console.log(`Navigating: ${url}`)
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 })
    await page.waitForSelector('[data-rack-view]', { timeout: 10000 })
    // Modules load disabled. Press `m` (mute-all toggle) to enable everything.
    await page.bringToFront()
    await page.focus('body')
    await page.keyboard.press('m')
    // Let the render loop stabilize with modules actually running before profiling
    await new Promise(r => setTimeout(r, 1500))

    const client = await page.createCDPSession()
    await client.send('Profiler.enable')
    await client.send('Profiler.setSamplingInterval', { interval: 100 }) // µs
    await client.send('Profiler.start')
    console.log(`Profiling for ${SECONDS}s...`)
    await new Promise(r => setTimeout(r, SECONDS * 1000))
    const { profile } = await client.send('Profiler.stop')

    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const outPath = join(OUT_DIR, `capture-${PATCH}-${ts}.json`)
    writeFileSync(outPath, JSON.stringify(profile))
    console.log(`Saved raw profile: ${outPath}`)

    const { rows, totalMs } = summarize(profile)
    console.log(`\nTotal active CPU time in ${SECONDS}s window: ${totalMs.toFixed(1)}ms`)
    console.log('\nTop 25 by self-time:')
    console.log('  ms       %      function                                     file:line')
    console.log('  ------  ------ -------------------------------------------- ------------------')
    for (const r of rows.slice(0, 25)) {
      const name = r.name.slice(0, 44).padEnd(44)
      const file = `${r.url.split('/').pop()}:${r.line}`.slice(0, 30)
      console.log(`  ${r.ms.toFixed(1).padStart(6)}  ${r.pct.toFixed(1).padStart(5)}% ${name} ${file}`)
    }
  } finally {
    if (browser) await browser.close()
    server.kill()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
