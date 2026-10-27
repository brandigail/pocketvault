import { useEffect, useState } from 'react'
import { generateHotp } from '../totp/totp'

/** The code for an HOTP account's current counter. Null until it is ready. */
export function useHotpCode(hmacKey: CryptoKey, digits: 6 | 8, counter: number): string | null {
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    generateHotp(hmacKey, digits, counter).then((next) => {
      if (!cancelled) setCode(next)
    })
    return () => {
      cancelled = true
    }
  }, [hmacKey, digits, counter])

  return code
}
