import { useContext } from 'react'
import { VaultContext, type VaultContextValue } from './VaultContext'

export function useVault(): VaultContextValue {
  const value = useContext(VaultContext)
  if (!value) throw new Error('useVault must be used inside VaultProvider')
  return value
}
