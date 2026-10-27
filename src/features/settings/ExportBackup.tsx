import { useState, type FormEvent } from 'react'
import { downloadTextFile } from '../../shared/download'
import { createBackup } from '../backup/backup'
import { BACKUP_MIN_PASSWORD } from '../backup/backupFormat'
import { PinField } from '../lock/PinField'
import { verifyPin } from '../vault/vault'

interface ExportBackupProps {
  vaultKey: CryptoKey
}

/** Writes every account into one file, encrypted with a password chosen here. Asks for the PIN again first. */
export function ExportBackup({ vaultKey }: ExportBackupProps) {
  const [pin, setPin] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setDone(null)
    if (password.length < BACKUP_MIN_PASSWORD) return setError(`Use at least ${BACKUP_MIN_PASSWORD} characters for the backup password`)
    if (password !== confirm) return setError('The backup passwords do not match')

    setBusy(true)
    try {
      if (!(await verifyPin(pin))) return setError('Incorrect PIN')
      const { file, count } = await createBackup(vaultKey, password)
      if (count === 0) return setError('There are no accounts to back up yet')
      const day = new Date().toISOString().slice(0, 10)
      downloadTextFile(`pocketvault-backup-${day}.json`, JSON.stringify(file))
      setDone(`Saved ${count} ${count === 1 ? 'account' : 'accounts'}. Keep the file somewhere safe. Without the backup password it cannot be opened.`)
      setPin('')
      setPassword('')
      setConfirm('')
    } catch {
      setError('Could not create the backup. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-labelledby="export-heading">
      <div>
        <h2 id="export-heading" className="text-lg font-semibold">
          Export a backup
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Saves all accounts into one encrypted file. Pick a backup password different from your PIN, and keep it: there is no way to recover it.
        </p>
      </div>
      <PinField id="export-pin" label="Your PIN" value={pin} onChange={setPin} autoComplete="current-password" disabled={busy} />
      <PinField id="export-password" label="Backup password" value={password} onChange={setPassword} autoComplete="new-password" disabled={busy} />
      <PinField id="export-confirm" label="Confirm backup password" value={confirm} onChange={setConfirm} autoComplete="new-password" disabled={busy} />
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
        disabled={busy || !pin || !password || !confirm}
        className="h-12 rounded-lg bg-teal-700 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {busy ? 'Encrypting…' : 'Export backup'}
      </button>
    </form>
  )
}
