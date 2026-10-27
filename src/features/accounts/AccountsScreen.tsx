import { useState } from 'react'
import { useNow } from '../../shared/useNow'
import type { TokenAccount } from '../../types'
import { useVault } from '../vault/useVault'
import { AccountEditRow } from './AccountEditRow'
import { AccountRow } from './AccountRow'
import { AddAccountScreen } from './AddAccountScreen'
import { DeleteDialog } from './DeleteDialog'
import { RenameDialog } from './RenameDialog'
import { useAccountActions } from './useAccountActions'
import { useNotice } from './useNotice'
import { useVaultAccounts } from './useVaultAccounts'

const TICK_MS = 250
const BUTTON = 'h-11 rounded-lg px-4 text-sm font-medium'
const PRIMARY = `${BUTTON} bg-teal-700 text-white hover:bg-teal-800`
const OUTLINE = `${BUTTON} border border-slate-300 hover:border-teal-600 dark:border-slate-600`

export function AccountsScreen({ vaultKey }: { vaultKey: CryptoKey }) {
  const { lock } = useVault()
  const { state, reload } = useVaultAccounts(vaultKey)
  const now = useNow(TICK_MS, true)
  const [notice, showNotice] = useNotice()
  const actions = useAccountActions(reload, showNotice)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [renaming, setRenaming] = useState<TokenAccount | null>(null)
  const [deleting, setDeleting] = useState<TokenAccount | null>(null)

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      showNotice('Code copied')
    } catch {
      showNotice('Could not copy. Select the code manually.')
    }
  }

  if (adding) {
    return (
      <AddAccountScreen
        vaultKey={vaultKey}
        onClose={() => setAdding(false)}
        onAdded={() => {
          reload()
          setAdding(false)
          showNotice('Account added')
        }}
      />
    )
  }

  const accounts = state.status === 'ready' ? state.accounts : []
  const sorted = accounts.map((entry) => entry.account)

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-24">
      <header className="flex items-center justify-between gap-2 py-4">
        <h1 className="text-xl font-semibold">PocketVault</h1>
        <div className="flex gap-2">
          {!editing && (
            <button type="button" onClick={() => setAdding(true)} className={PRIMARY}>
              Add
            </button>
          )}
          {accounts.length > 0 && (
            <button type="button" onClick={() => setEditing((value) => !value)} className={editing ? PRIMARY : OUTLINE}>
              {editing ? 'Done' : 'Edit'}
            </button>
          )}
          {!editing && (
            <button type="button" onClick={lock} className={OUTLINE}>
              Lock
            </button>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3">
        {state.status === 'loading' && <p className="py-8 text-center text-slate-500 dark:text-slate-400">Decrypting…</p>}
        {state.status === 'error' && (
          <p role="alert" className="py-8 text-center text-red-600 dark:text-red-400">
            Could not read your accounts. Lock and unlock again.
          </p>
        )}
        {state.status === 'ready' && accounts.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">No accounts yet.</p>
            <button type="button" onClick={() => setAdding(true)} className={PRIMARY}>
              Add your first account
            </button>
            <button type="button" onClick={() => void actions.loadDemo(vaultKey)} className={OUTLINE}>
              Load demo accounts
            </button>
          </div>
        )}
        {accounts.length > 0 && (
          <ul className="flex flex-col gap-3">
            {accounts.map((entry, index) =>
              editing ? (
                <AccountEditRow
                  key={entry.account.id}
                  account={entry.account}
                  isFirst={index === 0}
                  isLast={index === accounts.length - 1}
                  onMove={(direction) => actions.move(sorted, entry.account.id, direction)}
                  onRename={() => setRenaming(entry.account)}
                  onDelete={() => setDeleting(entry.account)}
                />
              ) : (
                <AccountRow key={entry.account.id} entry={entry} now={now} onCopy={copy} />
              ),
            )}
          </ul>
        )}
      </main>

      {renaming && (
        <RenameDialog
          account={renaming}
          onClose={() => setRenaming(null)}
          onSave={(issuer, label) => {
            void actions.rename(renaming, issuer, label)
            setRenaming(null)
          }}
        />
      )}
      {deleting && (
        <DeleteDialog
          name={deleting.issuer || deleting.label}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            void actions.remove(deleting.id)
            setDeleting(null)
          }}
        />
      )}

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
        {notice && <p className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">{notice}</p>}
      </div>
    </div>
  )
}
