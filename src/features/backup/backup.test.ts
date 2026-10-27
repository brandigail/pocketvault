import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { clearVault, getAccounts, updateAccount } from '../storage/vaultStore'
import { addAccount, readSecret, setupVault, verifyPin } from '../vault/vault'
import { createBackup, importAccounts, openBackup } from './backup'
import { parseBackupFile } from './backupFormat'

const PASSWORD = 'correct horse battery'
const FAST = 100_000 // the lowest cost a backup file may declare; keeps the suite quick
const base = { algorithm: 'SHA1', digits: 6, period: 30 } as const

async function seedVault(pin: string): Promise<CryptoKey> {
  const key = await setupVault(pin)
  await addAccount(key, { ...base, issuer: 'GitHub', label: 'octocat', secret: 'JBSWY3DPEHPK3PXP' })
  await addAccount(key, { ...base, issuer: 'Bank', label: 'me', secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', digits: 8, algorithm: 'SHA256', period: 60 })
  await addAccount(key, { ...base, issuer: 'Legacy', label: 'hw', secret: 'MFRGGZDFMZTWQ2LK', type: 'hotp', counter: 9, folder: 'Work' })
  return key
}

describe('backup', () => {
  beforeEach(clearVault)

  it('restores every account, with secrets, settings, counters and folders, into a brand new vault', async () => {
    const original = await seedVault('482915')
    const { file, count } = await createBackup(original, PASSWORD, FAST)
    expect(count).toBe(3)
    const text = JSON.stringify(file)

    await clearVault()
    const fresh = await setupVault('another-pin-1')
    const summary = await importAccounts(fresh, await openBackup(text, PASSWORD))
    expect(summary).toEqual({ added: 3, skipped: 0 })

    const restored = [...(await getAccounts())].sort((a, b) => a.sortOrder - b.sortOrder)
    expect(restored.map((a) => a.issuer)).toEqual(['GitHub', 'Bank', 'Legacy'])
    const bank = restored.find((a) => a.issuer === 'Bank')
    expect(bank).toMatchObject({ digits: 8, algorithm: 'SHA256', period: 60 })
    const legacy = restored.find((a) => a.issuer === 'Legacy')
    expect(legacy).toMatchObject({ type: 'hotp', counter: 9, folder: 'Work' })
    expect(await readSecret(fresh, bank?.id ?? '')).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')
  })

  it('keeps names and secrets out of the file entirely', async () => {
    const key = await seedVault('482915')
    const text = JSON.stringify((await createBackup(key, PASSWORD, FAST)).file)
    for (const secret of ['JBSWY3DPEHPK3PXP', 'GitHub', 'octocat', 'Bank', 'Work', PASSWORD]) expect(text).not.toContain(secret)
    expect(Object.keys(JSON.parse(text)).sort()).toEqual(['ciphertext', 'format', 'iterations', 'iv', 'salt', 'version'])
  })

  it('uses a fresh salt and IV every time', async () => {
    const key = await seedVault('482915')
    const a = (await createBackup(key, PASSWORD, FAST)).file
    const b = (await createBackup(key, PASSWORD, FAST)).file
    expect(a.salt).not.toBe(b.salt)
    expect(a.iv).not.toBe(b.iv)
    expect(a.ciphertext).not.toBe(b.ciphertext)
  })

  it('rejects a short backup password before doing any work', async () => {
    const key = await seedVault('482915')
    await expect(createBackup(key, 'short', FAST)).rejects.toThrow('at least 10')
  })

  it('refuses the wrong password', async () => {
    const key = await seedVault('482915')
    const text = JSON.stringify((await createBackup(key, PASSWORD, FAST)).file)
    await expect(openBackup(text, 'not the password!')).rejects.toThrow('Wrong password')
  })

  it('refuses a tampered file', async () => {
    const key = await seedVault('482915')
    const { file } = await createBackup(key, PASSWORD, FAST)
    const flipped = file.ciphertext.startsWith('A') ? `B${file.ciphertext.slice(1)}` : `A${file.ciphertext.slice(1)}`
    await expect(openBackup(JSON.stringify({ ...file, ciphertext: flipped }), PASSWORD)).rejects.toThrow('Wrong password')
  })

  it('does not accept a backup whose cost parameter was changed', async () => {
    const key = await seedVault('482915')
    const { file } = await createBackup(key, PASSWORD, FAST)
    await expect(openBackup(JSON.stringify({ ...file, iterations: FAST + 1 }), PASSWORD)).rejects.toThrow('Wrong password')
  })

  it('skips accounts that are already in the vault, so importing twice changes nothing', async () => {
    const key = await seedVault('482915')
    const incoming = await openBackup(JSON.stringify((await createBackup(key, PASSWORD, FAST)).file), PASSWORD)
    expect(await importAccounts(key, incoming)).toEqual({ added: 0, skipped: 3 })
    expect(await getAccounts()).toHaveLength(3)
  })

  it('adds only the missing accounts and reuses the spelling of an existing folder', async () => {
    const key = await seedVault('482915')
    const incoming = await openBackup(JSON.stringify((await createBackup(key, PASSWORD, FAST)).file), PASSWORD)
    const extra = { ...base, issuer: 'Extra', label: 'x', secret: 'MFRGGZDFMZTWQ2LK', folder: 'work' }
    expect(await importAccounts(key, [...incoming, extra, extra])).toEqual({ added: 1, skipped: 4 })
    expect((await getAccounts()).find((a) => a.issuer === 'Extra')?.folder).toBe('Work')
  })

  it('treats a renamed account with the same secret as a different account', async () => {
    const key = await seedVault('482915')
    const incoming = await openBackup(JSON.stringify((await createBackup(key, PASSWORD, FAST)).file), PASSWORD)
    const [first] = await getAccounts()
    if (first) await updateAccount({ ...first, label: 'renamed' })
    expect((await importAccounts(key, incoming)).added).toBe(1)
  })
})

describe('parseBackupFile', () => {
  const good = { format: 'pocketvault-backup', version: 1, iterations: 600000, salt: 'c2FsdA==', iv: 'aXY=', ciphertext: 'Y3Q=' }

  it('accepts a well-formed file', () => {
    expect(parseBackupFile(JSON.stringify(good))).toEqual(good)
  })

  it.each([
    ['not json', 'hello', 'not a PocketVault backup'],
    ['json of the wrong kind', '{"a":1}', 'not a PocketVault backup'],
    ['an array', '[]', 'not a PocketVault backup'],
    ['a newer version', JSON.stringify({ ...good, version: 2 }), 'newer version'],
    ['missing fields', JSON.stringify({ ...good, salt: undefined }), 'damaged'],
    ['an absurdly high cost', JSON.stringify({ ...good, iterations: 2_000_000_000 }), 'damaged'],
    ['a trivially low cost', JSON.stringify({ ...good, iterations: 1 }), 'damaged'],
  ])('rejects %s', (_name, text, message) => {
    expect(() => parseBackupFile(text)).toThrow(message)
  })
})

describe('verifyPin', () => {
  beforeEach(clearVault)

  it('confirms the right PIN and refuses a wrong one without touching the lockout counters', async () => {
    await setupVault('482915')
    expect(await verifyPin('482915')).toBe(true)
    expect(await verifyPin('000000')).toBe(false)
    expect(await verifyPin('000000')).toBe(false)
    const { getMeta } = await import('../storage/vaultStore')
    expect((await getMeta())?.failedAttempts).toBe(0)
  })
})
