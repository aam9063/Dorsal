import type { ReactNode } from 'react'
import { t } from '../../../shared/i18n'

/**
 * Bone plates with punched pins, the object language of the stories
 * (design/redesign-2026/03-objeto-dorsal/02-numeros.html): every story renders
 * on one, over the player's ink field, with the accent kept for hero numbers,
 * badge stamps and the stage ribbon.
 */
export const STORY_PLATE =
  'relative flex min-w-0 flex-col rounded-[6px] bg-bone px-5 pb-5 pt-3 text-text-ink shadow-[0_26px_50px_rgba(0,0,0,0.55)] sm:px-6'

/**
 * A punched pin: ink circle with the accent glint inside, set into the plate's
 * top edge as on the bib card.
 */
export const PIN =
  'absolute top-2.5 size-[15px] rounded-full bg-ink shadow-[inset_2.5px_2.5px_4px_rgba(252,82,0,0.45)]'

/**
 * The plate of one story: a bone bib with its two pins. The story keeps its own
 * test id on this element.
 */
export function StoryPlate({
  testId,
  className,
  children,
}: {
  testId: string
  className?: string
  children: ReactNode
}) {
  return (
    <div data-testid={testId} className={`${STORY_PLATE} ${className ?? ''}`}>
      <span aria-hidden="true" className={`${PIN} left-[18px]`} />
      <span aria-hidden="true" className={`${PIN} right-[18px]`} />
      {children}
    </div>
  )
}

/**
 * The editorial spine's numbered header band, inside the plate: display numeral
 * and mono metadata on the same baseline between two hairlines.
 */
export function PlateHead({ number }: { number: string }) {
  return (
    <header className="mb-2 mt-1 flex items-baseline gap-2.5 border-y border-line-light py-1">
      <span
        aria-hidden="true"
        className="font-display text-[34px] leading-[1.1] text-accent-on-bone"
      >
        {number}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-label-ink">
        {t.landing.spineLabel}
      </span>
    </header>
  )
}

/**
 * The story title in the display face, centred as on the artboard.
 */
export function PlateTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-center font-display text-[26px] uppercase leading-[0.95] [text-wrap:balance]">
      {children}
    </h2>
  )
}

/**
 * A torn-edge note panel on the plate, for supporting copy.
 */
export function PlateNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[10px] bg-bone-muted px-3 py-2 text-[13.5px] leading-relaxed text-body-ink [text-wrap:pretty]">
      {children}
    </p>
  )
}

/**
 * A hairline bounded metric block of the stamp grid.
 */
export function Stamp({
  value,
  label,
  children,
}: {
  value: ReactNode
  label: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 border-t-2 border-line-light pt-2">
      <span className="font-display text-[27px] leading-none">{value}</span>
      <span className="text-[11px] leading-tight text-label-ink">{label}</span>
      {children}
    </div>
  )
}

/**
 * A dashed divider with a punched centre hole, bounding the data blocks.
 */
export function PlateDivider() {
  return (
    <div aria-hidden="true" className="relative my-1 border-t-2 border-dashed border-bone-soft">
      <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
    </div>
  )
}

/**
 * The sticker treatment for a highlighted equivalence: the accent pill with the
 * hard little shadow, rotated a few degrees. Position and anchor come together
 * in the caller's `className` so the sticker never fights its own base class.
 */
export function Sticker({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={`z-10 rounded-pill bg-accent px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink shadow-[0_6px_12px_rgba(0,0,0,0.4)] ${className ?? ''}`}
    >
      {children}
    </span>
  )
}
