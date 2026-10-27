import { AccountsScreen } from './features/accounts/AccountsScreen'
import { LockScreen } from './features/lock/LockScreen'
import { SetupScreen } from './features/lock/SetupScreen'
import { useAutoLock } from './features/vault/useAutoLock'
import { useVault } from './features/vault/useVault'

export default function App() {
  const { status, key, lock } = useVault()
  useAutoLock(status === 'unlocked', lock)

  switch (status) {
    case 'loading':
      return <p className="p-8 text-center text-slate-600 dark:text-slate-400">Loading…</p>
    case 'error':
      return (
        <p role="alert" className="p-8 text-center text-red-600 dark:text-red-400">
          PocketVault can&apos;t open its storage. Allow site data for this page (and leave private browsing) and reload.
        </p>
      )
    case 'setup':
      return <SetupScreen />
    case 'locked':
      return <LockScreen />
    case 'unlocked':
      return key ? <AccountsScreen vaultKey={key} /> : null
  }
}
