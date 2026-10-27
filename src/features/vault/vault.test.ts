import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { clearVault, getAccounts, getAllSecrets, getMeta } from '../storage/vaultStore'
import { PBKDF2_ITERATIONS, deriveKey, randomSalt } from './crypto'
import { addAccount, isVaultSetUp, readSecret, setupVault, unlockVault } from './vault'

const SECRET = 'JBSWY3DPEHPK3PXP'
const input = { issuer: 'Demo', label: 'alice', secret: SECRET, algorithm: 'SHA1', digits: 6, period: 30 } as const

describe('vault', () => {
  beforeEach(clearVault)

  it('sets up with production-strength parameters and stores no PIN material in the clear', async () => {
    expect(await isVaultSetUp()).toBe(false)
    await setupVault('482915')
    expect(await isVaultSetUp()).toBe(true)

    const meta = await getMeta()
    expect(meta).toMatchObject({ iterations: PBKDF2_ITERATIONS, failedAttempts: 0, lockedUntil: null })
    expect(JSON.stringify(meta)).not.toContain('482915')
  })

  it('rejects short PINs and a second setup', async () => {
    await expect(setupVault('12345')).rejects.toThrow('at least 6')
    await setupVault('482915')
    await expect(setupVault('482915')).rejects.toThrow('already exists')
  })

  it('unlocks with the right PIN and returns null for a wrong one', async () => {
    await setupVault('482915')
    expect(await unlockVault('482915')).not.toBeNull()
    expect(await unlockVault('111111')).toBeNull()
  })

  it('refuses to unlock before setup', async () => {
    await expect(unlockVault('482915')).rejects.toThrow('No vault')
  })

  it('stores accounts with the secret encrypted at rest and reads it back with the key', async () => {
    const key = await setupVault('482915')
    const account = await addAccount(key, input)

    expect(account).toMatchObject({ issuer: 'Demo', label: 'alice', digits: 6, period: 30 })
    expect(account).not.toHaveProperty('secret')

    const persisted = JSON.stringify([await getAccounts(), await getAllSecrets()])
    expect(persisted).not.toContain(SECRET)

    const unlocked = await unlockVault('482915')
    expect(unlocked && (await readSecret(unlocked, account.id))).toBe(SECRET)
  })

  it('cannot read a secret with a key derived from the same PIN but a different salt', async () => {
    const key = await setupVault('482915')
    const account = await addAccount(key, input)
    const otherKey = await deriveKey('482915', randomSalt(), PBKDF2_ITERATIONS)
    await expect(readSecret(otherKey, account.id)).rejects.toThrow()
  })

  it('reports a missing secret', async () => {
    const key = await setupVault('482915')
    await expect(readSecret(key, 'nope')).rejects.toThrow('not found')
  })
})
