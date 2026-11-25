import { formatNumber } from '../../../../shared/format'
import { useT } from '../../../../shared/hooks'
import type { YearSummary } from '../../../../core/model/year-summary'
import { PlateHead, StoryPlate } from '../story-plate'
import { setSeasonName, useSeasonName } from './season-name'

/**
 * Story 01 (BRIEF §6): the cover on its bone plate, the season year as the
 * display hero over the editorial spine's numbered band, and the optional name
 * field in a note panel. The name stays in memory only
 * (odd/tasks/h08-stories-01-04.md, decision 5): it is never persisted.
 */
export function PortadaStory({ summary }: { summary: YearSummary }) {
  const t = useT()
  const copy = t.stories['01-portada']
  const name = useSeasonName()
  const trimmedName = name.trim()

  return (
    <StoryPlate testId="story-01-portada" className="gap-3">
      <PlateHead number="01" />
      <div className="mt-3 flex flex-col items-center gap-2 text-center">
        <p className="font-display text-[clamp(84px,24vw,110px)] leading-[0.86] text-ink">
          {copy.year}
        </p>
        <div aria-hidden="true" className="w-full border-t-2 border-ink" />
        <p className="font-display text-2xl uppercase leading-tight">
          {trimmedName === '' ? copy.greetingStandalone : `${trimmedName}, ${copy.greeting}`}
        </p>
        <p className="text-[15px] leading-relaxed text-body-ink [text-wrap:pretty]">
          {formatNumber(summary.totals.activityCount)}{' '}
          {summary.totals.activityCount === 1 ? copy.introSingular : copy.introPlural}
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-1.5 rounded-[10px] bg-bone-muted px-3 py-2.5">
        <label
          htmlFor="season-name"
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-label-ink"
        >
          {copy.nameLabel}
        </label>
        <input
          id="season-name"
          type="text"
          value={name}
          maxLength={30}
          autoComplete="off"
          onChange={(event) => {
            setSeasonName(event.target.value)
          }}
          onKeyDown={(event) => {
            // The player listens for these keys on its root; while typing the
            // name they must move the caret or type a space, not change story.
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === ' ') {
              event.stopPropagation()
            }
          }}
          placeholder={copy.namePlaceholder}
          data-testid="portada-name-input"
          className="pointer-events-auto min-h-11 rounded-chip bg-bone px-3 text-[15px] text-text-ink placeholder:text-label-ink"
        />
      </div>
    </StoryPlate>
  )
}
