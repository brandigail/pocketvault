import type { OtpType, TotpAlgorithm } from '../../types'
import { decodeBase32, normalizeBase32 } from '../totp/base32'
import { parseCounter, parsePeriod } from '../totp/otpauth'
import { normalizeFolder } from '../accounts/filter'

export const BACKUP_FORMAT = 'pocketvault-backup'
export const BACKUP_VERSION = 1
/** Authenticated with the ciphertext, so a backup cannot be passed off as some other kind of encrypted data. */
export const BACKUP_CONTEXT = 'pocketvault-backup-v1'
export const BACKUP_MIN_PASSWORD = 10
/** A backup file is untrusted input: refuse key-stretching costs far above anything we write ourselves. */
const MAX_ITERATIONS = 5_000_000
const MIN_ITERATIONS = 100_000

/** The outer, readable part of a backup file. Everything about the accounts is inside `ciphertext`. */
export interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

/** One account as stored inside the encrypted payload, with its secret in plain Base32. */
export interface BackupAccount {
  issuer: string
  label: string
  secret: string
  algorithm: TotpAlgorithm
  digits: 6 | 8
  period: number
  type?: OtpType
  counter?: number
  folder?: string
}

const ALGORITHMS: readonly TotpAlgorithm[] = ['SHA1', 'SHA256', 'SHA512']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Reads the outer layer of a backup file. Throws an Error with a user-readable message. */
export function parseBackupFile(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That is not a PocketVault backup file')
  }
  if (!isRecord(data) || data.format !== BACKUP_FORMAT) throw new Error('That is not a PocketVault backup file')
  if (typeof data.version === 'number' && data.version > BACKUP_VERSION) throw new Error('This backup was made by a newer version of PocketVault')
  const { version, iterations, salt, iv, ciphertext } = data
  if (
    version !== BACKUP_VERSION ||
    typeof iterations !== 'number' ||
    !Number.isInteger(iterations) ||
    typeof salt !== 'string' ||
    typeof iv !== 'string' ||
    typeof ciphertext !== 'string'
  ) {
    throw new Error('The backup file is damaged')
  }
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) throw new Error('The backup file is damaged')
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, iterations, salt, iv, ciphertext }
}

/** Checks and cleans the decrypted payload. Throws an Error with a user-readable message. */
export function parseBackupPayload(text: string): BackupAccount[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('The backup file is damaged')
  }
  if (!isRecord(data) || !Array.isArray(data.accounts)) throw new Error('The backup file is damaged')
  return data.accounts.map(parseAccount)
}

function parseAccount(value: unknown): BackupAccount {
  if (!isRecord(value)) throw new Error('The backup contains an account that cannot be read')
  const { issuer, label, secret, algorithm, digits, period, type, counter, folder } = value
  if (typeof issuer !== 'string' || typeof label !== 'string' || typeof secret !== 'string') {
    throw new Error('The backup contains an account that cannot be read')
  }
  if (!issuer.trim() && !label.trim()) throw new Error('The backup contains an account with no name')
  decodeBase32(secret) // throws a readable error if the secret is not valid Base32
  const knownAlgorithm = ALGORITHMS.find((candidate) => candidate === algorithm)
  if (!knownAlgorithm) throw new Error('The backup contains an unsupported algorithm')
  if (digits !== 6 && digits !== 8) throw new Error('The backup contains an account with unsupported digits')

  const account: BackupAccount = {
    issuer: issuer.trim(),
    label: label.trim(),
    secret: normalizeBase32(secret),
    algorithm: knownAlgorithm,
    digits,
    period: parsePeriod(String(period)),
  }
  if (type === 'hotp') {
    account.type = 'hotp'
    account.counter = parseCounter(String(counter))
  } else if (type !== undefined && type !== 'totp') {
    throw new Error('The backup contains an unsupported account type')
  }
  const cleanFolder = typeof folder === 'string' ? normalizeFolder(folder) : undefined
  if (cleanFolder) account.folder = cleanFolder
  return account
}
