import { useEffect } from 'react'

export const INACTIVITY_LOCK_MS = 2 * 60_000
export const HIDDEN_LOCK_MS = 30_000
const CHECK_INTERVAL_MS = 5_000
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const

/**
 * Locks after a period of inactivity, or when the tab or app was in the background for a while.
 * Time spent hidden also counts as inactivity, so returning after a long absence always locks.
 */
export function useAutoLock(active: boolean, lock: () => void): void {
  useEffect(() => {
    if (!active) return

    let lastActivity = Date.now()
    let hiddenAt: number | null = null

    const markActive = () => {
      lastActivity = Date.now()
    }
    const checkInactivity = () => {
      if (Date.now() - lastActivity > INACTIVITY_LOCK_MS) lock()
    }
    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        return
      }
      const wasHiddenTooLong = hiddenAt !== null && Date.now() - hiddenAt > HIDDEN_LOCK_MS
      hiddenAt = null
      if (wasHiddenTooLong) lock()
      else checkInactivity()
    }

    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, markActive, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    const timer = window.setInterval(checkInactivity, CHECK_INTERVAL_MS)

    return () => {
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, markActive)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.clearInterval(timer)
    }
  }, [active, lock])
}
