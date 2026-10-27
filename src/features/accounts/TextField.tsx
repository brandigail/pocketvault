import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

export function TextField({ id, label, value, onChange, ...rest }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-lg border border-slate-300 bg-white px-3 focus:border-teal-600 focus:outline-2 focus:outline-teal-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800"
        {...rest}
      />
    </div>
  )
}
