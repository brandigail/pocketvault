import { useRef, useState } from 'react'
import { cameraSupported } from '../scan/qr'
import { ScanForm } from '../scan/ScanForm'
import { parseOtpauthUri, type ParsedOtpauth } from '../totp/otpauth'
import { addAccount } from '../vault/vault'
import { ManualForm } from './ManualForm'
import { PasteLinkForm } from './PasteLinkForm'

type Method = 'scan' | 'link' | 'manual'

const METHODS: { id: Method; label: string }[] = [
  { id: 'scan', label: 'Scan QR' },
  { id: 'link', label: 'Paste link' },
  { id: 'manual', label: 'Manual' },
]

interface AddAccountScreenProps {
  vaultKey: CryptoKey
  onClose: () => void
  onAdded: () => void
}

export function AddAccountScreen({ vaultKey, onClose, onAdded }: AddAccountScreenProps) {
  const [method, setMethod] = useState<Method>(() => (cameraSupported() ? 'scan' : 'link'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // The scanner can report the same code on several frames; this guards against saving twice.
  const saving = useRef(false)

  async function save(input: ParsedOtpauth) {
    if (saving.current) return
    saving.current = true
    setError(null)
    setBusy(true)
    try {
      await addAccount(vaultKey, input)
      onAdded()
    } catch {
      saving.current = false
      setError('Could not save the account. Check that your browser allows site storage.')
      setBusy(false)
    }
  }

  function saveScanned(text: string) {
    try {
      void save(parseOtpauthUri(text))
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'Could not read that QR code')
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
          className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:border-teal-600 disabled:opacity-60 dark:border-slate-600"
        >
          Cancel
        </button>
      </header>

      <div role="tablist" aria-label="How to add" className="grid grid-cols-3 gap-1 rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
        {METHODS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={method === id}
            aria-controls="add-panel"
            onClick={() => switchMethod(id)}
            className={`h-11 rounded-md text-sm font-medium ${method === id ? 'bg-white shadow-sm dark:bg-slate-600' : 'text-slate-600 dark:text-slate-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div id="add-panel" role="tabpanel" aria-labelledby={`tab-${method}`} className="flex flex-col gap-4">
        {method === 'scan' && <ScanForm onDetected={saveScanned} onError={setError} />}
        {method === 'link' && <PasteLinkForm disabled={busy} onSubmit={save} onError={setError} />}
        {method === 'manual' && <ManualForm disabled={busy} onSubmit={save} onError={setError} />}
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
