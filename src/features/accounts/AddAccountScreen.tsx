import { useState } from 'react'
import type { ParsedOtpauth } from '../totp/otpauth'
import { addAccount } from '../vault/vault'
import { ManualForm } from './ManualForm'
import { PasteLinkForm } from './PasteLinkForm'

type Method = 'link' | 'manual'

const METHODS: { id: Method; label: string }[] = [
  { id: 'link', label: 'Paste link' },
  { id: 'manual', label: 'Enter manually' },
]

interface AddAccountScreenProps {
  vaultKey: CryptoKey
  onClose: () => void
  onAdded: () => void
}

export function AddAccountScreen({ vaultKey, onClose, onAdded }: AddAccountScreenProps) {
  const [method, setMethod] = useState<Method>('link')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save(input: ParsedOtpauth) {
    setError(null)
    setBusy(true)
    try {
      await addAccount(vaultKey, input)
      onAdded()
    } catch {
      setError('Could not save the account. Check that your browser allows site storage.')
      setBusy(false)
    }
  }

  function switchMethod(next: Method) {
    setMethod(next)
    setError(null)
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 px-4 pb-8">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-semibold">Add account</h1>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:border-teal-600 disabled:opacity-60 dark:border-slate-600"
        >
          Cancel
        </button>
      </header>

      <div role="tablist" aria-label="How to add" className="grid grid-cols-2 gap-1 rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
        {METHODS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={method === id}
            aria-controls="add-panel"
            onClick={() => switchMethod(id)}
            className={`h-10 rounded-md text-sm font-medium ${method === id ? 'bg-white shadow-sm dark:bg-slate-600' : 'text-slate-600 dark:text-slate-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div id="add-panel" role="tabpanel" aria-labelledby={`tab-${method}`} className="flex flex-col gap-4">
        {method === 'link' ? (
          <PasteLinkForm disabled={busy} onSubmit={save} onError={setError} />
        ) : (
          <ManualForm disabled={busy} onSubmit={save} onError={setError} />
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
