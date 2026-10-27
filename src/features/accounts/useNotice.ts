import { useCallback, useEffect, useRef, useState } from 'react'

const NOTICE_MS = 1800

/** A short-lived message, such as "Copied". Showing a new one replaces the old. */
export function useNotice(): [string | null, (message: string) => void] {
  const [notice, setNotice] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = useCallback((message: string) => {
    window.clearTimeout(timer.current)
    setNotice(message)
    timer.current = window.setTimeout(() => setNotice(null), NOTICE_MS)
  }, [])

  return [notice, show]
}
