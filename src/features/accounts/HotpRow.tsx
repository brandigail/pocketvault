import type { TokenAccount } from '../../types'
import { formatCode } from '../totp/totp'
import { useHotpCode } from './useHotpCode'
import type { UnlockedAccount } from './useVaultAccounts'

interface HotpRowProps {
  entry: UnlockedAccount
  onCopy: (code: string) => void
  onNext: (account: TokenAccount) => void
}

/** A counter-based account: the code only changes when the user asks for the next one. */
export function HotpRow({ entry, onCopy, onNext }: HotpRowProps) {
  const { account, hmacKey } = entry
  const counter = account.counter ?? 0
  const code = useHotpCode(hmacKey, account.digits, counter)
  const name = account.issuer || account.label

  return (
    <li className="flex items-stretch gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        disabled={!code}
        onClick={() => code && onCopy(code)}
        aria-label={code ? `Copy code for ${name} ${account.issuer ? account.label : ''}`.trim() : `Loading code for ${name}`}
        className="min-w-0 flex-1 rounded-lg p-2 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-teal-600 dark:hover:bg-slate-700"
      >
        <span className="block truncate font-medium">{name}</span>
        {account.issuer && <span className="block truncate text-sm text-slate-500 dark:text-slate-400">{account.label}</span>}
        <span className="mt-1 block font-mono text-3xl font-semibold tracking-wider text-teal-700 tabular-nums dark:text-teal-400">
          {code ? formatCode(code) : '••• •••'}
        </span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">Counter-based · code {counter}</span>
      </button>
      <button
        type="button"
        onClick={() => onNext(account)}
        aria-label={`Next code for ${name}`}
        className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-300 text-xs font-medium hover:border-teal-600 dark:border-slate-600"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ↻
        </span>
        Next
      </button>
    </li>
  )
}
