import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { clearVault, getAccounts, getAllSecrets, getMeta } from '../storage/vaultStore'
import { PBKDF2_ITERATIONS, deriveKey, randomSalt } from './crypto'
import { addAccount, attemptUnlock, isVaultSetUp, readSecret, setupVault } from './vault'

const SECRET = 'JBSWY3DPEHPK3PXP'
const PIN = '482915'
const input = { issuer: 'Demo', label: 'alice', secret: SECRET, algorithm: 'SHA1', digits: 6, period: 30 } as const

describe('vault setup and storage', () => {
  beforeEach(clearVault)

  it('sets up with production-strength parameters and stores no PIN material in the clear', async () => {
    expect(await isVaultSetUp()).toBe(false)
    await setupVault(PIN)
    expect(await isVaultSetUp()).toBe(true)

    const meta = await getMeta()
    expect(meta).toMatchObject({ iterations: PBKDF2_ITERATIONS, failedAttempts: 0, lockedUntil: null })
    expect(JSON.stringify(meta)).not.toContain(PIN)
  })

  it('rejects short PINs and a second setup', async () => {
    await expect(setupVault('12345')).rejects.toThrow('at least 6')
    await setupVault(PIN)
    await expect(setupVault(PIN)).rejects.toThrow('already exists')
  })

  it('stores accounts with the secret encrypted at rest and reads it back with the key', async () => {
    const key = await setupVault(PIN)
    const account = await addAccount(key, input)

    expect(account).toMatchObject({ issuer: 'Demo', label: 'alice', digits: 6, period: 30 })
    expect(account).not.toHaveProperty('secret')

    const persisted = JSON.stringify([await getAccounts(), await getAllSecrets()])
    expect(persisted).not.toContain(SECRET)

    const result = await attemptUnlock(PIN)
    expect(result.status).toBe('unlocked')
    if (result.status === 'unlocked') expect(await readSecret(result.key, account.id)).toBe(SECRET)
  })

  it('puts each new account after the existing ones', async () => {
    const key = await setupVault(PIN)
    const first = await addAccount(key, input)
    const second = await addAccount(key, { ...input, label: 'bob' })
    expect([first.sortOrder, second.sortOrder]).toEqual([1, 2])
  })

  it('cannot read a secret with a key derived from the same PIN but a different salt', async () => {
    const key = await setupVault(PIN)
    const account = await addAccount(key, input)
    const otherKey = await deriveKey(PIN, randomSalt(), PBKDF2_ITERATIONS)
    await expect(readSecret(otherKey, account.id)).rejects.toThrow()
  })

  it('reports a missing secret', async () => {
    const key = await setupVault(PIN)
    await expect(readSecret(key, 'nope')).rejects.toThrow('not found')
  })
})

describe('attemptUnlock', () => {
  const T0 = 1_700_000_000_000

  beforeEach(async () => {
    await clearVault()
    await setupVault(PIN)
  })

  it('refuses to unlock before setup', async () => {
    await clearVault()
    await expect(attemptUnlock(PIN)).rejects.toThrow('No vault')
  })

  it('unlocks with the right PIN', async () => {
    expect((await attemptUnlock(PIN, T0)).status).toBe('unlocked')
  })

  it('counts wrong PINs and only starts the delay after three', async () => {
    expect(await attemptUnlock('000000', T0)).toEqual({ status: 'wrong-pin', failedAttempts: 1, lockedUntil: null })
    expect(await attemptUnlock('000000', T0)).toEqual({ status: 'wrong-pin', failedAttempts: 2, lockedUntil: null })
    expect(await attemptUnlock('000000', T0)).toEqual({ status: 'wrong-pin', failedAttempts: 3, lockedUntil: T0 + 30_000 })
    expect(await getMeta()).toMatchObject({ failedAttempts: 3, lockedUntil: T0 + 30_000 })
  })

  it('refuses even the right PIN while locked, then accepts it once the delay passes', async () => {
    for (let i = 0; i < 3; i++) await attemptUnlock('000000', T0)

    expect(await attemptUnlock(PIN, T0 + 10_000)).toEqual({ status: 'locked', lockedUntil: T0 + 30_000 })
    expect((await attemptUnlock(PIN, T0 + 30_001)).status).toBe('unlocked')
  })

  it('escalates the delay on further failures and resets everything on success', async () => {
    for (let i = 0; i < 3; i++) await attemptUnlock('000000', T0)
    const later = T0 + 30_001
    expect(await attemptUnlock('000000', later)).toMatchObject({ failedAttempts: 4, lockedUntil: later + 60_000 })

    await attemptUnlock(PIN, later + 60_001)
    expect(await getMeta()).toMatchObject({ failedAttempts: 0, lockedUntil: null })
  })
})
