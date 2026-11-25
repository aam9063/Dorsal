import { useRef, useState } from 'react'
import {
  BibCardPreview,
  CarnetPreview,
  bibCardActionLabel,
  seasonCardActionLabel,
  shareOrDownloadBibCard,
  shareOrDownloadSeasonCard,
} from '../../../share'
import type { YearSummary } from '../../../../core/model/year-summary'
import { useFitScale, useLocale, useT } from '../../../../shared/hooks'
import { useSeasonName } from '../01-portada/season-name'
import { cycleCardSelection, type CardSelection } from './card-selection'

/**
 * Story 08 (BRIEF §6, odd/tasks/h11b-season-cards.md T8): both cards reachable
 * through one segmented toggle and one action whose label states what will
 * actually happen in this browser — share the PNG file where the Web Share API
 * supports files, download it otherwise. The toggle is a real radiogroup (the
 * arrow keys move the selection and the focus follows it), not divs with
 * onClick, and it exists because the story is a fixed-height mobile screen two
 * 1080×1920 cards cannot fit at once. Each PNG is painted on demand when the
 * button is pressed, so opening the story draws nothing (h11 decision 6).
 *
 * In the object language of the redesign this story is the meta stage: the one
 * full-accent field, like the landing's privacy strip, with the meta label
 * bounded by a hairline and the hard offset shadow on the action chip.
 */
export function DorsalStory({ summary }: { summary: YearSummary }) {
  const t = useT()
  const locale = useLocale()
  const copy = t.stories['08-dorsal']
  const name = useSeasonName()
  const trimmedName = name.trim()
  const cardName = trimmedName === '' ? null : trimmedName
  const [selection, setSelection] = useState<CardSelection>('dorsal')
  const [busy, setBusy] = useState(false)
  const storyRef = useRef<HTMLDivElement>(null)
  const { slotRef, designRef, scale, width: cardWidth } = useFitScale()
  const radioRefs = useRef(new Map<CardSelection, HTMLButtonElement>())
  const isDorsal = selection === 'dorsal'
  const label = isDorsal ? bibCardActionLabel(locale) : seasonCardActionLabel(locale)
  const hint = isDorsal ? copy.actionHint : copy.carnet.actionHint

  const CARDS = [
    { id: 'dorsal' as const, testId: 'card-toggle-dorsal', text: copy.toggleDorsal },
    { id: 'carnet' as const, testId: 'card-toggle-carnet', text: copy.toggleCarnet },
  ]

  function select(value: CardSelection): void {
    setSelection(value)
    radioRefs.current.get(value)?.focus()
  }

  /** The radiogroup pattern: the arrows move and select, other keys untouched. */
  function handleKeyDown(event: React.KeyboardEvent): void {
    const next = cycleCardSelection(selection, event.key)
    if (next === selection) {
      return
    }
    event.preventDefault()
    select(next)
  }

  return (
    <div
      ref={storyRef}
      data-testid="story-08-dorsal"
      // The focus target after a card action: reachable programmatically only,
      // so the shortcuts of the player keep working without a mouse.
      tabIndex={-1}
      className="flex min-h-0 w-full flex-col gap-2 self-stretch rounded-[6px] bg-accent p-5 text-ink shadow-[0_26px_50px_rgba(0,0,0,0.55)] outline-none"
    >
      <p className="shrink-0 border-b-2 border-dashed border-ink/50 pb-2 font-mono text-[11px] uppercase tracking-[0.14em]">
        {copy.eyebrow}
      </p>

      {/* The player clips anything taller than the screen, so the card scrolls
          inside its own slot instead of disappearing behind the chrome. It opts
          back into pointer events so the scroll reaches it. */}
      {/* The card is authored at one size and the player's box changes with the
          window, so it is scaled to fit instead of scrolled or clipped. */}
      <div
        ref={slotRef}
        className="flex min-h-0 max-h-[52dvh] flex-1 items-start justify-center overflow-hidden rounded-chip py-1"
      >
        <div ref={designRef} className="origin-top" style={{ transform: `scale(${scale})` }}>
          {isDorsal ? (
            <BibCardPreview summary={summary} name={cardName} cardWidth={cardWidth} />
          ) : (
            <CarnetPreview summary={summary} name={cardName} />
          )}
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={copy.toggleGroupLabel}
        className="pointer-events-auto flex shrink-0 gap-1 self-center rounded-pill bg-ink/15 p-1"
        onKeyDown={handleKeyDown}
      >
        {CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            role="radio"
            aria-checked={selection === card.id}
            tabIndex={selection === card.id ? 0 : -1}
            data-testid={card.testId}
            ref={(element) => {
              if (element !== null) {
                radioRefs.current.set(card.id, element)
              }
            }}
            className={`min-h-11 rounded-pill px-4 font-sans text-sm font-bold ${
              selection === card.id ? 'bg-ink text-bone' : 'text-ink'
            }`}
            onClick={() => {
              select(card.id)
            }}
          >
            {card.text}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-2">
        <button
          type="button"
          data-testid="share-download"
          aria-busy={busy}
          disabled={busy}
          className="pointer-events-auto inline-flex min-h-14 items-center justify-center rounded-chip bg-ink font-mono text-[13px] font-bold uppercase tracking-[0.1em] text-bone shadow-[4px_4px_0_var(--color-bone)] transition-shadow hover:shadow-[5px_5px_0_var(--color-bone)] aria-busy:opacity-70"
          onClick={() => {
            const action = isDorsal
              ? shareOrDownloadBibCard({ summary, name: cardName, locale })
              : shareOrDownloadSeasonCard({ summary, name: cardName, locale })
            // The download lands on the player's keydown handler: sharing or
            // downloading moves the focus out of the player section, so the
            // focus comes back to the story root before the busy state clears
            // (success, failure and user cancellation all end in `finally`).
            const restoreFocus = (): void => {
              storyRef.current?.focus({ preventScroll: true })
            }
            setBusy(true)
            action
              .catch(() => {
                restoreFocus()
                setBusy(false)
              })
              .finally(() => {
                restoreFocus()
                setBusy(false)
              })
          }}
        >
          {label}
        </button>
        <p className="text-center text-[12px] text-ink [text-wrap:pretty]">{hint}</p>
      </div>
    </div>
  )
}
