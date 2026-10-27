import { createContext } from 'react'
import type { UnlockResult } from './vault'

export type VaultStatus = 'loading' | 'error' | 'setup' | 'locked' | 'unlocked'

export interface VaultContextValue {
  status: VaultStatus
  /** The derived key. Held in memory only, and null whenever the vault is not unlocked. */
  key: CryptoKey | null
  lockedUntil: number | null
  /** Creates the vault and unlocks it, optionally filling it with fake demo accounts. */
  setup: (pin: string, withDemo: boolean) => Promise<void>
  unlock: (pin: string) => Promise<UnlockResult>
  lock: () => void
  /** Whether a fingerprint, face or screen lock can unlock this vault. */
  biometricEnabled: boolean
  /** Re-reads whether biometric unlock is on, after the settings screen changes it. */
  refreshBiometric: () => Promise<void>
  /** Resolves to null once unlocked, or to a message to show the user if it did not work. */
  unlockWithBiometric: () => Promise<string | null>
}

export const VaultContext = createContext<VaultContextValue | null>(null)
