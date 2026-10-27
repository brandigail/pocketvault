import { OUTLINE, PRIMARY } from './buttonStyles'

interface AccountsHeaderProps {
  editing: boolean
  hasAccounts: boolean
  onAdd: () => void
  onToggleEdit: () => void
  onLock: () => void
  onSettings: () => void
}

/** Title and Lock on the first row; Add and Edit below, so nothing overflows on a 320px phone. */
export function AccountsHeader({ editing, hasAccounts, onAdd, onToggleEdit, onLock, onSettings }: AccountsHeaderProps) {
  return (
    <header className="flex flex-col gap-3 py-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold min-[360px]:text-xl">PocketVault</h1>
        {editing ? (
          <button type="button" onClick={onToggleEdit} className={PRIMARY}>
            Done
          </button>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={onSettings} aria-label="Settings" className={`${OUTLINE} flex w-11 items-center justify-center px-0 min-[360px]:px-0`}>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </button>
            <button type="button" onClick={onLock} className={OUTLINE}>
              Lock
            </button>
          </div>
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
