import { useCallback, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { YearSummary } from '../../../core/model/year-summary'
import { useAutoAdvance, useFocusOnMount, usePrefersReducedMotion } from '../../../shared/hooks'
import { t } from '../../../shared/i18n'
import { availableStories, type StoryDefinition } from '../stories/registry'
import { initialPlayerState, reducePlayer, type PlayerInput } from './player-machine'

/** The automatic advance of BRIEF §7. */
const AUTO_ADVANCE_MS = 7000

/** A pointer held longer than this is a pause gesture, not a tap. */
const TAP_MAX_MS = 300

export interface PlayerProps {
  stories: readonly StoryDefinition[]
  summary: YearSummary
  renderStory: (story: StoryDefinition, summary: YearSummary) => ReactNode
  onClose: () => void
}

/**
 * The story player of BRIEF §7: progress bars for the available stories, tap
 * zones, hold-to-pause, keyboard and close. Every input goes through
 * `reducePlayer`, so tap, keyboard and automatic advance cannot drift apart.
 * Progress bars are derived, one per available story, so an omitted story
 * leaves no gap.
 */
export function Player({ stories, summary, renderStory, onClose }: PlayerProps) {
  const available = availableStories(stories, summary)
  const count = available.length
  const [state, setState] = useState(() => initialPlayerState(count))
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
    enabled: !state.paused && count > 1 && state.index < count - 1,
    delayMs: AUTO_ADVANCE_MS,
    resetKey: state.index,
    onAdvance: goNext,
  })

  if (count === 0) {
    return null
  }
  const story = available[state.index]
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
      data-index={state.index}
      data-paused={state.paused}
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 flex flex-col bg-bg outline-none"
    >
      <div className="flex items-center gap-4 px-5 pt-5 sm:px-8">
        <div
          data-testid="player-progress"
          role="group"
          aria-label={t.player.progressLabel}
          className="flex flex-1 gap-1.5"
        >
          {available.map((barStory, index) => {
            const isPast = index < state.index
            const isCurrent = index === state.index
            const animates = isCurrent && !state.paused && !reducedMotion && count > 1
            return (
              <div
                key={barStory.id}
                data-testid={`player-progress-bar-${barStory.id}`}
                className="h-1 flex-1 overflow-hidden rounded-pill bg-fg/15"
              >
                {(isPast || isCurrent) && (
                  <motion.div
                    key={`${barStory.id}-${state.index}`}
                    className="h-full origin-left bg-accent"
                    initial={{ scaleX: animates ? 0 : 1 }}
                    animate={{ scaleX: 1 }}
                    transition={
                      animates
                        ? { duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }
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
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill border border-line text-2xl leading-none text-fg-muted"
        >
          ×
        </button>
      </div>
      <div
        className="relative flex flex-1 touch-pan-y items-center justify-center overflow-hidden px-8"
        onPointerDown={holdStarted}
        onPointerUp={holdEnded}
        onPointerCancel={holdEnded}
        onPointerLeave={holdEnded}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={`${story.id}-${state.index}`}
            data-testid={`player-story-${story.id}`}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
            className="max-w-md"
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
    </section>
  )
}
