import type { ParsedOtpauth } from '../totp/otpauth'
import { addAccount } from './vault'

/**
 * Sample accounts so the app looks alive on first run. The secrets are obviously fake and belong
 * to no real service, and every issuer is labelled "Demo".
 */
export const DEMO_ACCOUNTS: ParsedOtpauth[] = [
  { issuer: 'Demo GitHub', label: 'octocat@example.com', secret: 'DEMODEMODEMODEMO', algorithm: 'SHA1', digits: 6, period: 30 },
  { issuer: 'Demo Google', label: 'jane.doe@example.com', secret: 'FAKEFAKEFAKEFAKE', algorithm: 'SHA1', digits: 6, period: 30 },
  { issuer: 'Demo AWS', label: 'admin-demo', secret: 'NOTREALNOTREAL22', algorithm: 'SHA256', digits: 6, period: 30 },
  { issuer: 'Demo Bank', label: 'account-0000', secret: 'TESTTESTTESTTEST', algorithm: 'SHA1', digits: 8, period: 60 },
]

/** Encrypts and stores the demo accounts, in order, after any existing ones. */
export async function seedDemoAccounts(key: CryptoKey): Promise<void> {
  for (const demo of DEMO_ACCOUNTS) await addAccount(key, demo)
}
