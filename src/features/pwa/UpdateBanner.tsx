import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const UPDATE_CHECK_MS = 60 * 60_000
const OFFLINE_NOTICE_MS = 5000

/** Tells the user when the app can work offline and when a new version is waiting. Never reloads on its own. */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => void registration.update().catch(() => undefined)
      // Phones suspend timers, so also look for a new version whenever the app is opened or resumed.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      window.addEventListener('online', check)
      window.setInterval(check, UPDATE_CHECK_MS)
    },
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!offlineReady) return
    const timer = window.setTimeout(() => setOfflineReady(false), OFFLINE_NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  if (!needRefresh && !offlineReady) return null

  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex w-full max-w-md flex-col gap-3 rounded-xl bg-slate-900 p-4 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
        {needRefresh ? (
          <>
            <p>A new version of PocketVault is ready. Updating reloads the app and locks the vault.</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => {
                  setUpdating(true)
                  void updateServiceWorker(true)
                }}
                className="h-11 flex-1 rounded-lg bg-teal-500 font-medium text-slate-900 hover:bg-teal-400 disabled:opacity-60"
              >
                {updating ? 'Updating…' : 'Update now'}
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => setNeedRefresh(false)}
                className="h-11 flex-1 rounded-lg border border-white/30 font-medium dark:border-slate-400"
              >
                Later
              </button>
            </div>
          </>
        ) : (
          <p>PocketVault is ready to work offline.</p>
        )}
      </div>
    </div>
  )
}
