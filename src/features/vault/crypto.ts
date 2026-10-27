import { fromBase64, toBase64 } from './base64'

export const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16
const IV_BYTES = 12
const VERIFIER_PLAINTEXT = 'pocketvault-verifier-v1'
const VERIFIER_CONTEXT = 'verifier'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export interface Encrypted {
  ciphertext: string
  iv: string
}

export function randomSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)))
}

/** Derives a non-extractable AES-GCM key from the PIN. The key must only ever live in memory. */
export async function deriveKey(pin: string, salt: string, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(salt), iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** The same 256 bits `deriveKey` turns into a key, as raw bytes. Only for wrapping; the caller must zero them. */
export async function deriveKeyBytes(pin: string, salt: string, iterations: number): Promise<Uint8Array<ArrayBuffer>> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64(salt), iterations }, material, 256)
  return new Uint8Array(bits)
}

/** Imports raw key bytes as the non-extractable vault key. */
export function importVaultKey(bytes: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

/**
 * Encrypts text with a fresh random IV. `context` is authenticated but not encrypted:
 * decryption fails if the ciphertext is presented under a different context.
 */
export async function encryptText(key: CryptoKey, plaintext: string, context: string): Promise<Encrypted> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(context) },
    key,
    encoder.encode(plaintext),
  )
  return { ciphertext: toBase64(new Uint8Array(encrypted)), iv: toBase64(iv) }
}

/** Throws if the key is wrong, the context differs, or the data was tampered with. */
export async function decryptText(key: CryptoKey, { ciphertext, iv }: Encrypted, context: string): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv), additionalData: encoder.encode(context) },
    key,
    fromBase64(ciphertext),
  )
  return decoder.decode(decrypted)
}

/** A known value encrypted with the key. Lets us check a PIN without ever storing it or a hash of it. */
export async function createVerifier(key: CryptoKey): Promise<string> {
  const { iv, ciphertext } = await encryptText(key, VERIFIER_PLAINTEXT, VERIFIER_CONTEXT)
  return `${iv}.${ciphertext}`
}

export async function checkVerifier(key: CryptoKey, verifier: string): Promise<boolean> {
  const [iv, ciphertext] = verifier.split('.')
  if (!iv || !ciphertext) return false
  try {
    return (await decryptText(key, { iv, ciphertext }, VERIFIER_CONTEXT)) === VERIFIER_PLAINTEXT
  } catch {
    return false
  }
}
