#!/usr/bin/env node
// generate-previews.js — Captures module and patch preview PNGs via Puppeteer
// Usage: pnpm generate-previews   (--patches: the patch covers only · --only <name>: one module/patch)
// Starts dev server, captures all modules and patches, saves to public/previews/

import { spawn } from 'child_process'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PORT = 5189 /* not 5179 — kol-mirror's generator holds it */
const BASE = `http://127.0.0.1:${PORT}`
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const MODULES_DIR = join(ROOT, 'public/previews/modules')
const PATCHES_DIR = join(ROOT, 'public/previews/patches')

// --only flag: capture a single module and/or patch by name
// Usage: pnpm generate-previews --only kaleidoscope
const onlyIdx = process.argv.indexOf('--only')
const ONLY = onlyIdx !== -1 ? process.argv[onlyIdx + 1] : null
// --patches flag: patches only, the module previews untouched
const PATCHES_ONLY = process.argv.includes('--patches')

async function startDevServer() {
  const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none' },
  })

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Dev server startup timeout')), 30000)
    server.stdout.on('data', (data) => {
      const msg = data.toString()
      if (msg.includes('Local:') || msg.includes('ready in')) {
        clearTimeout(timeout)
        resolve()
      }
    })
    server.stderr.on('data', (data) => {
      if (data.toString().includes('EADDRINUSE')) {
        clearTimeout(timeout)
        reject(new Error(`Port ${PORT} already in use`))
      }
    })
    server.on('error', (err) => { clearTimeout(timeout); reject(err) })
  })

  return server
}

async function main() {
  console.log('Starting dev server...')
  const server = await startDevServer()
  console.log(`Dev server ready on port ${PORT}`)

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: CHROME,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 3000, height: 3000, deviceScaleFactor: 2 })

    // Get list of all modules and patches
    console.log('Fetching module and patch list...')
    await page.goto(`${BASE}/dev/capture?kind=list`, { waitUntil: 'networkidle0', timeout: 15000 })
    await page.waitForSelector('#capture-list', { timeout: 10000 })
    const listData = await page.$eval('#capture-list', el => JSON.parse(el.textContent))
    const { moduleTypes, patchNames } = listData

    console.log(`Found ${moduleTypes.length} modules, ${patchNames.length} patches`)

    // --- Capture modules via DevCapturePage ---
    const filteredModules = PATCHES_ONLY ? [] : ONLY ? moduleTypes.filter(t => t === ONLY) : moduleTypes
    /* `empty` is not in the list, but it is the cover of every save without a thumb */
    const allPatches = [...patchNames, 'empty']
    const filteredPatches = ONLY ? allPatches.filter(n => n === ONLY) : allPatches

    if (ONLY) console.log(`Filtering to: ${ONLY} (${filteredModules.length} modules, ${filteredPatches.length} patches)`)

    for (const type of filteredModules) {
      const out = join(MODULES_DIR, `${type}.png`)
      process.stdout.write(`  module: ${type}...`)
      try {
        await page.goto(`${BASE}/dev/capture?kind=module&type=${type}`, { waitUntil: 'networkidle0', timeout: 15000 })
        await page.waitForSelector('#capture-target', { timeout: 10000 })
        await new Promise(r => setTimeout(r, 500))
        const el = await page.$('#capture-target')
        await el.screenshot({ path: out, type: 'png', omitBackground: true })
        console.log(' ok')
      } catch (err) {
        console.log(` FAILED: ${err.message}`)
      }
    }

    // --- Capture patches: the patch's OUTPUT, RUNNING — never the rack (user 2026-10-24: "use output of patch NOT
    //     UI of tool or editor"). A preset loads with its modules off unless its `on` list powers them, so a dark
    //     output gets what the user does: the Power module's MUTE toggle (all modules on), then another settle.
    //     The frame: Output's canvas when lit, else Monitor's, else the busiest canvas in the rack by screenshot
    //     (Raster, Slit-Echo, Console… whose WebGL reads blank to the page). No canvas at all (the empty case) →
    //     a blank output frame. Dark and blank patches are named at the end. ---
    const SETTLE = Number(process.env.SETTLE_MS) || 1500
    const settle = () => new Promise(r => setTimeout(r, SETTLE))
    /* how much signal the marked displays show — lit pixels on a 64px copy; -1 when there is none */
    const markedInk = () => page.evaluate(() => {
      const ink = (c) => {
        try {
          const t = document.createElement('canvas'); t.width = 64; t.height = 64
          const x = t.getContext('2d'); x.drawImage(c, 0, 0, 64, 64)
          const d = x.getImageData(0, 0, 64, 64).data
          let n = 0
          for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 60) n++
          return n
        } catch { return 0 }
      }
      const marked = [document.querySelector('[data-output-canvas]'), document.querySelector('[data-monitor-canvas]')].filter(Boolean)
      return marked.length ? Math.max(...marked.map(ink)) : -1
    })
    const LIT = 40 // of 4096 — below it the output is a dim line or nothing
    const dark = []
    const blank = []
    for (const name of filteredPatches) {
      const out = join(PATCHES_DIR, `${name}.png`)
      process.stdout.write(`  patch: ${name}...`)
      try {
        await page.goto(`${BASE}/rack/patch/${name}`, { waitUntil: 'networkidle0', timeout: 20000 })
        await page.waitForSelector('[data-rack-view]', { timeout: 10000 })
        await settle()
        if (await markedInk() < LIT) {
          const power = await page.evaluateHandle(() => [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === 'MUTE')?.parentElement || null)
          if (power.asElement()) { await power.asElement().click(); process.stdout.write(' powered') }
          await settle()
        }
        const marked = await page.evaluateHandle(() => {
          const ink = (c) => {
            try {
              const t = document.createElement('canvas'); t.width = 64; t.height = 64
              const x = t.getContext('2d'); x.drawImage(c, 0, 0, 64, 64)
              const d = x.getImageData(0, 0, 64, 64).data
              for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 60) return true
              return false
            } catch { return false }
          }
          return [document.querySelector('[data-output-canvas]'), document.querySelector('[data-monitor-canvas]')].find((c) => c && ink(c)) || null
        })
        if (marked.asElement()) {
          await marked.asElement().screenshot({ path: out, type: 'png' })
          console.log(' ok')
          continue
        }
        let best = null
        for (const c of await page.$$('[data-rack-view] canvas')) {
          const box = await c.boundingBox()
          if (!box || box.width < 80 || box.height < 80) continue
          const buf = await c.screenshot({ type: 'png' })
          if (!best || buf.length > best.length) best = buf
        }
        if (best) {
          writeFileSync(out, best)
          dark.push(name)
          console.log(' ok (busiest canvas — Output/Monitor dark)')
          continue
        }
        /* no display at all — a blank output frame, Output's size and ground */
        const dataUrl = await page.evaluate(() => {
          const c = document.createElement('canvas'); c.width = 248; c.height = 328
          const x = c.getContext('2d'); x.fillStyle = '#0a0a0a'; x.fillRect(0, 0, c.width, c.height)
          return c.toDataURL('image/png')
        })
        writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'))
        blank.push(name)
        console.log(' blank frame (no display)')
      } catch (err) {
        dark.push(name)
        console.log(` FAILED: ${err.message}`)
      }
    }
    if (dark.length) console.log(`\nOutput/Monitor dark after power (busiest canvas or failed): ${dark.join(', ')}`)
    if (blank.length) console.log(`No display — blank frame: ${blank.join(', ')}`)

    console.log('\nDone.')
  } finally {
    if (browser) await browser.close()
    server.kill()
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
