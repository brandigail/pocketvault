import { Modal } from './Modal'

interface DeleteDialogProps {
  name: string
  onConfirm: () => void
  onClose: () => void
}

export function DeleteDialog({ name, onConfirm, onClose }: DeleteDialogProps) {
  return (
    <Modal title={`Delete ${name}?`} onClose={onClose}>
      <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
        Its codes and secret are removed from this device for good. Make sure you can still sign in to the service without it, for example by turning off
        two-factor authentication first or keeping the setup key.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="h-11 flex-1 rounded-lg border border-slate-300 font-medium dark:border-slate-600">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className="h-11 flex-1 rounded-lg bg-red-600 font-medium text-white hover:bg-red-700">
          Delete
        </button>
      </div>
    </Modal>
  )
}
