import { useCallback, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { YearSummary } from '../../../core/model/year-summary'
import {
  useAutoAdvance,
  useFocusOnMount,
  usePrefersReducedMotion,
  useT,
} from '../../../shared/hooks'
import { availableStories, AUTO_ADVANCE_BASE_MS, type StoryDefinition } from '../stories/registry'
import { clampIndex, initialPlayerState, reducePlayer, type PlayerInput } from './player-machine'

/** A pointer held longer than this is a pause gesture, not a tap. */
const TAP_MAX_MS = 300

export interface PlayerProps {
  stories: readonly StoryDefinition[]
  summary: YearSummary
  renderStory: (story: StoryDefinition, summary: YearSummary) => ReactNode
  onClose: () => void
}

/**
 * Chip controls of the object language: dashed bone-outline pills over the ink
 * field (design/redesign-2026/03-objeto-dorsal/02-numeros.html, `.zone`).
 */
const ZONE_CHIP =
  'inline-flex min-h-11 items-center gap-1.5 rounded-pill border-[1.5px] border-dashed border-bone-soft px-3.5 text-[13px] font-semibold text-bone transition-colors hover:border-solid disabled:opacity-40'

const ICON_CHIP =
  'inline-flex size-11 items-center justify-center rounded-pill border-[1.5px] border-dashed border-bone-soft text-bone transition-colors hover:border-solid'

const RIBBON =
  'inline-flex shrink-0 -rotate-2 items-center rounded-pill bg-accent px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink shadow-[0_6px_12px_rgba(0,0,0,0.4)]'

/**
 * The story player of BRIEF §7: progress bars for the available stories, tap
 * zones, hold-to-pause, keyboard and close. Every input goes through
 * `reducePlayer`, so tap, keyboard and automatic advance cannot drift apart.
 * Progress bars are derived, one per available story, so an omitted story
 * leaves no gap.
 *
 * The chrome follows the 02-numeros artboard: the stage ribbon and the close
 * chip over the ink field up top, the progress strip and the dashed zone chips
 * below the stage, with the visible back button keeping the H-11 contract.
 */
export function Player({ stories, summary, renderStory, onClose }: PlayerProps) {
  const t = useT()
  const available = availableStories(stories, summary)
  const count = available.length
  const [state, setState] = useState(() => initialPlayerState(count))
  // Render-time clamp: state.index can survive a shrinking available list after
  // mount, and an out-of-range index must show the last story, not nothing
  // (review of H-08). Every render read below uses this clamped index.
  const index = clampIndex(state.index, count)
  const story = available[index]
  const reducedMotion = usePrefersReducedMotion()
  const directionRef = useRef<'forward' | 'back'>('forward')
  const pressedAtRef = useRef<number | null>(null)
  const rootRef = useFocusOnMount<HTMLElement>()

  const send = useCallback(
    (input: PlayerInput) => {
      setState((current) => reducePlayer(current, input, count))
      if (input === 'close') {
        onClose()
      }
    },
    [count, onClose],
  )

  const goNext = useCallback(() => {
    directionRef.current = 'forward'
    send('next')
  }, [send])

  const goPrevious = useCallback(() => {
    directionRef.current = 'back'
    send('previous')
  }, [send])

  useAutoAdvance({
    enabled: !state.paused && count > 1 && index < count - 1,
    delayMs: story?.autoAdvanceMs ?? AUTO_ADVANCE_BASE_MS,
    resetKey: index,
    onAdvance: goNext,
  })

  if (count === 0) {
    return null
  }
  if (story === undefined) {
    return null
  }

  const togglePause = () => {
    if (state.paused) {
      send('resume')
    } else {
      send('pause')
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return
    }
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        goNext()
        break
      case 'ArrowLeft':
        event.preventDefault()
        goPrevious()
        break
      case ' ':
        event.preventDefault()
        togglePause()
        break
      case 'Escape':
        event.preventDefault()
        send('close')
        break
    }
  }

  const holdStarted = () => {
    pressedAtRef.current = performance.now()
    send('pause')
  }
  const holdEnded = () => {
    send('resume')
  }
  const tapOrHold = (advance: () => void) => {
    const pressedAt = pressedAtRef.current
    if (pressedAt !== null && performance.now() - pressedAt > TAP_MAX_MS) {
      return
    }
    advance()
  }

  const slide = directionRef.current === 'forward' ? 48 : -48

  return (
    <section
      data-testid="player-root"
      data-index={index}
      data-paused={state.paused}
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 flex flex-col bg-ink text-bone outline-none"
    >
      <div className="flex items-center gap-3 px-5 pt-4 sm:px-8">
        <span data-testid="player-stage-ribbon" aria-hidden="true" className={RIBBON}>
          {`${t.landing.previews.stageTag} ${index + 1} / ${count}`}
        </span>
        <div
          data-testid="player-progress"
          role="group"
          aria-label={t.player.progressLabel}
          className="ml-auto flex min-w-0 flex-1 justify-end gap-1.5"
        >
          {available.map((barStory, barIndex) => {
            const isPast = barIndex < index
            const isCurrent = barIndex === index
            const animates = isCurrent && !state.paused && !reducedMotion && count > 1
            return (
              <div
                key={barStory.id}
                data-testid={`player-progress-bar-${barStory.id}`}
                className="h-1 flex-1 max-w-16 overflow-hidden rounded-pill bg-dim"
              >
                {(isPast || isCurrent) && (
                  <motion.div
                    key={`${barStory.id}-${index}`}
                    className={`h-full origin-left ${isPast ? 'bg-bone-soft' : 'bg-accent'}`}
                    initial={{ scaleX: animates ? 0 : 1 }}
                    animate={{ scaleX: 1 }}
                    transition={
                      animates
                        ? {
                            duration: (barStory.autoAdvanceMs ?? AUTO_ADVANCE_BASE_MS) / 1000,
                            ease: 'linear',
                          }
                        : { duration: 0 }
                    }
                  />
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          data-testid="player-close"
          aria-label={t.player.close}
          onClick={() => {
            send('close')
          }}
          className={ICON_CHIP}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6 L18 18 M18 6 L6 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center overflow-hidden px-5 py-3 sm:px-8"
        onPointerDown={holdStarted}
        onPointerUp={holdEnded}
        onPointerCancel={holdEnded}
        onPointerLeave={holdEnded}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={`${story.id}-${index}`}
            data-testid={`player-story-${story.id}`}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
            // A story does not own the pointer: taps must reach the advance and
            // back zones underneath. An interactive element inside a story opts
            // back in with `pointer-events-auto`, which is how the portada's name
            // field stays tappable.
            className="pointer-events-none relative z-20 flex max-h-full max-w-md flex-col justify-center"
          >
            {renderStory(story, summary)}
          </motion.div>
        </AnimatePresence>
        <button
          type="button"
          data-testid="player-zone-previous"
          aria-label={t.player.zonePrevious}
          onClick={() => {
            tapOrHold(goPrevious)
          }}
          className="absolute inset-y-0 left-0 z-10 min-h-11 w-1/2 cursor-pointer"
        />
        <button
          type="button"
          data-testid="player-zone-next"
          aria-label={t.player.zoneNext}
          onClick={() => {
            tapOrHold(goNext)
          }}
          className="absolute inset-y-0 right-0 z-10 min-h-11 w-1/2 cursor-pointer"
        />
      </div>
      <nav className="flex flex-col gap-2 px-5 pb-4 pt-1 sm:px-8">
        {(index === 0 || reducedMotion) && (
          <p
            data-testid="player-hint"
            aria-hidden="true"
            className="self-center text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone-soft"
          >
            {t.player.tapHint}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            data-testid="player-back"
            aria-label={t.player.zonePrevious}
            disabled={index === 0}
            onClick={goPrevious}
            className={ZONE_CHIP}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 5 L8 12 L15 19"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t.player.zonePrevious}
          </button>
          <button
            type="button"
            data-testid="player-next"
            aria-label={t.player.zoneNext}
            disabled={index === count - 1}
            onClick={goNext}
            className={ZONE_CHIP}
          >
            {t.player.zoneNext}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 5 L16 12 L9 19"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </nav>
    </section>
  )
}
