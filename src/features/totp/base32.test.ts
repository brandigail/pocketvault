import { describe, expect, it } from 'vitest'
import { decodeBase32 } from './base32'

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

describe('decodeBase32', () => {
  it('decodes the RFC 4648 test vectors', () => {
    expect(text(decodeBase32('MY======'))).toBe('f')
    expect(text(decodeBase32('MZXQ===='))).toBe('fo')
    expect(text(decodeBase32('MZXW6==='))).toBe('foo')
    expect(text(decodeBase32('MZXW6YQ='))).toBe('foob')
    expect(text(decodeBase32('MZXW6YTB'))).toBe('fooba')
    expect(text(decodeBase32('MZXW6YTBOI======'))).toBe('foobar')
  })

  it('accepts lowercase, spaces, dashes and missing padding', () => {
    expect(text(decodeBase32('mzxw 6ytb-oi'))).toBe('foobar')
  })

  it('decodes the RFC 6238 SHA-1 secret', () => {
    expect(text(decodeBase32('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'))).toBe('12345678901234567890')
  })

  it('rejects invalid characters and empty input', () => {
    expect(() => decodeBase32('MZXW1')).toThrow('Invalid Base32 character: 1')
    expect(() => decodeBase32('  ')).toThrow('empty')
  })
})
