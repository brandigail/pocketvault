import type { TokenAccount } from '../../types'

interface AccountEditRowProps {
  account: TokenAccount
  isFirst: boolean
  isLast: boolean
  onMove: (direction: -1 | 1) => void
  onEditDetails: () => void
  onDelete: () => void
}

const BUTTON = 'h-11 min-w-11 rounded-lg border border-slate-300 px-3 text-sm font-medium hover:border-teal-600 disabled:opacity-40 dark:border-slate-600'

export function AccountEditRow({ account, isFirst, isLast, onMove, onEditDetails, onDelete }: AccountEditRowProps) {
  const name = account.issuer || account.label

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        {account.issuer && account.label && <p className="truncate text-sm text-slate-500 dark:text-slate-400">{account.label}</p>}
        {account.folder && <p className="truncate text-xs text-teal-700 dark:text-teal-400">Folder: {account.folder}</p>}
      </div>
      <div className="flex gap-2">
        <button type="button" aria-label={`Move ${name} up`} disabled={isFirst} onClick={() => onMove(-1)} className={BUTTON}>
          ↑
        </button>
        <button type="button" aria-label={`Move ${name} down`} disabled={isLast} onClick={() => onMove(1)} className={BUTTON}>
          ↓
        </button>
        <button type="button" aria-label={`Edit details for ${name}`} onClick={onEditDetails} className={`${BUTTON} flex-1`}>
          Details
        </button>
        <button
          type="button"
          aria-label={`Delete ${name}`}
          onClick={onDelete}
          className={`${BUTTON} flex-1 text-red-600 hover:border-red-600 dark:text-red-400`}
        >
          Delete
        </button>
      </div>
    </li>
  )
}
