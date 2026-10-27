const RADIUS = 16
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const URGENT_SECONDS = 5

interface CountdownRingProps {
  /** Share of the period still left, from 1 down to 0. */
  fraction: number
  secondsLeft: number
}

export function CountdownRing({ fraction, secondsLeft }: CountdownRingProps) {
  const urgent = secondsLeft <= URGENT_SECONDS
  return (
    <div className="relative h-11 w-11 shrink-0" role="img" aria-label={`${secondsLeft} seconds left`}>
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle cx="20" cy="20" r={RADIUS} fill="none" strokeWidth="4" className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className={`transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none ${urgent ? 'stroke-red-500' : 'stroke-teal-600'}`}
        />
      </svg>
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center text-xs font-medium tabular-nums ${urgent ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}
      >
        {secondsLeft}
      </span>
    </div>
  )
}
