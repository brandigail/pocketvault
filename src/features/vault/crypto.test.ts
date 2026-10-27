import { describe, expect, it } from 'vitest'
import { checkVerifier, createVerifier, decryptText, deriveKey, encryptText, randomSalt } from './crypto'

// Few iterations keep the suite fast; the production count is covered in vault.test.ts.
const ITERATIONS = 1000
const key = (pin: string, salt: string) => deriveKey(pin, salt, ITERATIONS)

describe('crypto', () => {
  it('round-trips text', async () => {
    const k = await key('123456', randomSalt())
    const encrypted = await encryptText(k, 'JBSWY3DPEHPK3PXP', 'acct-1')
    expect(encrypted.ciphertext).not.toContain('JBSWY3DPEHPK3PXP')
    expect(await decryptText(k, encrypted, 'acct-1')).toBe('JBSWY3DPEHPK3PXP')
  })

  it('uses a fresh IV every time', async () => {
    const k = await key('123456', randomSalt())
    const a = await encryptText(k, 'same', 'ctx')
    const b = await encryptText(k, 'same', 'ctx')
    expect(a.iv).not.toBe(b.iv)
    expect(a.ciphertext).not.toBe(b.ciphertext)
  })

  it('fails with the wrong PIN', async () => {
    const salt = randomSalt()
    const encrypted = await encryptText(await key('123456', salt), 'secret', 'ctx')
    await expect(decryptText(await key('654321', salt), encrypted, 'ctx')).rejects.toThrow()
  })

  it('fails when the ciphertext is moved to another context', async () => {
    const k = await key('123456', randomSalt())
    const encrypted = await encryptText(k, 'secret', 'acct-1')
    await expect(decryptText(k, encrypted, 'acct-2')).rejects.toThrow()
  })

  it('fails when the ciphertext is tampered with', async () => {
    const k = await key('123456', randomSalt())
    const encrypted = await encryptText(k, 'secret', 'ctx')
    const bytes = atob(encrypted.ciphertext)
    const flipped = String.fromCharCode(bytes.charCodeAt(0) ^ 1) + bytes.slice(1)
    await expect(decryptText(k, { ...encrypted, ciphertext: btoa(flipped) }, 'ctx')).rejects.toThrow()
  })

  it('derives different keys for different salts', async () => {
    const encrypted = await encryptText(await key('123456', randomSalt()), 'secret', 'ctx')
    await expect(decryptText(await key('123456', randomSalt()), encrypted, 'ctx')).rejects.toThrow()
  })

  it('verifies the right PIN and rejects a wrong one or a malformed verifier', async () => {
    const salt = randomSalt()
    const verifier = await createVerifier(await key('123456', salt))
    expect(await checkVerifier(await key('123456', salt), verifier)).toBe(true)
    expect(await checkVerifier(await key('000000', salt), verifier)).toBe(false)
    expect(await checkVerifier(await key('123456', salt), 'garbage')).toBe(false)
  })

  it('creates non-extractable keys', async () => {
    const k = await key('123456', randomSalt())
    expect(k.extractable).toBe(false)
    await expect(crypto.subtle.exportKey('raw', k)).rejects.toThrow()
  })
})
