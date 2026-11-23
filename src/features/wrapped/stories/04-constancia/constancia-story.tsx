import { formatNumber } from '../../../../shared/format'
import { t } from '../../../../shared/i18n'
import type { YearSummary } from '../../../../core/model/year-summary'

const LEVEL_CLASSES = ['bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4'] as const

function streakRangeText(from: { month: number; day: number }, to: { month: number; day: number }) {
  const copy = t.stories['04-constancia']
  const fromMonth = t.months[from.month - 1] ?? ''
  const toMonth = t.months[to.month - 1] ?? ''
  return from.month === to.month
    ? `${copy.streakFrom} ${from.day} ${copy.streakTo} ${to.day} ${copy.streakDe} ${toMonth}`
    : `${copy.streakFrom} ${from.day} ${copy.streakDe} ${fromMonth} ${copy.streakTo} ${to.day} ${copy.streakDe} ${toMonth}`
}

/**
 * Story 04 (BRIEF §6): the daily heatmap in four quartile levels, the longest
 * streak with its date range and the favourite weekday, all from
 * `summary.consistency`. The grid is presentational — one `role="img"` summary
 * describes it and no cell is focusable (odd/tasks/h08-stories-01-04.md,
 * decision 3); the legend names the levels so colour never carries the
 * information alone.
 */
export function ConstanciaStory({ summary }: { summary: YearSummary }) {
  const copy = t.stories['04-constancia']
  const consistency = summary.consistency
  if (consistency === null) {
    // The worker only opens the wrapped with at least one activity, so this
    // cannot happen; the schema still allows it.
    return null
  }

  const cellsByMonth: (number | undefined)[][] = Array.from({ length: 12 }, () =>
    Array<number | undefined>(31).fill(undefined),
  )
  for (const day of consistency.heatmap) {
    const monthRow = cellsByMonth[day.month - 1]
    if (monthRow !== undefined) {
      monthRow[day.day - 1] = day.level
    }
  }

  const streak = consistency.longestStreak
  const weekday = t.weekdays[consistency.favoriteWeekday.weekday] ?? ''
  const weeks = consistency.favoriteWeekday.weeks

  return (
    <div data-testid="story-04-constancia" className="flex w-full flex-col gap-5">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">{copy.title}</p>

      <div className="flex flex-col gap-1">
        <span className="text-[17px] text-fg-muted">{copy.intro}</span>
        <span className="flex items-baseline gap-2.5">
          <span
            data-testid="constancia-active-days"
            className="font-display text-8xl leading-none text-accent-text"
          >
            {formatNumber(summary.totals.activeDays)}
          </span>
          <span className="font-display text-2xl uppercase">{copy.activeDaysSuffix}</span>
        </span>
      </div>

      <div
        data-testid="constancia-heatmap"
        role="img"
        aria-label={copy.heatmapAria}
        className="flex flex-col gap-1.5"
      >
        {cellsByMonth.map((row, monthIndex) => (
          <div key={monthIndex} className="flex items-center gap-2">
            <span className="w-8 font-mono text-[10px] tracking-[0.08em] text-fg-subtle">
              {t.monthsShort[monthIndex] ?? ''}
            </span>
            <div className="grid flex-1 grid-cols-[repeat(31,minmax(0,1fr))] gap-[2px]">
              {row.map((level, dayIndex) =>
                level === undefined ? (
                  <span key={dayIndex} aria-hidden="true" className="aspect-square" />
                ) : (
                  <span
                    key={dayIndex}
                    data-testid={`constancia-cell-${monthIndex + 1}-${dayIndex + 1}`}
                    aria-hidden="true"
                    className={`aspect-square rounded-[2px] ${LEVEL_CLASSES[level - 1] ?? LEVEL_CLASSES[0]}`}
                  />
                ),
              )}
            </div>
          </div>
        ))}
        <div
          data-testid="constancia-legend"
          className="mt-1 flex items-center gap-1.5 self-end text-[11px] text-fg-subtle"
        >
          <span>{copy.legendLess}</span>
          <span aria-hidden="true" className="flex items-center gap-1">
            {LEVEL_CLASSES.map((levelClass) => (
              <span key={levelClass} className={`size-2.5 rounded-[2px] ${levelClass}`} />
            ))}
          </span>
          <span>{copy.legendMore}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3 rounded-panel bg-surface p-4">
          <span className="min-w-14 font-display text-4xl leading-none text-accent-text">
            {formatNumber(streak.days)}
          </span>
          <span className="text-sm leading-snug text-fg-muted">
            <strong className="text-fg">
              {streak.days} {streak.days === 1 ? copy.streakUnitSingular : copy.streakUnit}
              {streak.from !== null && streak.to !== null ? ',' : '.'}
            </strong>{' '}
            {streak.from !== null && streak.to !== null && (
              <>{streakRangeText(streak.from, streak.to)}. </>
            )}
            {copy.streakTail}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-panel bg-surface p-4">
          <span className="min-w-14 font-display text-4xl leading-none text-accent-text">
            {formatNumber(weeks)}
          </span>
          <span className="text-sm leading-snug text-fg-muted">
            <strong className="text-fg">{weekday}</strong> {copy.weekdayLead}{' '}
            <span data-testid="constancia-favorite-weekday-weeks">{formatNumber(weeks)}</span>{' '}
            {weeks === 1 ? copy.weekSingular : copy.weekPlural}.
          </span>
        </div>
      </div>
    </div>
  )
}
