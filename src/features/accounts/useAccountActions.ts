import { useCallback } from 'react'
import type { TokenAccount } from '../../types'
import { deleteAccount, updateAccount, updateAccounts } from '../storage/vaultStore'
import { seedDemoAccounts } from '../vault/demo'
import { moveAccount } from './reorder'

/** Rename, delete and reorder, each followed by a reload of the list. Failures become a notice. */
export function useAccountActions(reload: () => void, showNotice: (message: string) => void) {
  const run = useCallback(
    async (action: () => Promise<void>, success?: string) => {
      try {
        await action()
        reload()
        if (success) showNotice(success)
      } catch {
        showNotice('Something went wrong. Try again.')
      }
    },
    [reload, showNotice],
  )

  const rename = useCallback(
    (account: TokenAccount, issuer: string, label: string) => run(() => updateAccount({ ...account, issuer, label }), 'Account renamed'),
    [run],
  )
  const remove = useCallback((accountId: string) => run(() => deleteAccount(accountId), 'Account deleted'), [run])
  const move = useCallback(
    (sorted: TokenAccount[], accountId: string, direction: -1 | 1) => run(() => updateAccounts(moveAccount(sorted, accountId, direction))),
    [run],
  )

  const loadDemo = useCallback((vaultKey: CryptoKey) => run(() => seedDemoAccounts(vaultKey), 'Demo accounts added'), [run])

  return { rename, remove, move, loadDemo }
}
