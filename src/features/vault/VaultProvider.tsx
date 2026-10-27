import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMeta } from '../storage/vaultStore'
import { VaultContext, type VaultContextValue, type VaultStatus } from './VaultContext'
import { seedDemoAccounts } from './demo'
import { attemptUnlock, setupVault } from './vault'

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>('loading')
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    getMeta()
      .then((meta) => {
        if (cancelled) return
        setLockedUntil(meta?.lockedUntil ?? null)
        setStatus(meta ? 'locked' : 'setup')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setup = useCallback(async (pin: string, withDemo: boolean) => {
    const newKey = await setupVault(pin)
    if (withDemo) await seedDemoAccounts(newKey)
    setKey(newKey)
    setLockedUntil(null)
    setStatus('unlocked')
  }, [])

  const unlock = useCallback(async (pin: string) => {
    const result = await attemptUnlock(pin)
    if (result.status === 'unlocked') {
      setKey(result.key)
      setLockedUntil(null)
      setStatus('unlocked')
    } else {
      setLockedUntil(result.lockedUntil)
    }
    return result
  }, [])

  const lock = useCallback(() => {
    setKey(null)
    setStatus((current) => (current === 'unlocked' ? 'locked' : current))
  }, [])

  const value = useMemo<VaultContextValue>(
    () => ({ status, key, lockedUntil, setup, unlock, lock }),
    [status, key, lockedUntil, setup, unlock, lock],
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}
