import { describe, expect, it } from 'vitest'
import { parseOtpauthUri } from './otpauth'

const SECRET = 'JBSWY3DPEHPK3PXP'

describe('parseOtpauthUri', () => {
  it('parses a typical Google Authenticator URI with defaults', () => {
    expect(parseOtpauthUri(`otpauth://totp/Example:alice@example.com?secret=${SECRET}&issuer=Example`)).toEqual({
      issuer: 'Example',
      label: 'alice@example.com',
      secret: SECRET,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })
  })

  it('reads explicit algorithm, digits and period', () => {
    const parsed = parseOtpauthUri(`otpauth://totp/Bank:me?secret=${SECRET}&algorithm=sha256&digits=8&period=60`)
    expect(parsed).toMatchObject({ algorithm: 'SHA256', digits: 8, period: 60 })
  })

  it('takes the issuer from the label prefix when the parameter is absent', () => {
    const parsed = parseOtpauthUri(`otpauth://totp/Acme%20Corp:bob?secret=${SECRET}`)
    expect(parsed).toMatchObject({ issuer: 'Acme Corp', label: 'bob' })
  })

  it('prefers the issuer parameter and handles encoded colons and spaces', () => {
    const parsed = parseOtpauthUri(`otpauth://totp/Old%3A%20carol?secret=${SECRET}&issuer=New`)
    expect(parsed).toMatchObject({ issuer: 'New', label: 'carol' })
  })

  it('accepts a label with no issuer', () => {
    expect(parseOtpauthUri(`otpauth://totp/dave?secret=${SECRET}`)).toMatchObject({ issuer: '', label: 'dave' })
  })

  it('normalizes a spaced, lowercase secret and trims surrounding whitespace', () => {
    const parsed = parseOtpauthUri(`  otpauth://totp/X:y?secret=jbsw%20y3dp%20ehpk%203pxp  \n`)
    expect(parsed.secret).toBe(SECRET)
  })

  it('rejects non-otpauth input', () => {
    expect(() => parseOtpauthUri('hello')).toThrow('valid otpauth')
    expect(() => parseOtpauthUri('https://example.com')).toThrow('Not an otpauth link')
  })

  it('rejects HOTP with a specific message', () => {
    expect(() => parseOtpauthUri(`otpauth://hotp/X:y?secret=${SECRET}&counter=1`)).toThrow('HOTP')
  })

  it('rejects a missing or invalid secret', () => {
    expect(() => parseOtpauthUri('otpauth://totp/X:y')).toThrow('no secret')
    expect(() => parseOtpauthUri('otpauth://totp/X:y?secret=not-valid-1')).toThrow('Invalid Base32')
  })

  it('rejects unsupported parameters', () => {
    expect(() => parseOtpauthUri(`otpauth://totp/X:y?secret=${SECRET}&algorithm=MD5`)).toThrow('Unsupported algorithm')
    expect(() => parseOtpauthUri(`otpauth://totp/X:y?secret=${SECRET}&digits=7`)).toThrow('Digits')
    expect(() => parseOtpauthUri(`otpauth://totp/X:y?secret=${SECRET}&period=0`)).toThrow('Period')
    expect(() => parseOtpauthUri(`otpauth://totp/X:y?secret=${SECRET}&period=abc`)).toThrow('Period')
  })

  it('rejects a link with no account name', () => {
    expect(() => parseOtpauthUri(`otpauth://totp/?secret=${SECRET}`)).toThrow('no account name')
  })
})
