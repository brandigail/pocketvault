import { describe, expect, it } from 'vitest'
import { toAccountInput, type ManualEntry } from './manualEntry'

const valid: ManualEntry = {
  issuer: ' Acme ',
  label: 'bob@example.com',
  secret: 'jbsw y3dp ehpk 3pxp',
  algorithm: 'SHA1',
  digits: 6,
  period: '30',
  type: 'totp',
  counter: '0',
}

describe('toAccountInput', () => {
  it('trims names, normalizes the secret and parses the period', () => {
    expect(toAccountInput(valid)).toEqual({
      issuer: 'Acme',
      label: 'bob@example.com',
      secret: 'JBSWY3DPEHPK3PXP',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })
  })

  it('accepts an issuer or a label alone', () => {
    expect(toAccountInput({ ...valid, label: '' }).issuer).toBe('Acme')
    expect(toAccountInput({ ...valid, issuer: '' }).label).toBe('bob@example.com')
  })

  it('requires a name', () => {
    expect(() => toAccountInput({ ...valid, issuer: ' ', label: '' })).toThrow('name')
  })

  it('rejects an empty or invalid secret', () => {
    expect(() => toAccountInput({ ...valid, secret: '  ' })).toThrow('empty')
    expect(() => toAccountInput({ ...valid, secret: 'abc1' })).toThrow('Invalid Base32')
  })

  it('rejects a bad period', () => {
    for (const period of ['', '0', '301', '1.5', 'abc']) {
      expect(() => toAccountInput({ ...valid, period })).toThrow('Period')
    }
  })

  it('builds an HOTP account with its counter and ignores the period', () => {
    expect(toAccountInput({ ...valid, type: 'hotp', counter: '3', period: 'abc' })).toMatchObject({ type: 'hotp', counter: 3, period: 30 })
  })

  it('rejects a bad HOTP counter', () => {
    expect(() => toAccountInput({ ...valid, type: 'hotp', counter: '-2' })).toThrow('counter')
    expect(() => toAccountInput({ ...valid, type: 'hotp', counter: '' })).toThrow('counter')
  })
})
