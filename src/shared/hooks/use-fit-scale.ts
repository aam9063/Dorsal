import { useEffect, useRef, useState } from 'react'

/**
 * The scale a fixed-size design needs to fit the room it was given. The story
 * cards are authored at one size and the player gives them a box that changes
 * with the window, so they are scaled down instead of scrolled or clipped:
 * `offsetHeight` ignores transforms, so the measurement always reports the
 * design's own height and two passes cannot feed each other.
 *
 * Both refs are observed, because either side can change: the design when the
 * season data changes, the box when the window does. A design that already
 * fits keeps `max` (1 by default) and is never enlarged.
 */
export function useFitScale(min = 0.45, max = 1) {
  const slotRef = useRef<HTMLDivElement | null>(null)
  const designRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(max)

  useEffect(() => {
    const slot = slotRef.current
    const design = designRef.current
    if (slot === null || design === null) {
      return
    }
    const measure = (): void => {
      const available = slot.clientHeight
      const natural = design.offsetHeight
      if (available <= 0 || natural <= 0) {
        return
      }
      const next = Math.min(max, Math.max(min, available / natural))
      setScale((previous) => (Math.abs(previous - next) < 0.005 ? previous : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      return
    }
    const observer = new ResizeObserver(measure)
    observer.observe(slot)
    observer.observe(design)
    return () => {
      observer.disconnect()
    }
  }, [min, max])

  return { slotRef, designRef, scale }
}
