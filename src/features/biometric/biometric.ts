import { clearBiometric, getBiometric, getMeta, saveBiometric, saveMeta } from '../storage/vaultStore'
import { fromBase64, toBase64 } from '../vault/base64'
import { checkVerifier, deriveKeyBytes, importVaultKey } from '../vault/crypto'
import { openVaultKey, sealVaultKey } from './biometricCrypto'

const PROMPT_TIMEOUT_MS = 60_000
const RANDOM_BYTES = 32
const UNSUPPORTED = "This device or browser can't use biometric unlock with PocketVault. Your PIN still works."

/** A message for the user for anything that can go wrong while asking the device. */
export function describeBiometricError(error: unknown): string {
  if (error instanceof DOMException) {
    // The user dismissing the prompt, or the prompt timing out, is not the same as the device lacking support.
    if (error.name === 'NotAllowedError' || error.name === 'AbortError') return 'The device check was cancelled or timed out. Try again, or use your PIN.'
    return UNSUPPORTED
  }
  return error instanceof Error ? error.message : 'Biometric unlock did not work. Use your PIN.'
}

/** True when the browser can ask for a fingerprint, face or screen lock. Says nothing yet about PRF support. */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof PublicKeyCredential === 'undefined' || !navigator.credentials) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

function random(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length))
}

/** Asks the authenticator (after fingerprint, face or screen lock) for the PRF output for this salt. */
async function prfOutput(credentialId: Uint8Array<ArrayBuffer>, prfSalt: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: random(RANDOM_BYTES),
      allowCredentials: [{ type: 'public-key', id: credentialId }],
      userVerification: 'required',
      timeout: PROMPT_TIMEOUT_MS,
      extensions: { prf: { eval: { first: prfSalt } } },
    },
  })
  const result = assertion instanceof PublicKeyCredential ? assertion.getClientExtensionResults().prf?.results?.first : undefined
  if (!result) throw new Error(UNSUPPORTED)
  return result instanceof ArrayBuffer ? result : new Uint8Array(result.buffer, result.byteOffset, result.byteLength).slice().buffer
}

/**
 * Turns biometric unlock on. The PIN is checked first, because the vault key has to be re-derived from it.
 * A new passkey is created on this device, and the vault key is stored encrypted under a secret that only
 * that passkey can produce, and only after the user passes the device's own check.
 */
export async function enableBiometric(pin: string): Promise<void> {
  const meta = await getMeta()
  if (!meta) throw new Error('No vault has been set up')

  const keyBytes = await deriveKeyBytes(pin, meta.salt, meta.iterations)
  try {
    if (!(await checkVerifier(await importVaultKey(keyBytes), meta.verifier))) throw new Error('Incorrect PIN')

    const credential = await navigator.credentials.create({
      publicKey: {
        rp: { name: 'PocketVault' },
        user: { id: random(16), name: 'PocketVault', displayName: 'PocketVault' },
        challenge: random(RANDOM_BYTES),
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
        timeout: PROMPT_TIMEOUT_MS,
        extensions: { prf: {} },
      },
    })
    if (!(credential instanceof PublicKeyCredential) || !credential.getClientExtensionResults().prf?.enabled) throw new Error(UNSUPPORTED)

    const credentialId = new Uint8Array(credential.rawId)
    const prfSalt = random(RANDOM_BYTES)
    const sealed = await sealVaultKey(await prfOutput(credentialId, prfSalt), keyBytes)
    await saveBiometric({ credentialId: toBase64(credentialId), prfSalt: toBase64(prfSalt), ...sealed })
  } finally {
    keyBytes.fill(0)
  }
}

/** Unlocks with the device check. Throws if cancelled, if the passkey is gone, or if the result is not this vault's key. */
export async function unlockWithBiometric(): Promise<CryptoKey> {
  const [record, meta] = await Promise.all([getBiometric(), getMeta()])
  if (!record || !meta) throw new Error('Biometric unlock is not set up')

  const output = await prfOutput(fromBase64(record.credentialId), fromBase64(record.prfSalt))
  const key = await openVaultKey(output, record)
  if (!(await checkVerifier(key, meta.verifier))) throw new Error('Biometric unlock no longer matches this vault. Use your PIN.')
  if (meta.failedAttempts > 0 || meta.lockedUntil !== null) await saveMeta({ ...meta, failedAttempts: 0, lockedUntil: null })
  return key
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await getBiometric()) !== undefined
}

/** Forgets the stored key. The passkey itself stays in the device's password manager until the user removes it there. */
export function disableBiometric(): Promise<void> {
  return clearBiometric()
}
