import type { TotpAlgorithm } from '../../types'
import { decodeBase32, normalizeBase32 } from './base32'

export interface ParsedOtpauth {
  issuer: string
  label: string
  /** Normalized Base32. Treat as sensitive: encrypt before storing, never log. */
  secret: string
  algorithm: TotpAlgorithm
  digits: 6 | 8
  period: number
}

const ALGORITHMS: readonly TotpAlgorithm[] = ['SHA1', 'SHA256', 'SHA512']
const MAX_PERIOD = 300

/** Parses a Google Authenticator style `otpauth://totp/...` URI. Throws an Error with a user-readable message. */
export function parseOtpauthUri(uri: string): ParsedOtpauth {
  let url: URL
  try {
    url = new URL(uri.trim())
  } catch {
    throw new Error('Not a valid otpauth link')
  }
  if (url.protocol !== 'otpauth:') throw new Error('Not an otpauth link')
  if (url.host === 'hotp') throw new Error('Counter-based (HOTP) accounts are not supported yet')
  if (url.host !== 'totp') throw new Error('Unsupported otpauth type')

  const params = url.searchParams
  const rawSecret = params.get('secret')
  if (!rawSecret) throw new Error('The link has no secret')
  decodeBase32(rawSecret) // throws a readable error if the secret is not valid Base32

  let path: string
  try {
    path = decodeURIComponent(url.pathname.replace(/^\//, ''))
  } catch {
    throw new Error('The account name is malformed')
  }
  const separator = path.indexOf(':')
  const labelIssuer = separator === -1 ? '' : path.slice(0, separator).trim()
  const label = (separator === -1 ? path : path.slice(separator + 1)).trim()
  const issuer = (params.get('issuer') ?? labelIssuer).trim()
  if (!issuer && !label) throw new Error('The link has no account name')

  return {
    issuer,
    label,
    secret: normalizeBase32(rawSecret),
    algorithm: parseAlgorithm(params.get('algorithm')),
    digits: parseDigits(params.get('digits')),
    period: parsePeriod(params.get('period')),
  }
}

function parseAlgorithm(value: string | null): TotpAlgorithm {
  if (value === null) return 'SHA1'
  const upper = value.toUpperCase().replace('-', '')
  const match = ALGORITHMS.find((algorithm) => algorithm === upper)
  if (!match) throw new Error(`Unsupported algorithm: ${value}`)
  return match
}

function parseDigits(value: string | null): 6 | 8 {
  if (value === null) return 6
  if (value === '6') return 6
  if (value === '8') return 8
  throw new Error('Digits must be 6 or 8')
}

function parsePeriod(value: string | null): number {
  if (value === null) return 30
  const period = Number(value)
  if (!Number.isInteger(period) || period < 1 || period > MAX_PERIOD) {
    throw new Error(`Period must be a whole number of seconds between 1 and ${MAX_PERIOD}`)
  }
  return period
}
