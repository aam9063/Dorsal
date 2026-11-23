import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from './use-prefers-reduced-motion'

export interface AutoAdvanceOptions {
  enabled: boolean
  delayMs: number
  /** Changing this restarts the interval, e.g. after a manual advance. */
  resetKey: number | string
  onAdvance: () => void
}

/**
 * Calls `onAdvance` every `delayMs` while `enabled`. There is no automatic
 * advance at all under `prefers-reduced-motion: reduce` (BRIEF §7): the
 * media-query check and the interval both live here so no component
 * reimplements them. Re-enabling or a new `resetKey` restarts the countdown.
 */
export function useAutoAdvance({
  enabled,
  delayMs,
  resetKey,
  onAdvance,
}: AutoAdvanceOptions): void {
  const reducedMotion = usePrefersReducedMotion()
  const onAdvanceRef = useRef(onAdvance)

  useEffect(() => {
    onAdvanceRef.current = onAdvance
  })

  useEffect(() => {
    if (!enabled || reducedMotion || delayMs <= 0) {
      return
    }
    const timer = window.setInterval(() => {
      onAdvanceRef.current()
    }, delayMs)
    return () => {
      window.clearInterval(timer)
    }
  }, [enabled, reducedMotion, delayMs, resetKey])
}
