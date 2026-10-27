import { useEffect, useState } from 'react'
import { generateTotp } from '../totp/totp'

/** The current code for an account, recomputed when its time step changes. Null until the first code is ready. */
export function useTotpCode(hmacKey: CryptoKey, digits: 6 | 8, period: number, now: number): string | null {
  const [code, setCode] = useState<string | null>(null)
  const step = Math.floor(now / 1000 / period)

  useEffect(() => {
    let cancelled = false
    generateTotp(hmacKey, digits, period, step * period * 1000).then((next) => {
      if (!cancelled) setCode(next)
    })
    return () => {
      cancelled = true
    }
  }, [hmacKey, digits, period, step])

  return code
}
