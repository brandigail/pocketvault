import type { OtpType, TotpAlgorithm } from '../../types'
import { decodeBase32, normalizeBase32 } from '../totp/base32'
import { parseCounter, parsePeriod, type ParsedOtpauth } from '../totp/otpauth'

/** Raw values from the manual entry form. */
export interface ManualEntry {
  issuer: string
  label: string
  secret: string
  algorithm: TotpAlgorithm
  digits: 6 | 8
  period: string
  type: OtpType
  /** Only used for HOTP. */
  counter: string
}

/** Validates the form and converts it to the same shape an otpauth link produces. Throws a user-readable Error. */
export function toAccountInput(entry: ManualEntry): ParsedOtpauth {
  const issuer = entry.issuer.trim()
  const label = entry.label.trim()
  if (!issuer && !label) throw new Error('Enter a service or account name')

  decodeBase32(entry.secret) // throws a readable error for an empty or invalid secret
  const secret = normalizeBase32(entry.secret)
  if (entry.type === 'hotp') {
    return { issuer, label, secret, algorithm: entry.algorithm, digits: entry.digits, period: 30, type: 'hotp', counter: parseCounter(entry.counter) }
  }
  return {
    issuer,
    label,
    secret,
    algorithm: entry.algorithm,
    digits: entry.digits,
    period: parsePeriod(entry.period),
  }
}
