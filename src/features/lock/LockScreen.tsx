import { useState, type FormEvent } from 'react'
import { FREE_ATTEMPTS } from '../vault/lockout'
import { useVault } from '../vault/useVault'
import { LockLayout } from './LockLayout'
import { PinField } from './PinField'
import { useNow } from './useNow'

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function LockScreen() {
  const { unlock, lockedUntil } = useVault()
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isLocked = lockedUntil !== null
  const now = useNow(1000, isLocked)
  const secondsLeft = isLocked ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0
  const lockedOut = secondsLeft > 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!pin || busy || lockedOut) return

    setBusy(true)
    setMessage(null)
    try {
      const result = await unlock(pin)
      if (result.status === 'wrong-pin') {
        const remaining = FREE_ATTEMPTS - result.failedAttempts
        setMessage(remaining > 0 ? `Incorrect PIN. ${remaining} ${remaining === 1 ? 'try' : 'tries'} left before a delay.` : 'Incorrect PIN.')
      }
    } catch {
      setMessage('Could not read the vault. Check that your browser allows site storage.')
    }
    setPin('')
    setBusy(false)
  }

  return (
    <LockLayout title="PocketVault" subtitle="Enter your PIN to unlock.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PinField id="pin" label="PIN" value={pin} onChange={setPin} autoComplete="current-password" autoFocus disabled={busy || lockedOut} />
        {lockedOut ? (
          <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
            Too many wrong attempts. Try again in {formatCountdown(secondsLeft)}.
          </p>
        ) : (
          message && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {message}
            </p>
          )
        )}
        <button
          type="submit"
          disabled={busy || lockedOut || !pin}
          className="h-12 rounded-lg bg-teal-700 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>
    </LockLayout>
  )
}
