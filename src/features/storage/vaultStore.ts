import type { StoredSecret, TokenAccount, VaultMeta } from '../../types'
import { STORES, promisify, withTransaction } from './db'

const META_KEY = 'vault'

export function getAccounts(): Promise<TokenAccount[]> {
  return withTransaction([STORES.accounts], 'readonly', (tx) =>
    promisify(tx.objectStore(STORES.accounts).getAll() as IDBRequest<TokenAccount[]>),
  )
}

export function getSecret(accountId: string): Promise<StoredSecret | undefined> {
  return withTransaction([STORES.secrets], 'readonly', (tx) =>
    promisify(tx.objectStore(STORES.secrets).get(accountId) as IDBRequest<StoredSecret | undefined>),
  )
}

export function getAllSecrets(): Promise<StoredSecret[]> {
  return withTransaction([STORES.secrets], 'readonly', (tx) =>
    promisify(tx.objectStore(STORES.secrets).getAll() as IDBRequest<StoredSecret[]>),
  )
}

/** Saves an account and its encrypted secret atomically, so neither can exist without the other. */
export function saveAccount(account: TokenAccount, secret: StoredSecret): Promise<void> {
  return withTransaction([STORES.accounts, STORES.secrets], 'readwrite', async (tx) => {
    await Promise.all([
      promisify(tx.objectStore(STORES.accounts).put(account)),
      promisify(tx.objectStore(STORES.secrets).put(secret)),
    ])
  })
}

/** Updates account details only (rename, etc.) without touching the secret. */
export function updateAccount(account: TokenAccount): Promise<void> {
  return withTransaction([STORES.accounts], 'readwrite', async (tx) => {
    await promisify(tx.objectStore(STORES.accounts).put(account))
  })
}

/** Updates several accounts in one transaction, e.g. after reordering. Secrets are untouched. */
export function updateAccounts(accounts: TokenAccount[]): Promise<void> {
  return withTransaction([STORES.accounts], 'readwrite', async (tx) => {
    const store = tx.objectStore(STORES.accounts)
    await Promise.all(accounts.map((account) => promisify(store.put(account))))
  })
}

export function deleteAccount(accountId: string): Promise<void> {
  return withTransaction([STORES.accounts, STORES.secrets], 'readwrite', async (tx) => {
    await Promise.all([
      promisify(tx.objectStore(STORES.accounts).delete(accountId)),
      promisify(tx.objectStore(STORES.secrets).delete(accountId)),
    ])
  })
}

export function getMeta(): Promise<VaultMeta | undefined> {
  return withTransaction([STORES.meta], 'readonly', (tx) =>
    promisify(tx.objectStore(STORES.meta).get(META_KEY) as IDBRequest<VaultMeta | undefined>),
  )
}

export function saveMeta(meta: VaultMeta): Promise<void> {
  return withTransaction([STORES.meta], 'readwrite', async (tx) => {
    await promisify(tx.objectStore(STORES.meta).put(meta, META_KEY))
  })
}

/** Wipes every store. Used when the user resets the vault. */
export function clearVault(): Promise<void> {
  return withTransaction([STORES.accounts, STORES.secrets, STORES.meta], 'readwrite', async (tx) => {
    await Promise.all([STORES.accounts, STORES.secrets, STORES.meta].map((name) => promisify(tx.objectStore(name).clear())))
  })
}
