import { createContext } from 'react'
import type { UnlockResult } from './vault'

export type VaultStatus = 'loading' | 'error' | 'setup' | 'locked' | 'unlocked'

export interface VaultContextValue {
  status: VaultStatus
  /** The derived key. Held in memory only, and null whenever the vault is not unlocked. */
  key: CryptoKey | null
  lockedUntil: number | null
  setup: (pin: string) => Promise<void>
  unlock: (pin: string) => Promise<UnlockResult>
  lock: () => void
}

export const VaultContext = createContext<VaultContextValue | null>(null)
