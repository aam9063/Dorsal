import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Tracks the user's `prefers-reduced-motion` setting (BRIEF §7): true when it
 * is `reduce`, updated live while the caller stays mounted. The story player
 * uses it to disable the automatic advance and to collapse transitions.
 */
export function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(QUERY).matches)

  useEffect(() => {
    const query = window.matchMedia(QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
    }
    query.addEventListener('change', onChange)
    return () => {
      query.removeEventListener('change', onChange)
    }
  }, [])

  return reducedMotion
}
