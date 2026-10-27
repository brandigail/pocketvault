import type { TotpAlgorithm } from '../../types'

const HASH_NAMES: Record<TotpAlgorithm, string> = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA512: 'SHA-512',
}

/** Imports the secret as a non-extractable HMAC key, so the raw bytes need not be kept around to generate codes. */
export function importHmacKey(secret: Uint8Array<ArrayBuffer>, algorithm: TotpAlgorithm): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: HASH_NAMES[algorithm] }, false, ['sign'])
}

/** RFC 4226 HOTP: HMAC over the 8-byte counter, then dynamic truncation. */
export async function generateHotp(key: CryptoKey, digits: 6 | 8, counter: number): Promise<string> {
  const message = new ArrayBuffer(8)
  new DataView(message).setBigUint64(0, BigInt(counter))

  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, message))
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f
  const binary = new DataView(hmac.buffer, offset, 4).getUint32(0) & 0x7fffffff
  return (binary % 10 ** digits).toString().padStart(digits, '0')
}

/** RFC 6238 TOTP: HOTP over the current time step. `timestamp` is Unix time in milliseconds. */
export function generateTotp(key: CryptoKey, digits: 6 | 8, period: number, timestamp: number): Promise<string> {
  return generateHotp(key, digits, Math.floor(timestamp / 1000 / period))
}

/** Whole seconds until the current code rolls over. Always between 1 and `period`. */
export function secondsRemaining(period: number, timestamp: number): number {
  return period - (Math.floor(timestamp / 1000) % period)
}

/** Groups digits for readability: "123 456" or "1234 5678". */
export function formatCode(code: string): string {
  const half = code.length / 2
  return `${code.slice(0, half)} ${code.slice(half)}`
}
