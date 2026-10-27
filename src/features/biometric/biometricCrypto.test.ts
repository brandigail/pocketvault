import { describe, expect, it } from 'vitest'
import { PBKDF2_ITERATIONS, checkVerifier, createVerifier, deriveKey, deriveKeyBytes, encryptText, decryptText, importVaultKey, randomSalt } from '../vault/crypto'
import { openVaultKey, sealVaultKey } from './biometricCrypto'

const prf = (fill: number) => new Uint8Array(32).fill(fill).buffer

describe('deriveKeyBytes', () => {
  it('produces exactly the key deriveKey produces', async () => {
    const salt = randomSalt()
    const direct = await deriveKey('482915', salt, 1000)
    const viaBytes = await importVaultKey(await deriveKeyBytes('482915', salt, 1000))
    const sealed = await encryptText(direct, 'hello', 'ctx')
    expect(await decryptText(viaBytes, sealed, 'ctx')).toBe('hello')
  })
})

describe('sealVaultKey / openVaultKey', () => {
  it('returns a working vault key when the same PRF output is presented', async () => {
    const salt = randomSalt()
    const bytes = await deriveKeyBytes('482915', salt, PBKDF2_ITERATIONS)
    const original = await importVaultKey(bytes)
    const verifier = await createVerifier(original)

    const sealed = await sealVaultKey(prf(7), bytes)
    const restored = await openVaultKey(prf(7), sealed)
    expect(await checkVerifier(restored, verifier)).toBe(true)
  })

  it('does not contain the key in the clear', async () => {
    const bytes = new Uint8Array(32).fill(0x41)
    const sealed = await sealVaultKey(prf(1), bytes)
    expect(JSON.stringify(sealed)).not.toContain(btoa(String.fromCharCode(...bytes)))
  })

  it('fails with a different PRF output, such as another credential or another person', async () => {
    const sealed = await sealVaultKey(prf(1), new Uint8Array(32).fill(9))
    await expect(openVaultKey(prf(2), sealed)).rejects.toThrow()
  })

  it('fails if the sealed data was altered', async () => {
    const sealed = await sealVaultKey(prf(1), new Uint8Array(32).fill(9))
    const flipped = sealed.ciphertext.startsWith('A') ? `B${sealed.ciphertext.slice(1)}` : `A${sealed.ciphertext.slice(1)}`
    await expect(openVaultKey(prf(1), { ...sealed, ciphertext: flipped })).rejects.toThrow()
  })

  it('refuses a PRF output of the wrong size', async () => {
    await expect(sealVaultKey(new ArrayBuffer(16), new Uint8Array(32))).rejects.toThrow('unexpected')
  })

  it('uses a fresh IV each time', async () => {
    const bytes = new Uint8Array(32).fill(3)
    const a = await sealVaultKey(prf(1), bytes)
    const b = await sealVaultKey(prf(1), bytes)
    expect(a.iv).not.toBe(b.iv)
  })
})
