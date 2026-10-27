import jsQR from 'jsqr'

const MAX_IMAGE_EDGE = 1200

/** True when this browser exposes a camera API. It still needs HTTPS or localhost, and the user's permission. */
export function cameraSupported(): boolean {
  return typeof navigator.mediaDevices?.getUserMedia === 'function'
}

/** Decodes a QR code from RGBA pixels, or returns null if none is found. */
export function decodeQr(pixels: Uint8ClampedArray, width: number, height: number): string | null {
  return jsQR(pixels, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null
}

/** Decodes a QR code from an image file such as a screenshot. Throws if the file is not a readable image. */
export async function decodeQrFromFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file)
  try {
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
