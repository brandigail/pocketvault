import type { BiometricRecord } from '../../types'
import { fromBase64, toBase64 } from '../vault/base64'
import { decryptText, encryptText, importVaultKey } from '../vault/crypto'

const BIOMETRIC_CONTEXT = 'pocketvault-biometric-v1'
/** WebAuthn PRF output is 32 random-looking bytes, the exact size of an AES-256 key. */
const PRF_BYTES = 32

type KeyFields = Pick<BiometricRecord, 'ciphertext' | 'iv'>

function wrappingKey(prfOutput: ArrayBuffer): Promise<CryptoKey> {
  if (prfOutput.byteLength !== PRF_BYTES) throw new Error('The authenticator returned an unexpected result')
  return crypto.subtle.importKey('raw', prfOutput, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

/** Encrypts the raw vault key under a key derived from the authenticator's PRF output. */
export async function sealVaultKey(prfOutput: ArrayBuffer, vaultKeyBytes: Uint8Array): Promise<KeyFields> {
  return encryptText(await wrappingKey(prfOutput), toBase64(vaultKeyBytes), BIOMETRIC_CONTEXT)
}

/** Recovers the vault key as a non-extractable key. Throws if the PRF output is not the one that sealed it. */
export async function openVaultKey(prfOutput: ArrayBuffer, sealed: KeyFields): Promise<CryptoKey> {
  const bytes = fromBase64(await decryptText(await wrappingKey(prfOutput), sealed, BIOMETRIC_CONTEXT))
  try {
    return await importVaultKey(bytes)
  } finally {
    bytes.fill(0)
  }
}
