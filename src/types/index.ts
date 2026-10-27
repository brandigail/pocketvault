export type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512'

/** `totp` is time based (RFC 6238); `hotp` is counter based (RFC 4226). */
export type OtpType = 'totp' | 'hotp'

export interface TokenAccount {
  id: string
  issuer: string
  label: string
  algorithm: TotpAlgorithm
  digits: 6 | 8
  period: number
  createdAt: string
  /** Position in the list, ascending. New accounts go last. */
  sortOrder: number
  /** Missing on accounts saved before HOTP existed, which are all TOTP. */
  type?: OtpType
  /** HOTP only: the counter the shown code was made from. Not secret. */
  counter?: number
  /** Optional folder name for grouping. */
  folder?: string
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
