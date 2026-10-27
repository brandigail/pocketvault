import { useEffect, useState, type FormEvent } from 'react'
import { describeBiometricError, disableBiometric, enableBiometric, isBiometricAvailable } from '../biometric/biometric'
import { PinField } from '../lock/PinField'
import { useVault } from '../vault/useVault'

type Availability = 'checking' | 'available' | 'unavailable'

/** An optional extra way to unlock. The PIN always keeps working, and it stays the only way if this is off. */
export function BiometricSettings() {
  const { biometricEnabled, refreshBiometric } = useVault()
  const [availability, setAvailability] = useState<Availability>('checking')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    isBiometricAvailable().then((available) => {
      if (!cancelled) setAvailability(available ? 'available' : 'unavailable')
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleEnable(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await enableBiometric(pin)
      setPin('')
      await refreshBiometric()
    } catch (caught) {
      setError(describeBiometricError(caught))
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable() {
    setBusy(true)
    setError(null)
    try {
      await disableBiometric()
      await refreshBiometric()
    } catch {
      setError('Could not turn off biometric unlock. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="biometric-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="biometric-heading" className="text-lg font-semibold">
          Biometric unlock
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Unlock with your fingerprint, face or screen lock instead of typing the PIN. Optional: your PIN always works, and the PIN is what protects your backup.
        </p>
      </div>

      {availability === 'checking' && <p className="text-sm text-slate-600 dark:text-slate-400">Checking this device…</p>}
      {availability === 'unavailable' && (
        <p className="text-sm text-slate-600 dark:text-slate-400">This browser or device does not offer fingerprint, face or screen-lock unlock, so only the PIN is used.</p>
      )}

      {availability === 'available' && biometricEnabled && (
        <>
          <p role="status" className="text-sm text-teal-700 dark:text-teal-400">
            Biometric unlock is on.
          </p>
          <button
            type="button"
            onClick={() => void handleDisable()}
            disabled={busy}
            className="h-12 rounded-lg border border-slate-300 font-medium hover:border-teal-600 disabled:opacity-60 dark:border-slate-600"
          >
            Turn off
          </button>
        </>
      )}

      {availability === 'available' && !biometricEnabled && (
        <form onSubmit={handleEnable} className="flex flex-col gap-4">
          <PinField id="biometric-pin" label="Your PIN" value={pin} onChange={setPin} autoComplete="current-password" disabled={busy} />
          <button
            type="submit"
            disabled={busy || !pin}
            className="h-12 rounded-lg bg-teal-700 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {busy ? 'Waiting for your device…' : 'Turn on biometric unlock'}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  )
}
