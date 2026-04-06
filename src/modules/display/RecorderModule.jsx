// RecorderModule — video export with realtime and offline rendering
// 20HP 3U, captures patch output to WebM video file

import { useRef, useState, useCallback, useEffect } from 'react'
import { useCanvasLoop } from '../../hooks/useCanvasLoop'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { useRenderControl } from '../../hooks/useRenderControl'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'
import { drawSignal } from './drawSignal'
import Module from '../utility/Module'
import LabeledJack from '../controls/LabeledJack'
import Knob from '../controls/Knob'
import Selector from '../controls/Selector'
import FlipToggle from '../controls/FlipToggle'
import Divider from '../../components/atoms/Divider'

const BUF_LEN = 128
const CHANNELS = ['a', 'b', 'c', 'd']

const RES_OPTIONS = ['720', '1080', '1440', '2160']
const FPS_OPTIONS = ['30', '60']
const ASPECT_OPTIONS = ['1:1', '3:5', '4:5', '9:16', '16:9', '5:3', '5:4']

const BITRATES = { 720: 8_000_000, 1080: 15_000_000, 1440: 30_000_000, 2160: 50_000_000 }
const LOGICAL_SIZE = 240

function parseAspect(aspect) {
  const [w, h] = aspect.split(':').map(Number)
  return { aw: w, ah: h }
}

function computeDimensions(resolution, aspect) {
  const res = Number(resolution)
  const { aw, ah } = parseAspect(aspect)
  if (aw >= ah) return { width: Math.round(res * aw / ah), height: res }
  return { width: res, height: Math.round(res * ah / aw) }
}

function detectCodec() {
  if (typeof MediaRecorder === 'undefined') return null
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9'
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) return 'video/webm;codecs=vp8'
  if (MediaRecorder.isTypeSupported('video/webm')) return 'video/webm'
  return null
}

function RecorderPanel({
  canvasRef, enabled, onToggle, id, connected,
  inputRefs, penConnected, penRef, bgConnected, bgInRef,
  resolution, setResolution, fps, setFps, aspect, setAspect,
  mode, setMode, duration, setDuration,
  status, progress, blobUrl, fileSize,
  onRecord, onStop, onClear,
}) {
  const isActive = status === 'recording' || status === 'rendering'
  const aspectStyle = (() => {
    const { aw, ah } = parseAspect(aspect)
    return { aspectRatio: `${aw} / ${ah}` }
  })()

  return (
    <Module label="Rec" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 4 }}>

        {/* Preview canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          <canvas
            ref={canvasRef}
            width={240}
            height={135}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.06)',
              ...aspectStyle,
            }}
          />
        </div>

        {/* Settings row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Selector value={resolution} options={RES_OPTIONS} onChange={setResolution} />
          <Selector value={fps} options={FPS_OPTIONS} onChange={setFps} />
          <Selector value={aspect} options={ASPECT_OPTIONS} onChange={setAspect} />
        </div>

        {/* Duration + mode */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Knob value={duration} onChange={setDuration} min={1} max={60} label="dur" size="sm" />
          <FlipToggle
            value={mode === 'offline'}
            onChange={(v) => setMode(v ? 'offline' : 'rt')}
            labelA="live"
            labelB="rndr"
            variant="horizontal"
          />
        </div>

        {/* Transport */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <button
            onClick={onRecord}
            disabled={isActive}
            className="kol-helper-xxxs"
            style={{
              background: isActive ? 'rgba(231,76,60,0.9)' : 'rgba(231,76,60,0.4)',
              color: '#fff', border: 'none', borderRadius: 2,
              padding: '2px 8px', cursor: isActive ? 'default' : 'pointer', minWidth: 36,
            }}
          >
            {status === 'rendering' ? 'RENDER' : 'REC'}
          </button>
          <button
            onClick={isActive ? onStop : onClear}
            className="kol-helper-xxxs"
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: (isActive || status === 'done') ? '#fff' : 'rgba(255,255,255,0.3)',
              border: 'none', borderRadius: 2,
              padding: '2px 8px',
              cursor: (isActive || status === 'done') ? 'pointer' : 'default', minWidth: 36,
            }}
          >
            {isActive ? 'STOP' : status === 'done' ? 'CLR' : 'STOP'}
          </button>
          {blobUrl && (
            <a
              href={blobUrl}
              download={`kol-${resolution}p-${fps}fps-${aspect.replace(':', 'x')}.webm`}
              className="kol-helper-xxxs"
              style={{
                background: 'rgba(46,204,113,0.4)', color: '#fff',
                borderRadius: 2, padding: '2px 8px', textDecoration: 'none',
                minWidth: 36, textAlign: 'center',
              }}
            >
              SAVE
            </a>
          )}
        </div>

        {/* Progress bar */}
        {isActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round(progress * 100)}%`, height: '100%',
                background: status === 'rendering' ? 'rgba(231,76,60,0.8)' : 'rgba(46,204,113,0.6)',
                transition: 'width 0.1s',
              }} />
            </div>
            <span className="kol-helper-xxxs" style={{ color: 'rgba(255,255,255,0.5)', minWidth: 28, textAlign: 'right' }}>
              {Math.round(progress * 100)}%
            </span>
          </div>
        )}

        {/* File size */}
        {status === 'done' && fileSize != null && (
          <div className="kol-helper-xxxs" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            {(fileSize / 1024 / 1024).toFixed(1)}MB
          </div>
        )}

        <Divider />

        {/* Input jacks */}
        <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 6 }}>
          <LabeledJack type="in" port="bg" moduleId={id} active={bgConnected} signalRef={bgInRef} label="cv" size="sm" />
          {CHANNELS.map(ch => (
            <LabeledJack
              key={ch} type="in" port={ch} moduleId={id}
              active={connected[ch]}
              signalRef={{ get current() { return inputRefs.current[ch] } }}
              label={ch}
            />
          ))}
          <LabeledJack type="in" port="pen" moduleId={id} active={penConnected} signalRef={penRef} label="pen" size="sm" />
        </div>
      </div>
    </Module>
  )
}

export default function RecorderModule({ id = 'rec1', preview }) {
  if (preview) {
    const dummyInputRefs = { current: { a: null, b: null, c: null, d: null } }
    return <RecorderPanel
      canvasRef={{ current: null }} enabled={false} onToggle={() => {}} id={id}
      connected={{ a: false, b: false, c: false, d: false }}
      inputRefs={dummyInputRefs} penConnected={false} penRef={{ current: null }}
      bgConnected={false} bgInRef={{ current: null }}
      resolution="1080" setResolution={() => {}} fps="60" setFps={() => {}}
      aspect="16:9" setAspect={() => {}} mode="rt" setMode={() => {}}
      duration={10} setDuration={() => {}}
      status="idle" progress={0} blobUrl={null} fileSize={null}
      onRecord={() => {}} onStop={() => {}} onClear={() => {}}
    />
  }

  const canvasRef = useRef(null)
  const [enabled, setEnabled] = useModuleEnabled()
  const enabledRef = useRef(true)
  enabledRef.current = enabled
  const cp = useConnectedPorts(id)
  const renderControl = useRenderControl()

  // Settings state + refs (refs avoid stale closures in recording callbacks)
  const [resolution, setResolutionState] = useState('1080')
  const [fps, setFpsState] = useState('60')
  const [aspect, setAspectState] = useState('16:9')
  const [mode, setModeState] = useState('rt')
  const [duration, setDurationState] = useState(10)

  const resolutionRef = useRef(resolution)
  const fpsRef = useRef(fps)
  const aspectRef = useRef(aspect)
  const modeRef = useRef(mode)
  const durationRef = useRef(duration)

  const setResolution = (v) => { resolutionRef.current = v; setResolutionState(v) }
  const setFps = (v) => { fpsRef.current = v; setFpsState(v) }
  const setAspect = (v) => { aspectRef.current = v; setAspectState(v) }
  const setMode = (v) => { modeRef.current = v; setModeState(v) }
  const setDuration = (v) => { durationRef.current = v; setDurationState(v) }

  // Recording state
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [blobUrl, setBlobUrl] = useState(null)
  const [fileSize, setFileSize] = useState(null)

  // Signal refs (same pattern as OutputModule)
  const inputRefs = useRef({ a: null, b: null, c: null, d: null })
  const penRef = useRef(null)
  const bgInRef = useRef(null)
  const bgKnobRef = useRef(0)

  const historyRefs = useRef({
    a: new Float32Array(BUF_LEN), b: new Float32Array(BUF_LEN),
    c: new Float32Array(BUF_LEN), d: new Float32Array(BUF_LEN),
  })
  const writeIdxRef = useRef(0)

  // Recording refs
  const recCanvasRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const isRecordingRef = useRef(false)
  const stopRequestedRef = useRef(false)
  const blobUrlRef = useRef(null)
  const progressIntervalRef = useRef(null)

  const connected = {}
  for (const ch of CHANNELS) connected[ch] = cp.has(ch)
  const penConnected = cp.has('pen')
  const bgConnected = cp.has('bg')

  const saveStateRef = useRef({})
  saveStateRef.current = { resolution, fps, aspect, mode, duration }

  // Module registration
  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      a: { type: 'any' }, b: { type: 'any' },
      c: { type: 'any' }, d: { type: 'any' },
      pen: { type: 'pen' }, bg: { type: 'scalar' },
    },
    outputs: {},
    process: (inputs) => {
      if (!enabledRef.current) {
        for (const ch of CHANNELS) inputRefs.current[ch] = null
        penRef.current = null
        return {}
      }
      penRef.current = inputs.pen
      bgInRef.current = inputs.bg
      const idx = writeIdxRef.current
      for (const ch of CHANNELS) {
        inputRefs.current[ch] = inputs[ch]
        if (inputs[ch] && inputs[ch].type === 'scalar') {
          historyRefs.current[ch][idx] = inputs[ch].value
        } else {
          historyRefs.current[ch][idx] = 0
        }
      }
      writeIdxRef.current = (idx + 1) % BUF_LEN
      return {}
    },
  })

  // Draw content with aspect-fill: input maintains square proportions,
  // aspect ratio crops into it (no stretching, overflow clipped)
  // hiRes: use ctx.scale for proportional line widths at recording resolution
  function drawFrame(ctx, canvasW, canvasH, hiRes) {
    const bgVal = bgInRef.current?.type === 'scalar' ? bgInRef.current.value : bgKnobRef.current
    const g = Math.round((bgVal / 100) * 255)

    ctx.fillStyle = `rgb(${g},${g},${g})`
    ctx.fillRect(0, 0, canvasW, canvasH)

    // Aspect-fill: scale square content to cover the canvas, center and clip
    const side = Math.max(canvasW, canvasH)
    const ox = (canvasW - side) / 2
    const oy = (canvasH - side) / 2
    const wi = writeIdxRef.current
    const p = penRef.current

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, canvasW, canvasH)
    ctx.clip()

    if (hiRes) {
      const scale = side / LOGICAL_SIZE
      ctx.translate(ox, oy)
      ctx.scale(scale, scale)
      for (const ch of CHANNELS) {
        const signal = inputRefs.current[ch]
        if (!signal) continue
        drawSignal(ctx, signal, 0, 0, LOGICAL_SIZE, LOGICAL_SIZE, historyRefs.current[ch], wi, BUF_LEN, p)
      }
    } else {
      for (const ch of CHANNELS) {
        const signal = inputRefs.current[ch]
        if (!signal) continue
        drawSignal(ctx, signal, ox, oy, side, side, historyRefs.current[ch], wi, BUF_LEN, p)
      }
    }

    ctx.restore()
  }

  // Preview canvas draw (rAF-driven)
  useCanvasLoop(canvasRef, () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    if (!w || !h) return
    drawFrame(ctx, w, h, false)

    // Realtime recording: draw to recording canvas — captureStream auto-captures
    if (isRecordingRef.current && modeRef.current === 'rt') {
      try {
        const rc = recCanvasRef.current
        if (rc) {
          drawFrame(rc.getContext('2d'), rc.width, rc.height, true)
        }
      } catch (e) {
        console.error('[Recorder] frame capture error:', e)
      }
    }
  })

  // --- Recording infrastructure ---

  function setupRecording() {
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

    // Draw one frame so captureStream has content
    drawFrame(rc.getContext('2d'), width, height, true)

    // Auto-capture at target fps — no manual requestFrame() needed
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

  function finalizeRecording() {
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

  function clearRecording() {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setBlobUrl(null)
    setFileSize(null)
    setStatus('idle')
    setProgress(0)
    isRecordingRef.current = false
    stopRequestedRef.current = false
    chunksRef.current = []
  }

  function startRealtimeRecording() {
    const recorder = setupRecording()
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
        finalizeRecording()
      }
    }, 100)
  }

  async function startOfflineRecording() {
    const recorder = setupRecording()
    if (!recorder) return
    if (!renderControl?.current) {
      console.error('[Recorder] No render control available')
      return
    }

    isRecordingRef.current = true
    stopRequestedRef.current = false
    setStatus('rendering')
    setProgress(0)

    recorder.start(1000)

    const control = renderControl.current
    control.pause()

    const targetFps = Number(fpsRef.current)
    const fixedDt = 1 / targetFps
    const frameInterval = 1000 / targetFps
    const totalFrames = Math.round(durationRef.current * targetFps)
    const rc = recCanvasRef.current
    const rctx = rc.getContext('2d')

    // Step one frame per interval — paced at target fps so MediaRecorder
    // sees correct wall-clock timing between frames
    for (let i = 0; i < totalFrames; i++) {
      if (stopRequestedRef.current) break

      const frameStart = performance.now()

      try {
        control.stepFrame(fixedDt)
        drawFrame(rctx, rc.width, rc.height, true)
      } catch (e) {
        console.error('[Recorder] offline frame error:', e)
        break
      }

      if (i % 10 === 0) setProgress(i / totalFrames)

      // Wait remainder of frame interval so timestamps are correct
      const elapsed = performance.now() - frameStart
      const delay = Math.max(1, frameInterval - elapsed)
      await new Promise(r => setTimeout(r, delay))
    }

    control.resume()
    await finalizeRecording()
  }

  const onRecord = useCallback(() => {
    if (isRecordingRef.current) return
    clearRecording()
    if (modeRef.current === 'offline') {
      startOfflineRecording()
    } else {
      startRealtimeRecording()
    }
  }, [])

  const onStop = useCallback(() => {
    stopRequestedRef.current = true
    if (mediaRecorderRef.current?.state === 'recording') {
      finalizeRecording()
    }
  }, [])

  const onClear = useCallback(() => {
    clearRecording()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (recCanvasRef.current?.parentNode) recCanvasRef.current.parentNode.removeChild(recCanvasRef.current)
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    }
  }, [])

  return <RecorderPanel
    canvasRef={canvasRef}
    enabled={enabled} onToggle={() => setEnabled(!enabled)} id={id}
    connected={connected} inputRefs={inputRefs}
    penConnected={penConnected} penRef={penRef}
    bgConnected={bgConnected} bgInRef={bgInRef}
    resolution={resolution} setResolution={setResolution}
    fps={fps} setFps={setFps}
    aspect={aspect} setAspect={setAspect}
    mode={mode} setMode={setMode}
    duration={duration} setDuration={setDuration}
    status={status} progress={progress}
    blobUrl={blobUrl} fileSize={fileSize}
    onRecord={onRecord} onStop={onStop} onClear={onClear}
  />
}
