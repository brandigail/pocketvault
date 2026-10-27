import QRCode from 'qrcode'
import { describe, expect, it } from 'vitest'
import { decodeQr } from './qr'

const SCALE = 6
const MARGIN = 4

/** Renders a QR code to RGBA pixels, dark modules black on white. Optionally inverted (light on dark). */
function renderQr(text: string, invert = false): { pixels: Uint8ClampedArray; size: number } {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const size = (modules.size + MARGIN * 2) * SCALE
  const pixels = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const mx = Math.floor(x / SCALE) - MARGIN
      const my = Math.floor(y / SCALE) - MARGIN
      const dark = mx >= 0 && my >= 0 && mx < modules.size && my < modules.size && modules.get(mx, my) === 1
      const value = dark !== invert ? 0 : 255
      pixels.set([value, value, value, 255], (y * size + x) * 4)
    }
  }
  return { pixels, size }
}

describe('decodeQr', () => {
  const uri = 'otpauth://totp/Demo:alice?secret=JBSWY3DPEHPK3PXP&issuer=Demo'

  it('decodes an otpauth QR code', () => {
    const { pixels, size } = renderQr(uri)
    expect(decodeQr(pixels, size, size)).toBe(uri)
  })

  it('decodes an inverted (light on dark) code', () => {
    const { pixels, size } = renderQr(uri, true)
    expect(decodeQr(pixels, size, size)).toBe(uri)
  })

  it('returns null when there is no QR code', () => {
    const size = 200
    const blank = new Uint8ClampedArray(size * size * 4).fill(255)
    expect(decodeQr(blank, size, size)).toBeNull()
  })
})
