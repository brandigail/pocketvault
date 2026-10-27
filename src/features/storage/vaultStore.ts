import type { BiometricRecord, StoredSecret, TokenAccount, VaultMeta } from '../../types'
import { STORES, promisify, withTransaction } from './db'

const META_KEY = 'vault'
const BIOMETRIC_KEY = 'biometric'

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

/** Adds one to an HOTP account's counter in a single transaction, so rapid taps each count. Resolves to the new counter. */
export function incrementCounter(accountId: string): Promise<number> {
  return withTransaction([STORES.accounts], 'readwrite', async (tx) => {
    const store = tx.objectStore(STORES.accounts)
    const account = await promisify(store.get(accountId) as IDBRequest<TokenAccount | undefined>)
    if (!account) throw new Error('Account not found')
    const counter = (account.counter ?? 0) + 1
    await promisify(store.put({ ...account, counter }))
    return counter
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

export function getBiometric(): Promise<BiometricRecord | undefined> {
  return withTransaction([STORES.meta], 'readonly', (tx) =>
    promisify(tx.objectStore(STORES.meta).get(BIOMETRIC_KEY) as IDBRequest<BiometricRecord | undefined>),
  )
}

export function saveBiometric(record: BiometricRecord): Promise<void> {
  return withTransaction([STORES.meta], 'readwrite', async (tx) => {
    await promisify(tx.objectStore(STORES.meta).put(record, BIOMETRIC_KEY))
  })
}

export function clearBiometric(): Promise<void> {
  return withTransaction([STORES.meta], 'readwrite', async (tx) => {
    await promisify(tx.objectStore(STORES.meta).delete(BIOMETRIC_KEY))
  })
}

/** Wipes every store. Used when the user resets the vault. */
export function clearVault(): Promise<void> {
  return withTransaction([STORES.accounts, STORES.secrets, STORES.meta], 'readwrite', async (tx) => {
    await Promise.all([STORES.accounts, STORES.secrets, STORES.meta].map((name) => promisify(tx.objectStore(name).clear())))
  })
}
