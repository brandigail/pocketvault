import { useState, type FormEvent } from 'react'
import type { TotpAlgorithm } from '../../types'
import type { ParsedOtpauth } from '../totp/otpauth'
import { toAccountInput, type ManualEntry } from './manualEntry'
import { TextField } from './TextField'

interface ManualFormProps {
  disabled: boolean
  onSubmit: (input: ParsedOtpauth) => void
  onError: (message: string) => void
}

const INITIAL: ManualEntry = { issuer: '', label: '', secret: '', algorithm: 'SHA1', digits: 6, period: '30' }
const SELECT_CLASS =
  'h-12 min-w-0 rounded-lg border text-base border-slate-300 bg-white px-2 focus:border-teal-600 focus:outline-2 focus:outline-teal-600 dark:border-slate-600 dark:bg-slate-800'

export function ManualForm({ disabled, onSubmit, onError }: ManualFormProps) {
  const [entry, setEntry] = useState<ManualEntry>(INITIAL)
  const update = <K extends keyof ManualEntry>(field: K, value: ManualEntry[K]) => setEntry((current) => ({ ...current, [field]: value }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      onSubmit(toAccountInput(entry))
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Check the details and try again')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField id="issuer" label="Service" value={entry.issuer} onChange={(v) => update('issuer', v)} placeholder="GitHub" autoComplete="off" disabled={disabled} />
      <TextField id="label" label="Account" value={entry.label} onChange={(v) => update('label', v)} placeholder="you@example.com" autoComplete="off" disabled={disabled} />
      <TextField
        id="secret"
        label="Secret key"
        value={entry.secret}
        onChange={(v) => update('secret', v)}
        placeholder="JBSW Y3DP EHPK 3PXP"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={disabled}
        className="h-12 rounded-lg border border-slate-300 bg-white px-3 font-mono focus:border-teal-600 focus:outline-2 focus:outline-teal-600 dark:border-slate-600 dark:bg-slate-800"
      />

      <details className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        <summary className="cursor-pointer py-3.5 text-sm font-medium">Advanced</summary>
        <div className="mt-3 grid grid-cols-[5fr_3fr_4fr] gap-2">
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
            Algorithm
            <select value={entry.algorithm} onChange={(e) => update('algorithm', e.target.value as TotpAlgorithm)} className={SELECT_CLASS} disabled={disabled}>
              <option value="SHA1">SHA-1</option>
              <option value="SHA256">SHA-256</option>
              <option value="SHA512">SHA-512</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
            Digits
            <select value={entry.digits} onChange={(e) => update('digits', e.target.value === '8' ? 8 : 6)} className={SELECT_CLASS} disabled={disabled}>
              <option value={6}>6</option>
              <option value={8}>8</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
            Period (s)
            <input value={entry.period} onChange={(e) => update('period', e.target.value)} inputMode="numeric" className={SELECT_CLASS} disabled={disabled} />
          </label>
        </div>
      </details>

      <button type="submit" disabled={disabled} className="h-12 rounded-lg bg-teal-700 font-medium text-white hover:bg-teal-800 disabled:opacity-60">
        {disabled ? 'Encrypting…' : 'Add account'}
      </button>
    </form>
  )
}
