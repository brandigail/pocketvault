interface PinFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'new-password' | 'current-password'
  autoFocus?: boolean
  disabled?: boolean
}

export function PinField({ id, label, value, onChange, autoComplete, autoFocus, disabled }: PinFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        spellCheck={false}
        className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-lg tracking-widest focus:border-teal-600 focus:outline-2 focus:outline-teal-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800"
      />
    </div>
  )
}
