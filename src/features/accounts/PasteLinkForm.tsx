import { useState, type FormEvent } from 'react'
import { parseOtpauthUri, type ParsedOtpauth } from '../totp/otpauth'

interface PasteLinkFormProps {
  disabled: boolean
  onSubmit: (input: ParsedOtpauth) => void
  onError: (message: string) => void
}

export function PasteLinkForm({ disabled, onSubmit, onError }: PasteLinkFormProps) {
  const [uri, setUri] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      onSubmit(parseOtpauthUri(uri))
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not read that link')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="otpauth-uri" className="text-sm font-medium">
          otpauth link
        </label>
        <textarea
          id="otpauth-uri"
          value={uri}
          onChange={(event) => setUri(event.target.value)}
          rows={4}
          placeholder="otpauth://totp/Example:you@example.com?secret=..."
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm focus:border-teal-600 focus:outline-2 focus:outline-teal-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Services show this link under the QR code, often as &quot;can&apos;t scan?&quot; or &quot;setup key&quot;.
        </p>
      </div>
      <button
        type="submit"
        disabled={disabled || !uri.trim()}
        className="h-12 rounded-lg bg-teal-700 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {disabled ? 'Encrypting…' : 'Add account'}
      </button>
    </form>
  )
}
