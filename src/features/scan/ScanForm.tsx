import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { cameraSupported, createNativeDetector, decodeQr, decodeQrFromFile, detectNative } from './qr'

type CameraStatus = 'starting' | 'active' | 'denied' | 'unavailable'

const SCAN_INTERVAL_MS = 120
const FALLBACK_SCAN_INTERVAL_MS = 200
const REPEAT_IGNORE_MS = 2500
/** The small decoder gets a big picture: a dense code on a screen has modules only a few pixels wide. */
const MAX_SCAN_WIDTH = 1280
const HINT_AFTER_MS = 8000

const STATUS_TEXT: Record<CameraStatus, string> = {
  starting: 'Starting camera…',
  active: 'Point the camera at the QR code.',
  denied: "Camera access is blocked. Allow it in your browser's site settings, or use another option.",
  unavailable: 'No camera is available here. Cameras need HTTPS (or localhost) and a camera on this device.',
}

interface ScanFormProps {
  onDetected: (text: string) => void
  onError: (message: string) => void
}

export function ScanForm({ onDetected, onError }: ScanFormProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<CameraStatus>(() => (cameraSupported() ? 'starting' : 'unavailable'))
  const [slow, setSlow] = useState(false)

  const onDetectedRef = useRef(onDetected)
  useEffect(() => {
    onDetectedRef.current = onDetected
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video || !cameraSupported()) return
    const player: HTMLVideoElement = video

    let cancelled = false
    let stream: MediaStream | null = null
    let frame = 0
    let lastScan = 0
    let lastText = ''
    let lastTextAt = 0
    let busy = false
    let hintTimer = 0
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })

    function report(text: string) {
      const now = Date.now()
      if (text !== lastText || now - lastTextAt > REPEAT_IGNORE_MS) {
        lastText = text
        lastTextAt = now
        onDetectedRef.current(text)
      }
    }

    async function start() {
      const native = await createNativeDetector()
      if (cancelled) return
      const interval = native ? SCAN_INTERVAL_MS : FALLBACK_SCAN_INTERVAL_MS

      function scan(time: number) {
        frame = requestAnimationFrame(scan)
        if (busy || !video || time - lastScan < interval || video.readyState < video.HAVE_ENOUGH_DATA || video.videoWidth === 0) return
        lastScan = time
        if (native) {
          busy = true
          void detectNative(native, video).then((text) => {
            busy = false
            if (text && !cancelled) report(text)
          })
          return
        }
        if (!context) return
        const ratio = Math.min(1, MAX_SCAN_WIDTH / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * ratio)
        canvas.height = Math.round(video.videoHeight * ratio)
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const text = decodeQr(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)
        if (text) report(text)
      }

      try {
        // A phone gives a small picture unless asked for more, and a small picture cannot hold a dense code.
        const opened = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) {
          opened.getTracks().forEach((track) => track.stop())
          return
        }
        stream = opened
        // Keep refocusing as the phone moves, where the camera supports it. It is only a nicety, so it is never waited for.
        void opened
          .getVideoTracks()[0]
          ?.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] })
          .catch(() => undefined)
        player.srcObject = opened
        await player.play()
        setStatus('active')
        hintTimer = window.setTimeout(() => setSlow(true), HINT_AFTER_MS)
        frame = requestAnimationFrame(scan)
      } catch (error: unknown) {
        if (cancelled) return
        const name = error instanceof DOMException ? error.name : ''
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable')
      }
    }
    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.clearTimeout(hintTimer)
      stream?.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
  }, [])

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await decodeQrFromFile(file)
      if (text) onDetected(text)
      else onError('No QR code found in that image. Try a sharper, closer screenshot.')
    } catch {
      onError('Could not read that file as an image.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-900">
        <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${status === 'active' ? '' : 'invisible'}`} />
        {status === 'active' && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
        )}
        {status !== 'active' && (
          <p role={status === 'starting' ? 'status' : 'alert'} className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-200">
            {STATUS_TEXT[status]}
          </p>
        )}
      </div>
      {status === 'active' && <p className="text-center text-sm text-slate-600 dark:text-slate-400">{STATUS_TEXT.active}</p>}
      {status === 'active' && slow && (
        <p role="status" className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
          Still looking. Hold the phone steady about a hand-width from the code, turn the other screen&apos;s brightness up, and fill the box with the code. If it still will not read,
          use <strong>Manual</strong> and type the setup key the service shows under the QR code.
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="sr-only" tabIndex={-1} aria-label="QR code image file" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="h-12 rounded-lg border border-slate-300 font-medium hover:border-teal-600 dark:border-slate-600"
      >
        Upload a QR screenshot instead
      </button>
    </div>
  )
}
