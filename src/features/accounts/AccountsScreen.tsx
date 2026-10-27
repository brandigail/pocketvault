import { useState } from 'react'
import { useNow } from '../../shared/useNow'
import type { TokenAccount } from '../../types'
import { useVault } from '../vault/useVault'
import { AccountEditRow } from './AccountEditRow'
import { AccountRow } from './AccountRow'
import { AccountsHeader } from './AccountsHeader'
import { AccountsToolbar } from './AccountsToolbar'
import { AddAccountScreen } from './AddAccountScreen'
import { DeleteDialog } from './DeleteDialog'
import { EditDetailsDialog } from './EditDetailsDialog'
import { OUTLINE, PRIMARY } from './buttonStyles'
import { filterAccounts, folderNames } from './filter'
import { useAccountActions } from './useAccountActions'
import { useNotice } from './useNotice'
import { useVaultAccounts } from './useVaultAccounts'

const TICK_MS = 250

export function AccountsScreen({ vaultKey }: { vaultKey: CryptoKey }) {
  const { lock } = useVault()
  const { state, reload } = useVaultAccounts(vaultKey)
  const now = useNow(TICK_MS, true)
  const [notice, showNotice] = useNotice()
  const actions = useAccountActions(reload, showNotice)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingDetails, setEditingDetails] = useState<TokenAccount | null>(null)
  const [deleting, setDeleting] = useState<TokenAccount | null>(null)
  const [query, setQuery] = useState('')
  const [chosenFolder, setChosenFolder] = useState<string | null>(null)

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
  const folders = folderNames(sorted)
  // A folder that no longer exists (renamed, or its last account moved out) falls back to "All".
  const folder = chosenFolder !== null && folders.some((name) => name.toLowerCase() === chosenFolder.toLowerCase()) ? chosenFolder : null
  const visible = editing ? accounts : filterAccounts(accounts, query, folder)

  // Deleting the last account hides the Edit/Done button, so leave edit mode instead of getting stuck in it.
  if (editing && state.status === 'ready' && accounts.length === 0) setEditing(false)

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-24">
      <AccountsHeader
        editing={editing}
        hasAccounts={accounts.length > 0}
        onAdd={() => setAdding(true)}
        onToggleEdit={() => setEditing((value) => !value)}
        onLock={lock}
      />

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
        {accounts.length > 0 && !editing && (
          <AccountsToolbar query={query} onQueryChange={setQuery} folders={folders} folder={folder} onFolderChange={setChosenFolder} />
        )}
        {accounts.length > 0 && visible.length === 0 && <p className="py-8 text-center text-slate-500 dark:text-slate-400">No accounts match.</p>}
        {visible.length > 0 && (
          <ul className="flex flex-col gap-3">
            {visible.map((entry, index) =>
              editing ? (
                <AccountEditRow
                  key={entry.account.id}
                  account={entry.account}
                  isFirst={index === 0}
                  isLast={index === visible.length - 1}
                  onMove={(direction) => actions.move(sorted, entry.account.id, direction)}
                  onEditDetails={() => setEditingDetails(entry.account)}
                  onDelete={() => setDeleting(entry.account)}
                />
              ) : (
                <AccountRow key={entry.account.id} entry={entry} now={now} onCopy={copy} onNext={actions.nextCounter} />
              ),
            )}
          </ul>
        )}
      </main>

      {editingDetails && (
        <EditDetailsDialog
          account={editingDetails}
          folders={folders}
          onClose={() => setEditingDetails(null)}
          onSave={(details) => {
            void actions.saveDetails(editingDetails, details)
            setEditingDetails(null)
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

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex justify-center px-4">
        {notice && <p className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">{notice}</p>}
      </div>
    </div>
  )
}
