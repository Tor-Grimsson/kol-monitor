#!/usr/bin/env node
// generate-previews.js — Captures module and patch preview PNGs via Puppeteer
// Usage: yarn generate-previews
// Starts dev server, captures all modules and patches, saves to public/previews/

import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PORT = 5179
const BASE = `http://localhost:${PORT}`
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const MODULES_DIR = join(ROOT, 'public/previews/modules')
const PATCHES_DIR = join(ROOT, 'public/previews/patches')

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
    for (const type of moduleTypes) {
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

    // --- Capture patches from actual rack page ---
    for (const name of patchNames) {
      const out = join(PATCHES_DIR, `${name}.png`)
      process.stdout.write(`  patch: ${name}...`)
      try {
        await page.goto(`${BASE}/rack/patch/${name}`, { waitUntil: 'networkidle0', timeout: 20000 })
        await page.waitForSelector('[data-rack-view]', { timeout: 10000 })
        await new Promise(r => setTimeout(r, 1500))

        // Strip layout chrome for clean capture
        await page.evaluate(() => {
          document.body.style.background = 'transparent'
          document.documentElement.style.background = 'transparent'
          document.querySelectorAll('.bg-surface-primary').forEach(el => el.style.background = 'transparent')
          const outer = document.querySelector('.flex-1.relative')
          if (outer) { outer.style.overflow = 'visible'; outer.style.placeItems = 'start' }
          const rack = document.querySelector('[data-rack-view]').parentElement
          if (rack) { rack.style.zoom = '1'; rack.style.transform = 'none'; rack.style.width = 'auto' }
          const rackView = document.querySelector('[data-rack-view]')
          if (rackView) { rackView.style.padding = '24px 0' }
        })
        await new Promise(r => setTimeout(r, 100))

        const el = await page.$('[data-rack-view]')
        await el.screenshot({ path: out, type: 'png', omitBackground: true })
        console.log(' ok')
      } catch (err) {
        console.log(` FAILED: ${err.message}`)
      }
    }

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
