import { useState, type FormEvent } from 'react'
import { MIN_PIN_LENGTH } from '../vault/vault'
import { useVault } from '../vault/useVault'
import { LockLayout } from './LockLayout'
import { PinField } from './PinField'

export function SetupScreen() {
  const { setup } = useVault()
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [withDemo, setWithDemo] = useState(true)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (pin.length < MIN_PIN_LENGTH) return setError(`Use at least ${MIN_PIN_LENGTH} characters.`)
    if (pin !== confirm) return setError('The two PINs do not match.')

    setError(null)
    setBusy(true)
    try {
      await setup(pin, withDemo)
    } catch {
      setError('Could not create the vault. Check that your browser allows site storage.')
      setBusy(false)
    }
  }

  return (
    <LockLayout title="Create your PIN" subtitle="It encrypts every secret on this device. Numbers, letters or both.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PinField id="pin" label="PIN" value={pin} onChange={setPin} autoComplete="new-password" autoFocus disabled={busy} />
        <PinField id="confirm" label="Confirm PIN" value={confirm} onChange={setConfirm} autoComplete="new-password" disabled={busy} />
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={withDemo}
            onChange={(event) => setWithDemo(event.target.checked)}
            disabled={busy}
            className="mt-0.5 h-5 w-5 accent-teal-700"
          />
          <span>
            Add a few demo accounts to look around
            <span className="block text-xs text-slate-500 dark:text-slate-400">Fake secrets, labelled Demo. You can delete them any time.</span>
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="h-12 rounded-lg bg-teal-700 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {busy ? 'Creating vault…' : 'Create vault'}
        </button>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          There is no way to recover a forgotten PIN. Longer is stronger if someone gets hold of this device.
        </p>
      </form>
    </LockLayout>
  )
}
