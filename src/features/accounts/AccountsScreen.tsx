import { useState } from 'react'
import { useNow } from '../../shared/useNow'
import { useVault } from '../vault/useVault'
import { AccountRow } from './AccountRow'
import { AddAccountScreen } from './AddAccountScreen'
import { useNotice } from './useNotice'
import { useVaultAccounts } from './useVaultAccounts'

const TICK_MS = 250
const BUTTON = 'h-10 rounded-lg px-4 text-sm font-medium'

export function AccountsScreen({ vaultKey }: { vaultKey: CryptoKey }) {
  const { lock } = useVault()
  const { state, reload } = useVaultAccounts(vaultKey)
  const now = useNow(TICK_MS, true)
  const [notice, showNotice] = useNotice()
  const [adding, setAdding] = useState(false)

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

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-24">
      <header className="flex items-center justify-between py-4">
        <h1 className="text-xl font-semibold">PocketVault</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAdding(true)} className={`${BUTTON} bg-teal-700 text-white hover:bg-teal-800`}>
            Add
          </button>
          <button type="button" onClick={lock} className={`${BUTTON} border border-slate-300 hover:border-teal-600 dark:border-slate-600`}>
            Lock
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3">
        {state.status === 'loading' && <p className="py-8 text-center text-slate-500 dark:text-slate-400">Decrypting…</p>}
        {state.status === 'error' && (
          <p role="alert" className="py-8 text-center text-red-600 dark:text-red-400">
            Could not read your accounts. Lock and unlock again.
          </p>
        )}
        {state.status === 'ready' && state.accounts.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">No accounts yet.</p>
            <button type="button" onClick={() => setAdding(true)} className={`${BUTTON} bg-teal-700 text-white hover:bg-teal-800`}>
              Add your first account
            </button>
          </div>
        )}
        {state.status === 'ready' && state.accounts.length > 0 && (
          <ul className="flex flex-col gap-3">
            {state.accounts.map((entry) => (
              <AccountRow key={entry.account.id} entry={entry} now={now} onCopy={copy} />
            ))}
          </ul>
        )}
      </main>

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
        {notice && <p className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">{notice}</p>}
      </div>
    </div>
  )
}
