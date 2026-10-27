import { useRef, useState, type FormEvent } from 'react'
import { importAccounts, openBackup } from '../backup/backup'
import { PinField } from '../lock/PinField'

const MAX_FILE_BYTES = 5 * 1024 * 1024

interface ImportBackupProps {
  vaultKey: CryptoKey
}

/** Adds the accounts from a backup file. Accounts already in the vault are skipped, never duplicated. */
export function ImportBackup({ vaultKey }: ImportBackupProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) return
    setError(null)
    setDone(null)
    if (file.size > MAX_FILE_BYTES) return setError('That file is too big to be a PocketVault backup')

    setBusy(true)
    try {
      const accounts = await openBackup(await file.text(), password)
      const { added, skipped } = await importAccounts(vaultKey, accounts)
      setDone(
        added === 0
          ? 'Nothing new to add. Every account in the backup is already here.'
          : `Added ${added} ${added === 1 ? 'account' : 'accounts'}${skipped > 0 ? `, skipped ${skipped} already here` : ''}.`,
      )
      setFile(null)
      setPassword('')
      if (fileInput.current) fileInput.current.value = ''
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not import that file')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-labelledby="import-heading">
      <div>
        <h2 id="import-heading" className="text-lg font-semibold">
          Import a backup
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Adds the accounts from a PocketVault backup file to this vault.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="import-file" className="text-sm font-medium">
          Backup file
        </label>
        <input
          ref={fileInput}
          id="import-file"
          type="file"
          accept=".json,application/json"
          disabled={busy}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="min-h-12 rounded-lg border border-slate-300 bg-white p-2 text-base file:mr-3 file:h-8 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:font-medium dark:border-slate-600 dark:bg-slate-800 dark:file:bg-slate-600"
        />
      </div>
      <PinField id="import-password" label="Backup password" value={password} onChange={setPassword} autoComplete="current-password" disabled={busy} />
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="text-sm text-teal-700 dark:text-teal-400">
          {done}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !file || !password}
        className="h-12 rounded-lg bg-teal-700 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {busy ? 'Decrypting…' : 'Import backup'}
      </button>
    </form>
  )
}
