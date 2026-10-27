import type { ReactNode } from 'react'

interface LockLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function LockLayout({ title, subtitle, children }: LockLayoutProps) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <img src="/icon.svg" alt="" width={56} height={56} className="rounded-xl" />
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      </header>
      {children}
    </main>
  )
}
