import { useState, type FormEvent } from 'react'
import type { TokenAccount } from '../../types'
import { MAX_FOLDER_LENGTH, normalizeFolder } from './filter'
import { Modal } from './Modal'
import { TextField } from './TextField'

export interface AccountDetails {
  issuer: string
  label: string
  folder: string | undefined
}

interface EditDetailsDialogProps {
  account: TokenAccount
  /** Folders already in use, offered as suggestions. */
  folders: string[]
  onSave: (details: AccountDetails) => void
  onClose: () => void
}

export function EditDetailsDialog({ account, folders, onSave, onClose }: EditDetailsDialogProps) {
  const [issuer, setIssuer] = useState(account.issuer)
  const [label, setLabel] = useState(account.label)
  const [folder, setFolder] = useState(account.folder ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!issuer.trim() && !label.trim()) return setError('Enter a service or account name')
    onSave({ issuer: issuer.trim(), label: label.trim(), folder: normalizeFolder(folder, folders) })
  }

  return (
    <Modal title="Edit details" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField id="details-issuer" label="Service" value={issuer} onChange={setIssuer} autoComplete="off" />
        <TextField id="details-label" label="Account" value={label} onChange={setLabel} autoComplete="off" />
        <TextField
          id="details-folder"
          label="Folder (optional)"
          value={folder}
          onChange={setFolder}
          autoComplete="off"
          list="folder-suggestions"
          maxLength={MAX_FOLDER_LENGTH}
          placeholder="Work, Personal…"
        />
        <datalist id="folder-suggestions">
          {folders.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
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
