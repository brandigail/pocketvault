import { folderNames, normalizeFolder } from '../accounts/filter'
import { getAccounts } from '../storage/vaultStore'
import { PBKDF2_ITERATIONS, decryptText, deriveKey, encryptText, randomSalt } from '../vault/crypto'
import { addAccount, readSecret } from '../vault/vault'
import {
  BACKUP_CONTEXT,
  BACKUP_FORMAT,
  BACKUP_MIN_PASSWORD,
  BACKUP_VERSION,
  parseBackupFile,
  parseBackupPayload,
  type BackupAccount,
  type BackupFile,
} from './backupFormat'

export interface ImportSummary {
  added: number
  skipped: number
}

function requirePassword(password: string): void {
  if (password.length < BACKUP_MIN_PASSWORD) throw new Error(`The backup password must be at least ${BACKUP_MIN_PASSWORD} characters`)
}

/**
 * Decrypts every secret with the vault key, then encrypts the lot again under a key made from the backup
 * password. The file holds no readable account details. `iterations` is only lowered by tests.
 */
export async function createBackup(vaultKey: CryptoKey, password: string, iterations = PBKDF2_ITERATIONS): Promise<{ file: BackupFile; count: number }> {
  requirePassword(password)
  const stored = [...(await getAccounts())].sort((a, b) => a.sortOrder - b.sortOrder)
  const accounts: BackupAccount[] = []
  for (const account of stored) {
    const entry: BackupAccount = {
      issuer: account.issuer,
      label: account.label,
      secret: await readSecret(vaultKey, account.id),
      algorithm: account.algorithm,
      digits: account.digits,
      period: account.period,
    }
    if (account.type === 'hotp') {
      entry.type = 'hotp'
      entry.counter = account.counter ?? 0
    }
    if (account.folder) entry.folder = account.folder
    accounts.push(entry)
  }

  const salt = randomSalt()
  const key = await deriveKey(password, salt, iterations)
  const { ciphertext, iv } = await encryptText(key, JSON.stringify({ accounts }), BACKUP_CONTEXT)
  return { file: { format: BACKUP_FORMAT, version: BACKUP_VERSION, iterations, salt, iv, ciphertext }, count: accounts.length }
}

/** Reads and decrypts a backup file's text. Throws a user-readable Error for a wrong password or a damaged file. */
export async function openBackup(text: string, password: string): Promise<BackupAccount[]> {
  const file = parseBackupFile(text)
  const key = await deriveKey(password, file.salt, file.iterations)
  let payload: string
  try {
    payload = await decryptText(key, file, BACKUP_CONTEXT)
  } catch {
    throw new Error('Wrong password, or the backup file is damaged')
  }
  return parseBackupPayload(payload)
}

const identity = (account: Pick<BackupAccount, 'issuer' | 'label' | 'secret'>) => `${account.issuer}|${account.label}|${account.secret}`.toLowerCase()

/**
 * Adds backed-up accounts that are not already in the vault. An account counts as already there when
 * its service, name and secret all match, so importing the same file twice changes nothing.
 */
export async function importAccounts(vaultKey: CryptoKey, incoming: BackupAccount[]): Promise<ImportSummary> {
  const existing = await getAccounts()
  const known = new Set<string>()
  for (const account of existing) known.add(identity({ issuer: account.issuer, label: account.label, secret: await readSecret(vaultKey, account.id) }))
  const folders = folderNames(existing)

  let added = 0
  let skipped = 0
  for (const account of incoming) {
    if (known.has(identity(account))) {
      skipped += 1
      continue
    }
    known.add(identity(account))
    const folder = account.folder ? normalizeFolder(account.folder, folders) : undefined
    if (folder && !folders.includes(folder)) folders.push(folder)
    await addAccount(vaultKey, { ...account, ...(folder ? { folder } : {}) })
    added += 1
  }
  return { added, skipped }
}
