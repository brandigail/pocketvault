import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMeta } from '../storage/vaultStore'
import { describeBiometricError, isBiometricEnabled, unlockWithBiometric as unlockWithDevice } from '../biometric/biometric'
import { VaultContext, type VaultContextValue, type VaultStatus } from './VaultContext'
import { seedDemoAccounts } from './demo'
import { attemptUnlock, setupVault } from './vault'

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>('loading')
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([getMeta(), isBiometricEnabled()])
      .then(([meta, biometric]) => {
        if (cancelled) return
        setLockedUntil(meta?.lockedUntil ?? null)
        setBiometricEnabled(biometric)
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

  const refreshBiometric = useCallback(async () => setBiometricEnabled(await isBiometricEnabled()), [])

  const unlockWithBiometric = useCallback(async () => {
    try {
      setKey(await unlockWithDevice())
      setLockedUntil(null)
      setStatus('unlocked')
      return null
    } catch (error) {
      return describeBiometricError(error)
    }
  }, [])

  const lock = useCallback(() => {
    setKey(null)
    setStatus((current) => (current === 'unlocked' ? 'locked' : current))
  }, [])

  const value = useMemo<VaultContextValue>(
    () => ({ status, key, lockedUntil, setup, unlock, lock, biometricEnabled, refreshBiometric, unlockWithBiometric }),
    [status, key, lockedUntil, setup, unlock, lock, biometricEnabled, refreshBiometric, unlockWithBiometric],
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}
