// Live recording — captures rAF frames via captureStream + MediaRecorder

const BITRATES = { 720: 8_000_000, 1080: 15_000_000, 1440: 30_000_000, 2160: 50_000_000 }

function detectCodec() {
  if (typeof MediaRecorder === 'undefined') return null
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9'
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) return 'video/webm;codecs=vp8'
  if (MediaRecorder.isTypeSupported('video/webm')) return 'video/webm'
  return null
}

export function setupLiveRecording({ recCanvasRef, drawFrame, computeDimensions, resolutionRef, aspectRef, fpsRef, chunksRef, mediaRecorderRef }) {
  const codec = detectCodec()
  if (!codec) {
    console.error('[Recorder] No supported WebM codec found')
    return null
  }

  const { width, height } = computeDimensions(resolutionRef.current, aspectRef.current)

  let rc = recCanvasRef.current
  if (!rc) {
    rc = document.createElement('canvas')
    rc.style.cssText = 'visibility:hidden;position:absolute;left:-9999px;top:-9999px'
    document.body.appendChild(rc)
    recCanvasRef.current = rc
  }
  rc.width = width
  rc.height = height

  drawFrame(rc.getContext('2d'), width, height, true)

  const targetFps = Number(fpsRef.current)
  const stream = rc.captureStream(targetFps)

  const bitrate = BITRATES[Number(resolutionRef.current)] || 15_000_000
  const recorder = new MediaRecorder(stream, { mimeType: codec, videoBitsPerSecond: bitrate })

  chunksRef.current = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunksRef.current.push(e.data)
  }

  mediaRecorderRef.current = recorder
  return recorder
}

export function startLiveRecording({ recorder, durationRef, isRecordingRef, stopRequestedRef, progressIntervalRef, setStatus, setProgress, finalize }) {
  if (!recorder) return

  isRecordingRef.current = true
  stopRequestedRef.current = false
  setStatus('recording')
  setProgress(0)

  recorder.start(1000)

  const targetMs = durationRef.current * 1000
  const startTime = performance.now()
  progressIntervalRef.current = setInterval(() => {
    if (stopRequestedRef.current || !isRecordingRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
      return
    }
    const elapsed = performance.now() - startTime
    setProgress(Math.min(1, elapsed / targetMs))
    if (elapsed >= targetMs) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
      finalize()
    }
  }, 100)
}

export function finalizeLiveRecording({ mediaRecorderRef, chunksRef, isRecordingRef, blobUrlRef, setBlobUrl, setFileSize, setStatus, setProgress }) {
  return new Promise((resolve) => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state !== 'recording') {
      isRecordingRef.current = false
      setStatus(chunksRef.current.length > 0 ? 'done' : 'idle')
      resolve()
      return
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
      const url = URL.createObjectURL(blob)

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = url

      setBlobUrl(url)
      setFileSize(blob.size)
      setStatus('done')
      setProgress(1)
      isRecordingRef.current = false
      mediaRecorderRef.current = null
      resolve()
    }

    recorder.stop()
  })
}
