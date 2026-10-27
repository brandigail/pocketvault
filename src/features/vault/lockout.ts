/** Wrong PINs allowed before the delays start. */
export const FREE_ATTEMPTS = 3
const BASE_DELAY_MS = 30_000
const MAX_DELAY_MS = 60 * 60_000

/** Delay imposed after the given number of consecutive failures: 30 s, 1 min, 2 min... capped at 1 hour. */
export function lockoutDelayMs(failedAttempts: number): number {
  if (failedAttempts < FREE_ATTEMPTS) return 0
  return Math.min(BASE_DELAY_MS * 2 ** (failedAttempts - FREE_ATTEMPTS), MAX_DELAY_MS)
}
