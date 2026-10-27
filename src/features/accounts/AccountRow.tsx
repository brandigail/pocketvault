import { formatCode, secondsRemaining } from '../totp/totp'
import { CountdownRing } from './CountdownRing'
import { useTotpCode } from './useTotpCode'
import type { UnlockedAccount } from './useVaultAccounts'

interface AccountRowProps {
  entry: UnlockedAccount
  now: number
  onCopy: (code: string) => void
}

export function AccountRow({ entry, now, onCopy }: AccountRowProps) {
  const { account, hmacKey } = entry
  const code = useTotpCode(hmacKey, account.digits, account.period, now)

  const periodMs = account.period * 1000
  const fraction = 1 - (now % periodMs) / periodMs
  const name = account.issuer || account.label

  return (
    <li>
      <button
        type="button"
        disabled={!code}
        onClick={() => code && onCopy(code)}
        aria-label={code ? `Copy code for ${name} ${account.issuer ? account.label : ''}`.trim() : `Loading code for ${name}`}
        className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-teal-600 focus-visible:outline-2 focus-visible:outline-teal-600 active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{name}</span>
          {account.issuer && <span className="block truncate text-sm text-slate-500 dark:text-slate-400">{account.label}</span>}
          <span className="mt-1 block font-mono text-3xl font-semibold tracking-wider text-teal-700 tabular-nums dark:text-teal-400">
            {code ? formatCode(code) : '••• •••'}
          </span>
        </span>
        <CountdownRing fraction={fraction} secondsLeft={secondsRemaining(account.period, now)} />
      </button>
    </li>
  )
}
