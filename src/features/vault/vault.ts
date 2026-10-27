import type { TokenAccount } from '../../types'
import type { ParsedOtpauth } from '../totp/otpauth'
import { getMeta, getSecret, saveAccount, saveMeta } from '../storage/vaultStore'
import { PBKDF2_ITERATIONS, checkVerifier, createVerifier, decryptText, deriveKey, encryptText, randomSalt } from './crypto'

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

/** Returns the key if the PIN is right, otherwise null. Lockout bookkeeping is layered on top of this. */
export async function unlockVault(pin: string): Promise<CryptoKey | null> {
  const meta = await getMeta()
  if (!meta) throw new Error('No vault has been set up')

  const key = await deriveKey(pin, meta.salt, meta.iterations)
  return (await checkVerifier(key, meta.verifier)) ? key : null
}

/** Encrypts the secret and stores the account. The plaintext secret is never written anywhere. */
export async function addAccount(key: CryptoKey, input: ParsedOtpauth): Promise<TokenAccount> {
  const { secret, ...details } = input
  const account: TokenAccount = { id: crypto.randomUUID(), ...details, createdAt: new Date().toISOString() }
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
