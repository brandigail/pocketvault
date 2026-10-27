import { useEffect, useState } from 'react'
import type { TokenAccount } from '../../types'
import { getAccounts } from '../storage/vaultStore'
import { decodeBase32 } from '../totp/base32'
import { importHmacKey } from '../totp/totp'
import { readSecret } from '../vault/vault'

/** An account paired with its non-extractable HMAC key, ready to generate codes. */
export interface UnlockedAccount {
  account: TokenAccount
  hmacKey: CryptoKey
}

export type AccountsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; accounts: UnlockedAccount[] }

async function unlockAccount(vaultKey: CryptoKey, account: TokenAccount): Promise<UnlockedAccount> {
  const bytes = decodeBase32(await readSecret(vaultKey, account.id))
  const hmacKey = await importHmacKey(bytes, account.algorithm)
  bytes.fill(0)
  return { account, hmacKey }
}

/** Decrypts every account once per unlock. Only the HMAC keys are kept; plaintext secrets are dropped. */
export function useVaultAccounts(vaultKey: CryptoKey): AccountsState {
  const [state, setState] = useState<AccountsState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    getAccounts()
      .then((accounts) => {
        const ordered = [...accounts].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        return Promise.all(ordered.map((account) => unlockAccount(vaultKey, account)))
      })
      .then((unlocked) => {
        if (!cancelled) setState({ status: 'ready', accounts: unlocked })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [vaultKey])

  return state
}
