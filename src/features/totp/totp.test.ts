import { describe, expect, it } from 'vitest'
import type { TotpAlgorithm } from '../../types'
import { generateTotp, secondsRemaining } from './totp'

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

const seed = (algorithm: TotpAlgorithm) => new TextEncoder().encode(SEEDS[algorithm])

describe('generateTotp (RFC 6238 vectors)', () => {
  for (const [seconds, sha1, sha256, sha512] of VECTORS) {
    it(`matches at T=${seconds}`, async () => {
      const common = { digits: 8, period: 30, timestamp: seconds * 1000 } as const
      expect(await generateTotp({ ...common, secret: seed('SHA1'), algorithm: 'SHA1' })).toBe(sha1)
      expect(await generateTotp({ ...common, secret: seed('SHA256'), algorithm: 'SHA256' })).toBe(sha256)
      expect(await generateTotp({ ...common, secret: seed('SHA512'), algorithm: 'SHA512' })).toBe(sha512)
    })
  }

  it('produces 6 digits as the last 6 of the 8-digit code, keeping leading zeros', async () => {
    const code = await generateTotp({ secret: seed('SHA1'), algorithm: 'SHA1', digits: 6, period: 30, timestamp: 1111111109 * 1000 })
    expect(code).toBe('081804')
  })

  it('stays constant inside a period and changes at the boundary', async () => {
    const at = (ms: number) => generateTotp({ secret: seed('SHA1'), algorithm: 'SHA1', digits: 6, period: 30, timestamp: ms })
    expect(await at(30_000)).toBe(await at(59_999))
    expect(await at(59_999)).not.toBe(await at(60_000))
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
