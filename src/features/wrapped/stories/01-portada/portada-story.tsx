import { formatNumber } from '../../../../shared/format'
import { t } from '../../../../shared/i18n'
import type { YearSummary } from '../../../../core/model/year-summary'
import { setSeasonName, useSeasonName } from './season-name'

/**
 * Story 01 (BRIEF §6): the season year and the optional name, following the
 * W1 artboard. The name stays in memory only (odd/tasks/h08-stories-01-04.md,
 * decision 5): it is never persisted.
 */
export function PortadaStory({ summary }: { summary: YearSummary }) {
  const copy = t.stories['01-portada']
  const name = useSeasonName()
  const trimmedName = name.trim()

  return (
    <div
      data-testid="story-01-portada"
      className="flex w-full flex-col gap-5 rounded-panel bg-accent p-6 text-ink"
    >
      <p className="font-mono text-[13px] uppercase tracking-[0.14em]">{copy.seasonLabel}</p>
      <p className="font-display text-[104px] leading-[0.86]">{copy.year}</p>
      <div className="h-1.5 bg-ink" aria-hidden="true" />
      <p className="font-display text-3xl uppercase leading-tight">
        {trimmedName === '' ? copy.greetingStandalone : `${trimmedName}, ${copy.greeting}`}
      </p>
      <p className="text-[15px] leading-relaxed">
        {formatNumber(summary.totals.activityCount)}{' '}
        {summary.totals.activityCount === 1 ? copy.introSingular : copy.introPlural}
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="season-name" className="text-sm font-semibold">
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
          className="pointer-events-auto min-h-11 rounded-chip bg-bg px-3 text-[15px] text-fg placeholder:text-fg-subtle"
        />
      </div>
    </div>
  )
}
