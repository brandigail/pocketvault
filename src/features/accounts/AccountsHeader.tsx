import { OUTLINE, PRIMARY } from './buttonStyles'

interface AccountsHeaderProps {
  editing: boolean
  hasAccounts: boolean
  onAdd: () => void
  onToggleEdit: () => void
  onLock: () => void
}

/** Title and Lock on the first row; Add and Edit below, so nothing overflows on a 320px phone. */
export function AccountsHeader({ editing, hasAccounts, onAdd, onToggleEdit, onLock }: AccountsHeaderProps) {
  return (
    <header className="flex flex-col gap-3 py-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold min-[360px]:text-xl">PocketVault</h1>
        {editing ? (
          <button type="button" onClick={onToggleEdit} className={PRIMARY}>
            Done
          </button>
        ) : (
          <button type="button" onClick={onLock} className={OUTLINE}>
            Lock
          </button>
        )}
      </div>
      {!editing && (
        <div className="flex gap-2">
          <button type="button" onClick={onAdd} className={`${PRIMARY} flex-1`}>
            Add
          </button>
          {hasAccounts && (
            <button type="button" onClick={onToggleEdit} className={`${OUTLINE} flex-1`}>
              Edit
            </button>
          )}
        </div>
      )}
    </header>
  )
}
