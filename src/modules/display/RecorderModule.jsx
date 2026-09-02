// RecorderModule — video export with realtime and offline rendering
// 20HP 3U, captures patch output to WebM video file

import { useRef, useState, useCallback, useEffect } from 'react'
import { useCanvasLoop } from '../../hooks/useCanvasLoop'
import { useModuleEnabled } from '../../hooks/useModuleEnabled.js'
import { useModule } from '../../hooks/useModuleRegistry.jsx'
import { useRenderControl } from '../../hooks/useRenderControl'
import { useConnectedPorts } from '../../hooks/usePatchRouting.jsx'
import { drawSignal } from './drawSignal'
import { setupLiveRecording, startLiveRecording, finalizeLiveRecording } from './recordLive'
import { startOfflineRecording } from './recordOffline'
import Module from '../utility/Module'
import LabeledJack from '../parametric/LabeledJack'
import Knob from '../parametric/Knob'
import Input from '@kolkrabbi/kol-component/atoms/Input'
import Stepper from '@kolkrabbi/kol-component/molecules/Stepper'
import FlipToggle from '../parametric/FlipToggle'
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

function RecorderPanel({
  canvasRef, enabled, onToggle, id, connected,
  inputRefs, penConnected, penRef, bgConnected, bgInRef,
  resolution, setResolution, fps, setFps, aspect, setAspect,
  mode, setMode, duration, setDuration,
  trails, setTrails,
  fileName, setFileName,
  status, progress, blobUrl, fileSize,
  onRecord, onStop, onClear,
}) {
  const isActive = status === 'recording' || status === 'rendering'

  return (
    <Module label="Rec" enabled={enabled} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* 1. Canvas — fills available space */}
        <canvas
          ref={canvasRef}
          width={240}
          height={140}
          style={{
            flex: 1,
            width: '100%',
            minHeight: 0,
            borderRadius: 2,
            border: '1px solid var(--kol-fg-08)',
          }}
        />

        {/* 2. Settings — fixed middle section, overflow hidden */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0', overflow: 'hidden' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Input size="xs" variant="outline" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="filename" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Stepper size="xs" layout="inline" className="uppercase" options={RES_OPTIONS} value={resolution} onChange={(e) => setResolution(e.target.value)} />
            <Stepper size="xs" layout="inline" className="uppercase" options={FPS_OPTIONS} value={fps} onChange={(e) => setFps(e.target.value)} />
            <Stepper size="xs" layout="inline" className="uppercase" options={ASPECT_OPTIONS} value={aspect} onChange={(e) => setAspect(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Knob value={duration} onChange={setDuration} min={1} max={60} label="dur" size="sm" variant="row" />
            <Knob value={trails} onChange={setTrails} label="trails" size="sm" variant="row" />
            <FlipToggle
              value={mode === 'offline'}
              onChange={(v) => setMode(v ? 'offline' : 'rt')}
              labelA="live"
              labelB="rndr"
              variant="horizontal"
            />
            <button
              onClick={onRecord}
              disabled={isActive}
              className="kol-helper-8"
              style={{
                background: isActive ? 'var(--kol-ctl-led-red)' : 'color-mix(in srgb, var(--kol-ctl-led-red) 40%, transparent)',
                color: 'var(--kol-color-ab-white)', border: 'none', borderRadius: 2,
                padding: '2px 8px', cursor: isActive ? 'default' : 'pointer', minWidth: 36,
              }}
            >
              {status === 'rendering' ? 'RENDER' : 'REC'}
            </button>
            <button
              onClick={isActive ? onStop : onClear}
              className={`kol-helper-8 bg-fg-08 ${(isActive || status === 'done') ? 'text-fg-96' : 'text-fg-32'}`}
              style={{
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
                download={`${fileName || 'kol'}-${mode === 'offline' ? 'render' : 'realtime'}.webm`}
                className="kol-helper-8"
                style={{
                  background: 'color-mix(in srgb, var(--kol-ctl-led-green) 40%, transparent)', color: 'var(--kol-color-ab-white)',
                  borderRadius: 2, padding: '2px 8px', textDecoration: 'none',
                  minWidth: 36, textAlign: 'center',
                }}
              >
                SAVE
              </a>
            )}
            {status === 'done' && fileSize != null && (
              <span className="kol-helper-8 text-fg-40">
                {(fileSize / 1024 / 1024).toFixed(1)}MB
              </span>
            )}
          </div>

          {isActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div className="bg-fg-04" style={{ flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round(progress * 100)}%`, height: '100%',
                  background: status === 'rendering' ? 'var(--kol-ctl-led-red)' : 'var(--kol-ctl-led-green)',
                  transition: 'width 0.1s',
                }} />
              </div>
              <span className="kol-helper-8 text-fg-48" style={{ minWidth: 28, textAlign: 'right' }}>
                {Math.round(progress * 100)}%
              </span>
            </div>
          )}

        </div>

        {/* 3. Jacks — pinned to bottom */}
        <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: 6, padding: '4px 0' }}>
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

export default function RecorderModule({ id = 'rec1', init, preview }) {
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
      trails={0} setTrails={() => {}}
      fileName="kol" setFileName={() => {}}
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
  const [resolution, setResolutionState] = useState(init?.resolution ?? '1080')
  const [fps, setFpsState] = useState(init?.fps ?? '60')
  const [aspect, setAspectState] = useState(init?.aspect ?? '16:9')
  const [mode, setModeState] = useState(init?.mode ?? 'rt')
  const [duration, setDurationState] = useState(init?.duration ?? 10)
  const [trails, setTrails] = useState(init?.trails ?? 0)
  const [fileName, setFileName] = useState(init?.fileName ?? 'kol')

  const resolutionRef = useRef(resolution)
  const fpsRef = useRef(fps)
  const aspectRef = useRef(aspect)
  const modeRef = useRef(mode)
  const durationRef = useRef(duration)
  const trailsRef = useRef(0)
  trailsRef.current = trails

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
  saveStateRef.current = { resolution, fps, aspect, mode, duration, trails, fileName }

  // Module registration
  useModule({
    id,
    stateRef: saveStateRef,
    inputs: {
      a: { type: 'any' }, b: { type: 'any' },
      c: { type: 'any' }, d: { type: 'any' },
      pen: { type: 'pen' }, bg: { type: 'scalar', cv: 'offset' },
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
    const a = 1 - Math.pow(trailsRef.current / 100, 0.3)

    ctx.fillStyle = `rgba(${g},${g},${g},${a})`
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

    if (enabledRef.current) {
      drawFrame(ctx, w, h, false)
    } else {
      ctx.fillStyle = 'rgba(8,8,8,1)'
      ctx.fillRect(0, 0, w, h)
    }

    // Aspect ratio crop overlay
    const { aw, ah } = parseAspect(aspectRef.current)
    const canvasRatio = w / h
    const targetRatio = aw / ah
    let cropW, cropH
    if (canvasRatio > targetRatio) {
      cropH = h
      cropW = h * targetRatio
    } else {
      cropW = w
      cropH = w / targetRatio
    }
    const cx = (w - cropW) / 2
    const cy = (h - cropH) / 2

    // Dim outside crop
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, cx, h)
    ctx.fillRect(cx + cropW, 0, w - cx - cropW, h)
    ctx.fillRect(cx, 0, cropW, cy)
    ctx.fillRect(cx, cy + cropH, cropW, h - cy - cropH)

    // Dashed crop border
    ctx.setLineDash([4, 3])
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(cx + 0.5, cy + 0.5, cropW - 1, cropH - 1)
    ctx.setLineDash([])

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

  const refs = { recCanvasRef, mediaRecorderRef, chunksRef, isRecordingRef, stopRequestedRef, blobUrlRef, progressIntervalRef, resolutionRef, aspectRef, fpsRef, durationRef }
  const stateFns = { setStatus, setProgress, setBlobUrl, setFileSize }

  function doStartLive() {
    const recorder = setupLiveRecording({ ...refs, drawFrame, computeDimensions })
    if (!recorder) return
    const finalize = () => finalizeLiveRecording({ ...refs, ...stateFns })
    startLiveRecording({ recorder, ...refs, ...stateFns, finalize })
  }

  function doStartOffline() {
    startOfflineRecording({ renderControl, drawFrame, computeDimensions, ...refs, ...stateFns })
  }

  const onRecord = useCallback(() => {
    if (isRecordingRef.current) return
    clearRecording()
    if (modeRef.current === 'offline') {
      doStartOffline()
    } else {
      doStartLive()
    }
  }, [])

  const onStop = useCallback(() => {
    stopRequestedRef.current = true
    if (modeRef.current === 'rt' && mediaRecorderRef.current?.state === 'recording') {
      finalizeLiveRecording({ ...refs, ...stateFns })
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
    trails={trails} setTrails={setTrails}
    fileName={fileName} setFileName={setFileName}
    status={status} progress={progress}
    blobUrl={blobUrl} fileSize={fileSize}
    onRecord={onRecord} onStop={onStop} onClear={onClear}
  />
}
