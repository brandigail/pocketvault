import jsQR from 'jsqr'

const MAX_IMAGE_EDGE = 1600

/** True when this browser exposes a camera API. It still needs HTTPS or localhost, and the user's permission. */
export function cameraSupported(): boolean {
  return typeof navigator.mediaDevices?.getUserMedia === 'function'
}

/** Decodes a QR code from RGBA pixels, or returns null if none is found. */
export function decodeQr(pixels: Uint8ClampedArray, width: number, height: number): string | null {
  return jsQR(pixels, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null
}

// The browser's own QR detector (Chrome on Android has one, backed by the phone's vision library). It copes with blur,
// glare, tilt and the fine pattern of a screen far better than the small JavaScript decoder below, which stays as the
// fallback for browsers that do not have it. These shapes are declared here because TypeScript does not ship them.
interface DetectedBarcode {
  rawValue: string
}
export interface NativeDetector {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>
}
interface NativeDetectorConstructor {
  new (options?: { formats?: string[] }): NativeDetector
  getSupportedFormats?: () => Promise<string[]>
}

/** The browser's QR detector if it can read QR codes, otherwise null. */
export async function createNativeDetector(): Promise<NativeDetector | null> {
  const Detector = (globalThis as unknown as { BarcodeDetector?: NativeDetectorConstructor }).BarcodeDetector
  if (!Detector) return null
  try {
    const formats = await Detector.getSupportedFormats?.()
    if (formats && !formats.includes('qr_code')) return null
    return new Detector({ formats: ['qr_code'] })
  } catch {
    return null
  }
}

/** The text of the first QR code the native detector finds in an image or video frame, or null. */
export async function detectNative(detector: NativeDetector, source: ImageBitmapSource): Promise<string | null> {
  try {
    const codes = await detector.detect(source)
    return codes.find((code) => code.rawValue)?.rawValue ?? null
  } catch {
    return null
  }
}

/** Decodes a QR code from an image file such as a screenshot. Throws if the file is not a readable image. */
export async function decodeQrFromFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file)
  try {
    const native = await createNativeDetector()
    if (native) {
      const found = await detectNative(native, bitmap)
      if (found) return found
    }
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas is not available')
    context.drawImage(bitmap, 0, 0, width, height)
    return decodeQr(context.getImageData(0, 0, width, height).data, width, height)
  } finally {
    bitmap.close()
  }
}
