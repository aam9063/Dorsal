import { useEffect, type RefObject } from 'react'

/**
 * Lets a vertical mouse wheel move a horizontal row.
 *
 * A row that hides its native bar is unusable with a plain mouse: the wheel
 * only scrolls vertically and shift-wheel is a habit, not a guarantee. The
 * gesture is borrowed only while the row can still move that way, so the page
 * keeps scrolling when the row is already at its end — never trapping the
 * reader inside a strip.
 */
export function useHorizontalWheel(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = ref.current
    if (element === null) {
      return
    }
    const onWheel = (event: WheelEvent): void => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return
      }
      const max = element.scrollWidth - element.clientWidth
      if (max <= 0) {
        return
      }
      const towardsEnd = event.deltaY > 0
      const canMove = towardsEnd ? element.scrollLeft < max - 1 : element.scrollLeft > 1
      if (!canMove) {
        return
      }
      event.preventDefault()
      element.scrollLeft = Math.max(0, Math.min(max, element.scrollLeft + event.deltaY))
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      element.removeEventListener('wheel', onWheel)
    }
  }, [ref])
}
