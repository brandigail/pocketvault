import { useState, type FormEvent } from 'react'
import type { TokenAccount } from '../../types'
import { Modal } from './Modal'
import { TextField } from './TextField'

interface RenameDialogProps {
  account: TokenAccount
  onSave: (issuer: string, label: string) => void
  onClose: () => void
}

export function RenameDialog({ account, onSave, onClose }: RenameDialogProps) {
  const [issuer, setIssuer] = useState(account.issuer)
  const [label, setLabel] = useState(account.label)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!issuer.trim() && !label.trim()) return setError('Enter a service or account name')
    onSave(issuer.trim(), label.trim())
  }

  return (
    <Modal title="Rename account" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField id="rename-issuer" label="Service" value={issuer} onChange={setIssuer} autoComplete="off" />
        <TextField id="rename-label" label="Account" value={label} onChange={setLabel} autoComplete="off" />
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-lg border border-slate-300 font-medium dark:border-slate-600">
            Cancel
          </button>
          <button type="submit" className="h-11 flex-1 rounded-lg bg-teal-700 font-medium text-white hover:bg-teal-800">
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
