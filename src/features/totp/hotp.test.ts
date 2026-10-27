import { describe, expect, it } from 'vitest'
import { generateHotp, generateTotp, importHmacKey } from './totp'

const SEED = new TextEncoder().encode('12345678901234567890')

// RFC 4226 Appendix D: 6 digits, counters 0 to 9.
const RFC_4226_CODES = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489']

describe('generateHotp (RFC 4226 vectors)', () => {
  it.each(RFC_4226_CODES.map((code, counter) => [counter, code] as const))('matches at counter %i', async (counter, code) => {
    const key = await importHmacKey(SEED, 'SHA1')
    expect(await generateHotp(key, 6, counter)).toBe(code)
  })

  it('supports 8 digits', async () => {
    const key = await importHmacKey(SEED, 'SHA1')
    // RFC 4226 counter 0 truncates to 1284755224 before the modulus.
    expect(await generateHotp(key, 8, 0)).toBe('84755224')
  })

  it('is what TOTP is built on: the time step is the counter', async () => {
    const key = await importHmacKey(SEED, 'SHA1')
    expect(await generateTotp(key, 6, 30, 59_000)).toBe(await generateHotp(key, 6, 1))
  })
})
