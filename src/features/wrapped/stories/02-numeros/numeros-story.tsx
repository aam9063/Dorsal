import type { ReactNode } from 'react'
import { formatDuration, formatKilometres, formatNumber } from '../../../../shared/format'
import { t } from '../../../../shared/i18n'
import type { YearSummary } from '../../../../core/model/year-summary'

/** Triangle mark of the Everest equivalence, following the W2 artboard. */
function EverestMark({ fraction }: { fraction: number }) {
  const width = fraction * 26
  const edgeY = width <= 13 ? (22 * (13 - width)) / 13 : ((width - 13) * 22) / 13
  return (
    <svg
      width={Math.max(width, 1)}
      height={22}
      viewBox={`0 0 ${width.toFixed(2)} 22`}
      aria-hidden="true"
      className="fill-accent"
    >
      <path d={`M0 22 L13 0 L${width.toFixed(2)} ${edgeY.toFixed(2)} L${width.toFixed(2)} 22 Z`} />
    </svg>
  )
}

function Stat({
  testId,
  value,
  label,
  children,
}: {
  testId?: string
  value: ReactNode
  label: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 border-t-2 border-line pt-3">
      <span data-testid={testId} className="font-display text-4xl leading-none">
        {value}
      </span>
      <span className="text-[13px] text-fg-subtle">{label}</span>
      {children}
    </div>
  )
}

/**
 * Story 02 (BRIEF §6): distance, moving time, activities, active days,
 * elevation, the track-lap and Everest equivalences and the per-sport time
 * split, all straight from `summary.totals` — the story never recomputes
 * (odd/tasks/h08-stories-01-04.md, decision 1). Composition follows the W2
 * artboard; the artboard's numbers are fictional and replaced by the real ones.
 */
export function NumerosStory({ summary }: { summary: YearSummary }) {
  const copy = t.stories['02-numeros']
  const { totals } = summary
  const laps = Math.round(totals.trackLaps)
  const everests = Math.round(totals.everests * 10) / 10
  const wholeEverests = Math.floor(totals.everests)
  const everestFraction = totals.everests - wholeEverests

  return (
    <div data-testid="story-02-numeros" className="flex w-full flex-col gap-6">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">{copy.title}</p>

      <div className="flex flex-col">
        <span className="text-[17px] text-fg-muted">{copy.intro}</span>
        <span
          data-testid="numeros-distance"
          className="font-display text-8xl leading-none text-accent-text"
        >
          {formatKilometres(totals.distanceM)}
        </span>
        <span className="font-display text-3xl uppercase leading-tight">
          {copy.kilometresLabel}
        </span>
      </div>

      <p className="rounded-panel bg-surface p-4 text-[15px] leading-relaxed text-fg-muted">
        {copy.lapsLead}{' '}
        <strong className="text-fg">
          <span data-testid="numeros-laps">{formatNumber(laps)}</span>{' '}
          {laps === 1 ? copy.lapsUnitSingular : copy.lapsUnit}
        </strong>{' '}
        {copy.lapsTail}
      </p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        <Stat
          testId="numeros-moving-time"
          value={formatDuration(totals.movingTimeS)}
          label={copy.movingTimeLabel}
        />
        <Stat
          testId="numeros-activities"
          value={formatNumber(totals.activityCount)}
          label={copy.activitiesLabel}
        >
          <span className="text-[13px] text-fg-subtle">
            <span data-testid="numeros-active-days">{formatNumber(totals.activeDays)}</span>{' '}
            {copy.activeDaysSuffix}
          </span>
        </Stat>
        <div className="col-span-2 flex items-end justify-between gap-3 border-t-2 border-line pt-3">
          <div className="flex flex-col gap-1">
            <span className="font-display text-4xl leading-none">
              <span data-testid="numeros-elevation">{formatNumber(totals.elevationGainM)}</span>{' '}
              <span className="text-2xl">m</span>
            </span>
            <span className="text-[13px] text-fg-subtle">{copy.elevationLabel}</span>
          </div>
          <span
            role="img"
            aria-label={`${formatNumber(everests)} ${copy.everestAria}`}
            className="flex items-end gap-[3px]"
          >
            {Array.from({ length: wholeEverests }, (_, index) => (
              <EverestMark key={index} fraction={1} />
            ))}
            {everestFraction >= 0.05 && <EverestMark fraction={everestFraction} />}
          </span>
        </div>
        <p className="col-span-2 text-right font-display text-2xl uppercase text-accent-text">
          = <span data-testid="numeros-everests">{formatNumber(everests)}</span> {copy.everestUnit}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
          {copy.sportSplitTitle}
        </p>
        <ul
          data-testid="numeros-sport-split"
          role="img"
          aria-label={[
            copy.sportSplitAriaLead,
            ...totals.bySport.map((row) => {
              const share = Math.round(row.share * 100)
              return `${t.sports[row.sport]} ${formatNumber(share)} %`
            }),
          ].join(' ')}
          className="flex flex-col gap-2"
        >
          {totals.bySport.map((row) => {
            const share = Math.round(row.share * 100)
            return (
              <li key={row.sport} className="flex items-center gap-3">
                <span className="min-w-[7rem] text-sm text-fg">{t.sports[row.sport]}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-dim">
                  <span className="block h-full bg-accent" style={{ width: `${share}%` }} />
                </span>
                <span className="w-14 text-right font-mono text-xs tabular-nums text-fg-muted">
                  {formatNumber(share)} %
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
