import type { TotpAlgorithm } from '../../types'

const HASH_NAMES: Record<TotpAlgorithm, string> = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA512: 'SHA-512',
}

export interface TotpOptions {
  secret: Uint8Array<ArrayBuffer>
  algorithm: TotpAlgorithm
  digits: 6 | 8
  period: number
  /** Unix time in milliseconds. */
  timestamp: number
}

/** RFC 6238 TOTP, built on the RFC 4226 HOTP dynamic truncation, using Web Crypto HMAC. */
export async function generateTotp({ secret, algorithm, digits, period, timestamp }: TotpOptions): Promise<string> {
  const counter = BigInt(Math.floor(timestamp / 1000 / period))
  const message = new ArrayBuffer(8)
  new DataView(message).setBigUint64(0, counter)

  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: HASH_NAMES[algorithm] }, false, ['sign'])
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, message))

  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f
  const view = new DataView(hmac.buffer, offset, 4)
  const binary = view.getUint32(0) & 0x7fffffff
  return (binary % 10 ** digits).toString().padStart(digits, '0')
}

/** Whole seconds until the current code rolls over. Always between 1 and `period`. */
export function secondsRemaining(period: number, timestamp: number): number {
  return period - (Math.floor(timestamp / 1000) % period)
}
