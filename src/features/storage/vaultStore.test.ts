import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { StoredSecret, TokenAccount, VaultMeta } from '../../types'
import { clearVault, deleteAccount, getAccounts, getAllSecrets, getMeta, getSecret, saveAccount, saveMeta, updateAccount } from './vaultStore'

const account = (id: string): TokenAccount => ({
  id,
  issuer: 'Demo',
  label: `user-${id}`,
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  createdAt: '2026-01-01T00:00:00.000Z',
})
const secret = (accountId: string): StoredSecret => ({ accountId, ciphertext: 'Y2lwaGVy', iv: 'aXY=' })
const meta: VaultMeta = { salt: 'c2FsdA==', iterations: 600000, verifier: 'dmVy', failedAttempts: 0, lockedUntil: null }

describe('vaultStore', () => {
  beforeEach(clearVault)

  it('saves and reads an account with its secret', async () => {
    await saveAccount(account('a'), secret('a'))
    expect(await getAccounts()).toEqual([account('a')])
    expect(await getSecret('a')).toEqual(secret('a'))
    expect(await getAllSecrets()).toHaveLength(1)
  })

  it('updates account details without touching the secret', async () => {
    await saveAccount(account('a'), secret('a'))
    await updateAccount({ ...account('a'), label: 'renamed' })
    expect((await getAccounts())[0]?.label).toBe('renamed')
    expect(await getSecret('a')).toEqual(secret('a'))
  })

  it('deletes the account and its secret together', async () => {
    await saveAccount(account('a'), secret('a'))
    await saveAccount(account('b'), secret('b'))
    await deleteAccount('a')
    expect((await getAccounts()).map((a) => a.id)).toEqual(['b'])
    expect(await getSecret('a')).toBeUndefined()
  })

  it('persists vault meta and returns undefined before setup', async () => {
    expect(await getMeta()).toBeUndefined()
    await saveMeta(meta)
    expect(await getMeta()).toEqual(meta)
  })

  it('clearVault removes everything', async () => {
    await saveAccount(account('a'), secret('a'))
    await saveMeta(meta)
    await clearVault()
    expect(await getAccounts()).toEqual([])
    expect(await getAllSecrets()).toEqual([])
    expect(await getMeta()).toBeUndefined()
  })
})
