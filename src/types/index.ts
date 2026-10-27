export type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512'

export interface TokenAccount {
  id: string
  issuer: string
  label: string
  algorithm: TotpAlgorithm
  digits: 6 | 8
  period: number
  createdAt: string
}

/** The secret is encrypted (AES-GCM), never stored in plain text. Both fields are base64. */
export interface StoredSecret {
  accountId: string
  ciphertext: string
  iv: string
}

export interface VaultMeta {
  salt: string
  iterations: number
  verifier: string
  failedAttempts: number
  lockedUntil: number | null
}
