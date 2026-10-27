import { LockScreen } from './features/lock/LockScreen'
import { SetupScreen } from './features/lock/SetupScreen'
import { useAutoLock } from './features/vault/useAutoLock'
import { useVault } from './features/vault/useVault'

export default function App() {
  const { status, lock } = useVault()
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
      return (
        <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 p-4">
          <h1 className="text-2xl font-semibold">Vault unlocked</h1>
          <button type="button" onClick={lock} className="h-11 rounded-lg bg-teal-700 px-6 font-medium text-white hover:bg-teal-800">
            Lock now
          </button>
        </main>
      )
  }
}
