import { describe, expect, it } from 'vitest'
import { parseBackupPayload } from './backupFormat'

const good = { issuer: ' Acme ', label: 'me', secret: 'jbsw y3dp ehpk 3pxp', algorithm: 'SHA1', digits: 6, period: 30 }
const payload = (...accounts: unknown[]) => JSON.stringify({ accounts })

describe('parseBackupPayload', () => {
  it('cleans names and secrets and leaves plain TOTP accounts without a type', () => {
    expect(parseBackupPayload(payload(good))).toEqual([{ issuer: 'Acme', label: 'me', secret: 'JBSWY3DPEHPK3PXP', algorithm: 'SHA1', digits: 6, period: 30 }])
  })

  it('keeps HOTP counters and folders', () => {
    const [account] = parseBackupPayload(payload({ ...good, type: 'hotp', counter: 4, folder: '  Work  ' }))
    expect(account).toMatchObject({ type: 'hotp', counter: 4, folder: 'Work' })
  })

  it.each([
    ['not json', 'nope', 'damaged'],
    ['no accounts list', '{}', 'damaged'],
    ['a non-object account', payload('x'), 'cannot be read'],
    ['an account with no name', payload({ ...good, issuer: ' ', label: '' }), 'no name'],
    ['a bad secret', payload({ ...good, secret: 'not-valid-1' }), 'Invalid Base32'],
    ['an unknown algorithm', payload({ ...good, algorithm: 'MD5' }), 'algorithm'],
    ['unsupported digits', payload({ ...good, digits: 7 }), 'digits'],
    ['a bad period', payload({ ...good, period: 0 }), 'Period'],
    ['an unknown type', payload({ ...good, type: 'steam' }), 'type'],
    ['an HOTP account without a counter', payload({ ...good, type: 'hotp' }), 'counter'],
  ])('rejects %s', (_name, text, message) => {
    expect(() => parseBackupPayload(text)).toThrow(message)
  })
})
