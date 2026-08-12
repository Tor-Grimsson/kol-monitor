#!/usr/bin/env node
// generate-videos.js — Captures rack videos via CDP screencast + ffmpeg
// Usage:
//   pnpm generate-videos --patch kaleidoscope                    # full case
//   pnpm generate-videos --patch kaleidoscope --focus kal1       # zoom on module
//   pnpm generate-videos --batch                                 # all showcase patches
//   pnpm generate-videos --patch kaleidoscope --duration 5

import { spawn, execSync, execFileSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PORT = 5179
const BASE = `http://localhost:${PORT}`
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const VIDEOS_DIR = join(ROOT, 'public/videos')

// --- Parse args ---
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}
const hasFlag = (name) => process.argv.includes(`--${name}`)

const PATCH = arg('patch', null)
const FOCUS = arg('focus', null)
const DURATION = Number(arg('duration', '5'))
const BATCH = hasFlag('batch')

if (!PATCH && !BATCH) {
  console.log('Usage:')
  console.log('  pnpm generate-videos --patch <name> [--focus <moduleId>] [--duration <s>]')
  console.log('  pnpm generate-videos --batch [--duration <s>]')
  process.exit(1)
}

// --- Dev server ---
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

// --- Capture a single video ---
async function captureVideo(page, patchName, focusId, duration, outPath) {
  const isFocus = !!focusId
  const vpHeight = isFocus ? 1440 : 1080
  await page.setViewport({ width: 1920, height: vpHeight, deviceScaleFactor: 2 })

  // Load patch
  await page.goto(`${BASE}/rack/patch/${patchName}`, { waitUntil: 'networkidle0', timeout: 20000 })
  await page.waitForSelector('[data-rack-view]', { timeout: 10000 })
  await new Promise(r => setTimeout(r, 1000))

  // Unmute all modules (Cmd+M)
  await page.keyboard.down('Meta')
  await page.keyboard.press('m')
  await page.keyboard.up('Meta')
  await new Promise(r => setTimeout(r, 1000))

  // Hide nav/sidebar
  await page.evaluate(() => {
    const nav = document.querySelector('nav')
    if (nav) nav.style.display = 'none'
    const sidebar = document.querySelector('[data-modulo-sidebar]')
    if (sidebar) sidebar.style.display = 'none'
  })
  await new Promise(r => setTimeout(r, 300))

  // Zoom + snap
  if (isFocus) {
    for (let i = 0; i < 10; i++) await page.keyboard.press('=')
    await new Promise(r => setTimeout(r, 300))
    await page.keyboard.press('5')
  } else {
    await page.keyboard.press('7')
  }
  await new Promise(r => setTimeout(r, 500))

  // Measure bounding box
  const clip = await page.evaluate((fid) => {
    const selector = fid ? `[data-module-id="${fid}"]` : '[data-module-id]'
    const els = document.querySelectorAll(selector)
    if (!els.length) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (r.x < minX) minX = r.x
      if (r.y < minY) minY = r.y
      if (r.x + r.width > maxX) maxX = r.x + r.width
      if (r.y + r.height > maxY) maxY = r.y + r.height
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }, focusId)

  if (!clip) {
    console.log(`  ⚠ ${focusId || 'modules'} not found, skipping`)
    return { ok: false }
  }

  // Detect display module while page is loaded
  const displayId = await page.evaluate(() => {
    const els = document.querySelectorAll('[data-module-id]')
    for (const el of els) {
      const id = el.getAttribute('data-module-id')
      if (id?.startsWith('mon') || id?.startsWith('out') || id?.startsWith('rec')) return id
    }
    return null
  })

  const pad = 24
  const rawCropX = Math.max(0, Math.round(clip.x - pad * 2))
  const rawCropY = Math.max(0, Math.round(clip.y - pad))
  const rawCropW = Math.round(clip.width + pad * 3)
  const rawCropH = Math.round(clip.height + pad * 3)
  // Clamp to viewport (screencast frames = viewport logical size)
  const cropX = rawCropX
  const cropY = rawCropY
  const cropW = Math.min(rawCropW, 1920 - cropX)
  const cropH = Math.min(rawCropH, vpHeight - cropY)

  // CDP screencast
  const cdp = await page.createCDPSession()
  const frames = []
  let frameCount = 0

  cdp.on('Page.screencastFrame', async (event) => {
    frames.push(event.data)
    frameCount++
    try { await cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }) } catch {}
    if (frameCount % 60 === 0) process.stdout.write('.')
  })

  await new Promise(r => setTimeout(r, 500))
  process.stdout.write(`  recording ${duration}s`)
  await cdp.send('Page.startScreencast', {
    format: 'png', quality: 100,
    maxWidth: 3840, maxHeight: 2160, everyNthFrame: 1,
  })

  await new Promise(r => setTimeout(r, duration * 1000))
  await cdp.send('Page.stopScreencast')
  await cdp.detach()
  console.log(` ${frames.length}f`)

  if (frames.length === 0) {
    console.log('  ⚠ no frames captured')
    return false
  }

  // Write frames
  const tmpDir = join(ROOT, '.tmp-frames')
  mkdirSync(tmpDir, { recursive: true })
  for (let i = 0; i < frames.length; i++) {
    writeFileSync(join(tmpDir, `frame-${String(i).padStart(6, '0')}.png`), Buffer.from(frames[i], 'base64'))
  }

  // Encode
  const realFps = Math.max(1, Math.round(frames.length / duration))
  const outW = Math.ceil(cropW / 2) * 4
  const outH = Math.ceil(cropH / 2) * 4

  try {
    execFileSync('ffmpeg', [
      '-y', '-framerate', String(realFps),
      '-i', join(tmpDir, 'frame-%06d.png'),
      '-vf', `crop=${cropW}:${cropH}:${cropX}:${cropY},scale=${outW}:${outH}:flags=lanczos`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
      '-crf', '18', '-preset', 'slow',
      outPath,
    ], { stdio: 'pipe' })
    console.log(`  → ${outW}x${outH} @ ${realFps}fps`)
  } catch (err) {
    console.log(`  ⚠ encode failed: crop ${cropW}x${cropH} at ${cropX},${cropY} (${frames.length} frames)`)
  }

  rmSync(tmpDir, { recursive: true, force: true })
  return { ok: true, displayId }
}

// --- Main ---
async function main() {
  try { execSync('which ffmpeg', { stdio: 'ignore' }) } catch {
    console.error('ffmpeg not found. Install via: brew install ffmpeg')
    process.exit(1)
  }

  console.log('Starting dev server...')
  const server = await startDevServer()
  console.log(`Dev server ready on port ${PORT}`)

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true, executablePath: CHROME,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()

    if (BATCH) {
      // Get showcase patch list
      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 })
      await page.goto(`${BASE}/dev/capture?kind=list`, { waitUntil: 'networkidle0', timeout: 15000 })
      await page.waitForSelector('#capture-list', { timeout: 10000 })
      const { patchNames } = await page.$eval('#capture-list', el => JSON.parse(el.textContent))

      // Filter to showcase patches by loading each and checking tags
      // For now, use the known showcase patches from patches.js
      const showcasePatches = [
        'radial', 'modulator', 'magneto', 'genLofi', 'genHifi', 'consoleMixer',
        'wireframe', 'dither', 'filter', 'life', 'lineGen', 'smx3', 'starter',
        'kaleidoscope',
      ]

      console.log(`\nBatch: ${showcasePatches.length} showcase patches\n`)

      for (const name of showcasePatches) {
        if (!patchNames.includes(name)) {
          console.log(`[${name}] not found in patches, skipping`)
          continue
        }

        const patchDir = join(VIDEOS_DIR, name)
        mkdirSync(patchDir, { recursive: true })

        console.log(`[${name}] case`)
        const result = await captureVideo(page, name, null, DURATION, join(patchDir, 'case.mp4'))

        if (result.displayId) {
          console.log(`[${name}] module: ${result.displayId}`)
          await captureVideo(page, name, result.displayId, DURATION, join(patchDir, 'output.mp4'))
        } else {
          console.log(`[${name}] no display module found`)
        }
      }
    } else {
      // Single capture
      const outDir = FOCUS
        ? join(VIDEOS_DIR, PATCH)
        : join(VIDEOS_DIR, PATCH)
      mkdirSync(outDir, { recursive: true })

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const outName = FOCUS ? `${FOCUS}-${timestamp}.mp4` : `case-${timestamp}.mp4`
      const outPath = join(outDir, outName)

      await captureVideo(page, PATCH, FOCUS, DURATION, outPath)
      console.log(`\nDone: ${outPath}`)
    }
  } finally {
    if (browser) await browser.close()
    server.kill()
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
