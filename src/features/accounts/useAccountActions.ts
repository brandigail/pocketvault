import { useCallback } from 'react'
import type { TokenAccount } from '../../types'
import { deleteAccount, incrementCounter, updateAccount, updateAccounts } from '../storage/vaultStore'
import { seedDemoAccounts } from '../vault/demo'
import type { AccountDetails } from './EditDetailsDialog'
import { moveAccount } from './reorder'

/** Edit details, delete and reorder, each followed by a reload of the list. Failures become a notice. */
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

  const saveDetails = useCallback(
    (account: TokenAccount, { issuer, label, folder }: AccountDetails) => {
      const next: TokenAccount = { ...account, issuer, label }
      if (folder) next.folder = folder
      else delete next.folder
      return run(() => updateAccount(next), 'Details saved')
    },
    [run],
  )
  const nextCounter = useCallback((account: TokenAccount) => run(async () => void (await incrementCounter(account.id))), [run])
  const remove = useCallback((accountId: string) => run(() => deleteAccount(accountId), 'Account deleted'), [run])
  const move = useCallback(
    (sorted: TokenAccount[], accountId: string, direction: -1 | 1) => run(() => updateAccounts(moveAccount(sorted, accountId, direction))),
    [run],
  )

  const loadDemo = useCallback((vaultKey: CryptoKey) => run(() => seedDemoAccounts(vaultKey), 'Demo accounts added'), [run])

  return { saveDetails, nextCounter, remove, move, loadDemo }
}
