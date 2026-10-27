import { describe, expect, it } from 'vitest'
import type { TotpAlgorithm } from '../../types'
import { formatCode, generateTotp, importHmacKey, secondsRemaining } from './totp'

// RFC 6238 Appendix B. Each algorithm uses its own ASCII seed, 8 digits, 30 s period.
const SEEDS: Record<TotpAlgorithm, string> = {
  SHA1: '12345678901234567890',
  SHA256: '12345678901234567890123456789012',
  SHA512: '1234567890123456789012345678901234567890123456789012345678901234',
}

const VECTORS: [number, string, string, string][] = [
  // [unix seconds, SHA1, SHA256, SHA512]
  [59, '94287082', '46119246', '90693936'],
  [1111111109, '07081804', '68084774', '25091201'],
  [1111111111, '14050471', '67062674', '99943326'],
  [1234567890, '89005924', '91819424', '93441116'],
  [2000000000, '69279037', '90698825', '38618901'],
  [20000000000, '65353130', '77737706', '47863826'],
]

async function codeAt(algorithm: TotpAlgorithm, digits: 6 | 8, timestampMs: number): Promise<string> {
  const key = await importHmacKey(new TextEncoder().encode(SEEDS[algorithm]), algorithm)
  return generateTotp(key, digits, 30, timestampMs)
}

describe('generateTotp (RFC 6238 vectors)', () => {
  for (const [seconds, sha1, sha256, sha512] of VECTORS) {
    it(`matches at T=${seconds}`, async () => {
      expect(await codeAt('SHA1', 8, seconds * 1000)).toBe(sha1)
      expect(await codeAt('SHA256', 8, seconds * 1000)).toBe(sha256)
      expect(await codeAt('SHA512', 8, seconds * 1000)).toBe(sha512)
    })
  }

  it('produces 6 digits as the last 6 of the 8-digit code, keeping leading zeros', async () => {
    expect(await codeAt('SHA1', 6, 1111111109 * 1000)).toBe('081804')
  })

  it('stays constant inside a period and changes at the boundary', async () => {
    expect(await codeAt('SHA1', 6, 30_000)).toBe(await codeAt('SHA1', 6, 59_999))
    expect(await codeAt('SHA1', 6, 59_999)).not.toBe(await codeAt('SHA1', 6, 60_000))
  })

  it('uses a key that cannot be exported', async () => {
    const key = await importHmacKey(new TextEncoder().encode(SEEDS.SHA1), 'SHA1')
    expect(key.extractable).toBe(false)
  })
})

describe('secondsRemaining', () => {
  it('counts down within the period', () => {
    expect(secondsRemaining(30, 0)).toBe(30)
    expect(secondsRemaining(30, 1_000)).toBe(29)
    expect(secondsRemaining(30, 29_999)).toBe(1)
    expect(secondsRemaining(30, 30_000)).toBe(30)
  })
})

describe('formatCode', () => {
  it('splits 6 and 8 digit codes in half', () => {
    expect(formatCode('081804')).toBe('081 804')
    expect(formatCode('94287082')).toBe('9428 7082')
  })
})
