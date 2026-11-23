import { useRef, useState, type ReactNode } from 'react'

interface ScrollRowProps {
  /** Accessible name of the scrollable region. */
  label: string
  /** `data-testid` of the scrolling viewport, so tests can drive it. */
  testId?: string
  children: ReactNode
  className?: string
}

interface Thumb {
  widthPercent: number
  offsetPercent: number
}

const FULL: Thumb = { widthPercent: 100, offsetPercent: 0 }

/**
 * A horizontal row with its own scroll indicator. The native bar is hidden on
 * purpose: on most systems it is an overlay that appears while scrolling with
 * the platform's own colours, and on others it is a permanent grey bar with
 * arrows — neither is the product's. This row shows a thin accent bar only while
 * the pointer is over it or something inside it has focus, and the bar's width
 * and position tell where the row is scrolled.
 */
export function ScrollRow({ label, testId, children, className }: ScrollRowProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<Thumb>(FULL)

  const measure = (): void => {
    const viewport = viewportRef.current
    if (viewport === null) {
      return
    }
    const { scrollLeft, clientWidth, scrollWidth } = viewport
    if (scrollWidth <= clientWidth || clientWidth === 0) {
      setThumb(FULL)
      return
    }
    const widthPercent = (clientWidth / scrollWidth) * 100
    const maxOffset = scrollWidth - clientWidth
    setThumb({
      widthPercent,
      offsetPercent: maxOffset === 0 ? 0 : (scrollLeft / maxOffset) * (100 - widthPercent),
    })
  }

  return (
    <div className="group/scroll-row relative">
      <div
        ref={viewportRef}
        data-testid={testId}
        role="group"
        aria-label={label}
        tabIndex={0}
        onScroll={measure}
        onKeyDown={(event) => {
          const viewport = viewportRef.current
          if (viewport === null) {
            return
          }
          if (event.key === 'ArrowRight') {
            viewport.scrollBy({ left: viewport.clientWidth * 0.8 })
            event.stopPropagation()
          }
          if (event.key === 'ArrowLeft') {
            viewport.scrollBy({ left: -viewport.clientWidth * 0.8 })
            event.stopPropagation()
          }
        }}
        className={`scroll-hidden overflow-x-auto ${className ?? ''}`}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        data-testid="scroll-row-track"
        className="mt-2 h-[3px] w-full overflow-hidden rounded-pill bg-line opacity-0 transition-opacity duration-200 group-hover/scroll-row:opacity-100 group-focus-within/scroll-row:opacity-100"
      >
        <div
          data-testid="scroll-row-thumb"
          className="h-full rounded-pill bg-accent transition-[margin,width] duration-150"
          style={{
            width: `${String(thumb.widthPercent)}%`,
            marginLeft: `${String(thumb.offsetPercent)}%`,
          }}
        />
      </div>
    </div>
  )
}
