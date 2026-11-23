import { useEffect, useRef, type RefObject } from 'react'

/**
 * Focuses the returned element on mount without scrolling, so keyboard
 * shortcuts work immediately (BRIEF §7: full keyboard navigation). The
 * caller gives the element `tabIndex={-1}` to keep it out of the tab order.
 */
export function useFocusOnMount<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null)

  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])

  return ref
}
