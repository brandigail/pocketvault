import type { TokenAccount } from '../../types'
import type { ParsedOtpauth } from '../totp/otpauth'
import { getAccounts, getMeta, getSecret, saveAccount, saveMeta } from '../storage/vaultStore'
import { PBKDF2_ITERATIONS, checkVerifier, createVerifier, decryptText, deriveKey, encryptText, randomSalt } from './crypto'
import { lockoutDelayMs } from './lockout'

export const MIN_PIN_LENGTH = 6

export async function isVaultSetUp(): Promise<boolean> {
  return (await getMeta()) !== undefined
}

/** Creates the vault for a new PIN and returns the unlocked key. Throws if a vault already exists. */
export async function setupVault(pin: string): Promise<CryptoKey> {
  if (pin.length < MIN_PIN_LENGTH) throw new Error(`PIN must be at least ${MIN_PIN_LENGTH} characters`)
  if (await isVaultSetUp()) throw new Error('A vault already exists')

  const salt = randomSalt()
  const key = await deriveKey(pin, salt, PBKDF2_ITERATIONS)
  await saveMeta({
    salt,
    iterations: PBKDF2_ITERATIONS,
    verifier: await createVerifier(key),
    failedAttempts: 0,
    lockedUntil: null,
  })
  return key
}

export type UnlockResult =
  | { status: 'unlocked'; key: CryptoKey }
  | { status: 'wrong-pin'; failedAttempts: number; lockedUntil: number | null }
  | { status: 'locked'; lockedUntil: number }

/**
 * Tries a PIN. Refuses while a lockout is active (before spending any work on key derivation),
 * counts failures in the persisted vault meta and escalates the delay; a success resets both.
 */
export async function attemptUnlock(pin: string, now = Date.now()): Promise<UnlockResult> {
  const meta = await getMeta()
  if (!meta) throw new Error('No vault has been set up')
  if (meta.lockedUntil !== null && meta.lockedUntil > now) return { status: 'locked', lockedUntil: meta.lockedUntil }

  const key = await deriveKey(pin, meta.salt, meta.iterations)
  if (await checkVerifier(key, meta.verifier)) {
    if (meta.failedAttempts > 0 || meta.lockedUntil !== null) await saveMeta({ ...meta, failedAttempts: 0, lockedUntil: null })
    return { status: 'unlocked', key }
  }

  const failedAttempts = meta.failedAttempts + 1
  const delay = lockoutDelayMs(failedAttempts)
  const lockedUntil = delay > 0 ? now + delay : null
  await saveMeta({ ...meta, failedAttempts, lockedUntil })
  return { status: 'wrong-pin', failedAttempts, lockedUntil }
}

/**
 * Checks a PIN without touching the lockout counters. For re-confirming the PIN inside an unlocked session
 * (before exporting secrets); the unlock screen uses attemptUnlock, which enforces the lockout.
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const meta = await getMeta()
  if (!meta) return false
  return checkVerifier(await deriveKey(pin, meta.salt, meta.iterations), meta.verifier)
}

/** Encrypts the secret and stores the account. The plaintext secret is never written anywhere. */
/** What addAccount needs: the parsed link or form values, plus an optional folder. */
export type NewAccount = ParsedOtpauth & { folder?: string }

export async function addAccount(key: CryptoKey, input: NewAccount): Promise<TokenAccount> {
  const { secret, ...details } = input
  const sortOrder = (await getAccounts()).reduce((max, existing) => Math.max(max, existing.sortOrder ?? 0), 0) + 1
  const account: TokenAccount = { id: crypto.randomUUID(), ...details, createdAt: new Date().toISOString(), sortOrder }
  const { ciphertext, iv } = await encryptText(key, secret, account.id)
  await saveAccount(account, { accountId: account.id, ciphertext, iv })
  return account
}

/** Decrypts one account's Base32 secret. Callers should keep the result only as long as needed. */
export async function readSecret(key: CryptoKey, accountId: string): Promise<string> {
  const stored = await getSecret(accountId)
  if (!stored) throw new Error('Secret not found')
  return decryptText(key, stored, accountId)
}
