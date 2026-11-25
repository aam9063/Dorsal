import { MIN_SESSIONS_PER_WEEK } from '../../core/metrics/weekly-load'
import type { YearSummary } from '../../core/model/year-summary'
import { formatKilometres, formatNumber } from '../../shared/format'
import { useLocale, useT } from '../../shared/hooks'
import { fulfilledWeeksSentenceFor, powerCoverageSentenceFor } from '../../shared/i18n'
import {
  bibCardMarkRows,
  bibCardNameText,
  monthDayText,
  CARD_STAGE_NUMERAL,
} from './render-bib-card'
import { sportIconPaths } from './sport-icons'

/**
 * The carnet as the story shows it: a DOM replica of `drawSeasonCard`, so the
 * story never paints a canvas (h11 decision 6) and both cards render before
 * any PNG is requested. It mirrors the redesigned composition block for block
 * — punched pins, editorial spine head, title, name, the dashed tear-off with
 * its punched hole, the sport split with its accent stamp for the most
 * practiced sport, the weeks, the best marks and the power evolution — and
 * reads every string from the same helpers the canvas draw uses
 * (`bibCardNameText`, `bibCardMarkRows`, `monthDayText`, `t.sports`, the
 * format helpers and the two sentences of `src/shared/i18n/`), so copy and
 * numbers cannot drift apart between the two surfaces. It reads the copy
 * through the reactive `useT()` and hands the same locale to the helpers, so
 * a language switch re-renders it in the chosen language (odd/tasks/
 * i18n-english.md, decision 5).
 */
export function CarnetPreview({ summary, name }: { summary: YearSummary; name: string | null }) {
  const locale = useLocale()
  const t = useT()
  const copy = t.stories['08-dorsal'].carnet
  const sports = summary.sportBreakdown?.sports ?? null
  const maxShare = (sports ?? []).reduce((acc, row) => Math.max(acc, row.share), 0)
  const marks = bibCardMarkRows(summary, locale)
  const weeklyLoad = summary.weeklyLoad
  const power = summary.powerProfile
  const showPower = summary.availability.powerProfile && power !== null

  const wattsByMonth = new Map<number, number>()
  let maxWatts = 0
  if (power !== null) {
    for (const entry of power.months) {
      const watts = entry.bestWeightedAvgPowerW
      if (watts === null) {
        continue
      }
      wattsByMonth.set(entry.month, watts)
      if (watts > maxWatts) {
        maxWatts = watts
      }
    }
  }
  let peakMonth = 0
  let peakWatts = 0
  for (const [month, watts] of wattsByMonth) {
    if (watts > peakWatts) {
      peakWatts = watts
      peakMonth = month
    }
  }

  return (
    <div
      role="group"
      aria-label={copy.previewLabel}
      data-testid="carnet-preview"
      className="relative flex w-[86%] max-w-sm flex-col gap-2.5 rounded-[6px] bg-bone p-4 pt-2.5 text-ink shadow-xl"
    >
      <span
        aria-hidden="true"
        className="absolute left-[14px] top-2.5 size-3 rounded-full bg-ink shadow-[inset_2px_2px_3px_rgba(252,82,0,0.45)]"
      />
      <span
        aria-hidden="true"
        className="absolute right-[14px] top-2.5 size-3 rounded-full bg-ink shadow-[inset_2px_2px_3px_rgba(252,82,0,0.45)]"
      />

      <div data-testid="carnet-header">
        <header className="mt-1 flex items-baseline gap-2 border-y border-line-light py-1">
          <span aria-hidden="true" className="font-display text-lg leading-none">
            {CARD_STAGE_NUMERAL}
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-label-ink">
            {t.stories['08-dorsal'].plate}
          </span>
        </header>
        <div className="mt-1.5 font-display text-2xl leading-none uppercase">{copy.title}</div>
        <div className="mt-1 text-[13px] font-bold uppercase tracking-[0.2em]">
          {bibCardNameText(name, locale)}
        </div>
      </div>

      <div aria-hidden="true" className="relative border-t-2 border-dashed border-bone-soft">
        <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
      </div>

      {sports === null || sports.length === 0 ? null : (
        <div data-testid="carnet-sports" className="flex flex-col gap-1.5">
          <div className="flex">
            <span className="inline-flex -rotate-[2.5deg] items-center rounded-pill bg-accent px-2.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-ink">
              {copy.mostPracticedLabel}
            </span>
          </div>
          {sports.map((row, index) => (
            <div key={row.sport} className="flex items-start gap-2">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-4 w-4 shrink-0 text-ink"
                aria-hidden="true"
              >
                {sportIconPaths(row.sport).map((path, pathIndex) => (
                  <path
                    key={pathIndex}
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 text-[11px]">
                  <span className="truncate font-semibold">{t.sports[row.sport]}</span>
                  <span className="whitespace-nowrap font-mono text-[9px] tabular-nums">
                    {formatKilometres(row.distanceM, locale)} km
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-pill bg-ink/15">
                  <div
                    className={`h-full rounded-pill ${index === 0 ? 'bg-accent' : 'bg-ink'}`}
                    style={{
                      width: `${maxShare > 0 ? (row.share / maxShare) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-label-ink">
                  {formatNumber(row.activityCount, locale)}{' '}
                  {row.activityCount === 1
                    ? t.stories['06-material'].rowActivitySingular
                    : t.stories['06-material'].rowActivityPlural}
                  {' · '}
                  {formatNumber(Math.round(row.share * 100), locale)} %
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {weeklyLoad === null ? null : (
        <div data-testid="carnet-weeks" className="font-mono text-[9px]">
          {weeklyLoad.best === null ? null : (
            <div className="py-0.5">
              <div className="uppercase tracking-[0.06em] text-label-ink">{copy.bestWeekLabel}</div>
              <div className="whitespace-nowrap text-right tabular-nums">
                {formatKilometres(weeklyLoad.best.distanceM, locale)} km ·{' '}
                {monthDayText(weeklyLoad.best.monday.month, weeklyLoad.best.monday.day, locale)}
              </div>
            </div>
          )}
          <div className="py-0.5">
            <div className="uppercase tracking-[0.06em] text-label-ink">{copy.consecutiveLead}</div>
            <div className="whitespace-nowrap text-right tabular-nums">
              {formatNumber(weeklyLoad.longestFulfilledStreak, locale)}{' '}
              {weeklyLoad.longestFulfilledStreak === 1 ? copy.weeksUnitSingular : copy.weeksUnit}
            </div>
          </div>
          <div className="uppercase tracking-[0.06em] text-label-ink">
            {fulfilledWeeksSentenceFor(locale, MIN_SESSIONS_PER_WEEK)}
          </div>
        </div>
      )}

      {marks.length === 0 ? null : (
        <div data-testid="carnet-marks" className="font-mono text-[9px] uppercase tracking-[0.1em]">
          <div className="mb-1 text-label-ink">{copy.marksTitle}</div>
          <ul className="divide-y divide-line-light">
            {marks.map((mark) => (
              <li key={mark.label} className="py-1">
                <span className="block text-label-ink">{mark.label}</span>
                <span className="block whitespace-nowrap text-right normal-case tabular-nums">
                  {mark.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showPower && power !== null ? (
        <div data-testid="carnet-power" className="font-mono">
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-label-ink">
            {copy.powerTitle}
          </div>
          <div className="mt-1 flex gap-6">
            {[
              { label: copy.weightedAvgPowerLabel, value: power.totals.bestWeightedAvgPowerW },
              { label: copy.maxPowerLabel, value: power.totals.bestMaxPowerW },
            ].map((stat) =>
              stat.value === null ? null : (
                <div key={stat.label}>
                  <div className="font-display text-xl leading-none tabular-nums">
                    {formatNumber(Math.round(stat.value), locale)} W
                  </div>
                  <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-label-ink">
                    {stat.label}
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2 text-[8px] text-label-ink">
            <span className="uppercase tracking-[0.08em]">{copy.powerEvolutionLabel}</span>
            <span className="uppercase tracking-[0.08em]">
              {powerCoverageSentenceFor(
                locale,
                power.totals.sessionsWithPower,
                power.totals.activityCount,
              )}
            </span>
          </div>
          <div className="mt-1 flex h-9 items-end gap-1">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
              const watts = wattsByMonth.get(month)
              const height = watts === undefined || maxWatts === 0 ? 0 : (watts / maxWatts) * 100
              return (
                <div key={month} className="flex h-full flex-1 flex-col justify-end">
                  <div
                    className={`w-full rounded-[2px] ${month === peakMonth && height > 0 ? 'bg-accent' : 'bg-ink'}`}
                    style={{ height: `${height}%`, minHeight: height > 0 ? 2 : 0 }}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-1 flex gap-1 text-[8px] text-label-ink">
            {t.monthsAbbr.map((month, index) => (
              <span key={`${month}-${String(index)}`} className="flex-1 text-center">
                {month}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-label-ink">
        <span>{t.stories['08-dorsal'].madeWith}</span>
        <span className="tabular-nums">{String(summary.bibCard.number)}</span>
      </div>
    </div>
  )
}
