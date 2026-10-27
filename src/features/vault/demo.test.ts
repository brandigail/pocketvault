import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { clearVault, getAccounts, getAllSecrets } from '../storage/vaultStore'
import { decodeBase32 } from '../totp/base32'
import { DEMO_ACCOUNTS, seedDemoAccounts } from './demo'
import { setupVault } from './vault'

describe('demo accounts', () => {
  beforeEach(clearVault)

  it('are all labelled Demo and use valid, obviously fake secrets', () => {
    for (const demo of DEMO_ACCOUNTS) {
      expect(demo.issuer.startsWith('Demo')).toBe(true)
      expect(() => decodeBase32(demo.secret)).not.toThrow()
    }
  })

  it('are stored encrypted, in order', async () => {
    const key = await setupVault('482915')
    await seedDemoAccounts(key)

    const accounts = (await getAccounts()).sort((a, b) => a.sortOrder - b.sortOrder)
    expect(accounts.map((a) => a.issuer)).toEqual(DEMO_ACCOUNTS.map((d) => d.issuer))
    expect(await getAllSecrets()).toHaveLength(DEMO_ACCOUNTS.length)

    const persisted = JSON.stringify([accounts, await getAllSecrets()])
    for (const demo of DEMO_ACCOUNTS) expect(persisted).not.toContain(demo.secret)
  })
})
