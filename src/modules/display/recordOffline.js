// Offline recording — frame-perfect WebCodecs encoding with explicit timestamps

import { Muxer, ArrayBufferTarget } from 'webm-muxer'

const BITRATES = { 720: 8_000_000, 1080: 15_000_000, 1440: 30_000_000, 2160: 50_000_000 }

export async function startOfflineRecording({
  renderControl, recCanvasRef, drawFrame, computeDimensions,
  resolutionRef, aspectRef, fpsRef, durationRef,
  isRecordingRef, stopRequestedRef, blobUrlRef,
  setStatus, setProgress, setBlobUrl, setFileSize,
}) {
  if (!renderControl?.current) {
    console.error('[Recorder] No render control available')
    return
  }

  const { width, height } = computeDimensions(resolutionRef.current, aspectRef.current)
  const targetFps = Number(fpsRef.current)
  const fixedDt = 1 / targetFps
  const totalFrames = Math.round(durationRef.current * targetFps)
  const frameDurationMicros = 1_000_000 / targetFps
  const bitrate = BITRATES[Number(resolutionRef.current)] || 15_000_000

  let rc = recCanvasRef.current
  if (!rc) {
    rc = document.createElement('canvas')
    rc.style.cssText = 'visibility:hidden;position:absolute;left:-9999px;top:-9999px'
    document.body.appendChild(rc)
    recCanvasRef.current = rc
  }
  rc.width = width
  rc.height = height
  const rctx = rc.getContext('2d')

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: { codec: 'V_VP9', width, height },
    type: 'webm',
  })

  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error('[Recorder] encoder error:', e),
  })

  encoder.configure({
    codec: 'vp09.00.10.08',
    width,
    height,
    bitrate,
    framerate: targetFps,
  })

  isRecordingRef.current = true
  stopRequestedRef.current = false
  setStatus('rendering')
  setProgress(0)

  const control = renderControl.current
  control.pause()

  for (let i = 0; i < totalFrames; i++) {
    if (stopRequestedRef.current) break

    try {
      control.stepFrame(fixedDt)
      drawFrame(rctx, rc.width, rc.height, true)
    } catch (e) {
      console.error('[Recorder] offline frame error:', e)
      break
    }

    const timestamp = Math.round(i * frameDurationMicros)
    const frame = new VideoFrame(rc, { timestamp, duration: Math.round(frameDurationMicros) })
    const keyFrame = i % (targetFps * 2) === 0
    encoder.encode(frame, { keyFrame })
    frame.close()

    if (i % 10 === 0) {
      setProgress(i / totalFrames)
      await new Promise(r => setTimeout(r, 0))
    }
  }

  await encoder.flush()
  encoder.close()
  muxer.finalize()

  control.resume()

  const blob = new Blob([target.buffer], { type: 'video/webm' })
  const url = URL.createObjectURL(blob)

  if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
  blobUrlRef.current = url

  setBlobUrl(url)
  setFileSize(blob.size)
  setStatus('done')
  setProgress(1)
  isRecordingRef.current = false
}
