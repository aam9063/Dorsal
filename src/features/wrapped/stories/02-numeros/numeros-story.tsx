import type { ReactNode } from 'react'
import { formatDuration, formatKilometres, formatNumber } from '../../../../shared/format'
import { t } from '../../../../shared/i18n'
import type { YearSummary } from '../../../../core/model/year-summary'
import { PlateDivider, PlateHead, PlateNote, PlateTitle, Sticker, StoryPlate } from '../story-plate'
import { EVEREST_APEX_X, EVEREST_HEIGHT, EVEREST_WIDTH, everestFill } from './everest-geometry'

/**
 * One whole Everest, in the paper-range accent text that clears 3:1 on bone.
 */
function EverestMark() {
  return (
    <svg
      width={EVEREST_WIDTH}
      height={EVEREST_HEIGHT}
      viewBox={`0 0 ${EVEREST_WIDTH} ${EVEREST_HEIGHT}`}
      aria-hidden="true"
      className="fill-accent-on-bone"
    >
      <path d={`M0 ${EVEREST_HEIGHT} L${EVEREST_APEX_X} 0 L${EVEREST_WIDTH} ${EVEREST_HEIGHT} Z`} />
    </svg>
  )
}

/**
 * The fractional Everest: the same full mountain, outlined, with the lower
 * `fraction` share filled — a stub beside a whole one read as a second one.
 */
function EverestFractionMark({ fraction }: { fraction: number }) {
  const fill = everestFill(fraction)
  const points = `${fill.leftX.toFixed(2)} ${fill.topY.toFixed(2)} L${fill.rightX.toFixed(2)} ${fill.topY.toFixed(2)}`
  return (
    <svg
      width={EVEREST_WIDTH}
      height={EVEREST_HEIGHT}
      viewBox={`0 0 ${EVEREST_WIDTH} ${EVEREST_HEIGHT}`}
      aria-hidden="true"
      className="text-accent-on-bone"
    >
      <path
        d={`M0 ${EVEREST_HEIGHT} L${EVEREST_APEX_X} 0 L${EVEREST_WIDTH} ${EVEREST_HEIGHT} Z`}
        className="fill-none stroke-accent-on-bone"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d={`M${points} L${EVEREST_WIDTH} ${EVEREST_HEIGHT} L0 ${EVEREST_HEIGHT} Z`}
        className="fill-accent-on-bone"
      />
    </svg>
  )
}

function Stat({
  testId,
  value,
  label,
  extra,
}: {
  testId?: string
  value: ReactNode
  label: string
  extra?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 border-t-2 border-line-light pt-2">
      <span data-testid={testId} className="font-display text-[27px] leading-none">
        {value}
      </span>
      <span className="text-[11px] text-label-ink">{label}</span>
      {extra}
    </div>
  )
}

/**
 * Story 02 (BRIEF §6): the numbers, on the plate of the W2 artboard
 * (design/redesign-2026/03-objeto-dorsal/02-numeros.html) — numbered band,
 * centred hero with the equivalence as a sticker on the plate edge, dashed
 * divider with a punched hole, the stamps grid, the laps note and the sport
 * split, all straight from `summary.totals` — the story never recomputes
 * (odd/tasks/h08-stories-01-04.md, decision 1). The artboard's numbers are
 * fictional and replaced by the real ones.
 */
export function NumerosStory({ summary }: { summary: YearSummary }) {
  const copy = t.stories['02-numeros']
  const { totals } = summary
  const laps = Math.round(totals.trackLaps)
  const everests = Math.round(totals.everests * 10) / 10
  const wholeEverests = Math.floor(totals.everests)
  const everestFraction = totals.everests - wholeEverests

  return (
    <StoryPlate testId="story-02-numeros">
      <PlateHead number="02" />
      <PlateTitle>{copy.title}</PlateTitle>

      <div className="relative mt-2 flex flex-col items-center gap-1 text-center">
        <span className="text-[13.5px] text-body-ink [text-wrap:pretty]">{copy.intro}</span>
        <span
          data-testid="numeros-distance"
          className="font-display text-[clamp(56px,18vw,78px)] leading-[0.95] text-accent-on-bone"
        >
          {formatKilometres(totals.distanceM)}
        </span>
        <span className="font-display text-[22px] uppercase leading-none">
          {copy.kilometresLabel}
        </span>
      </div>

      <div className="relative self-end pr-1">
        <Sticker className="static translate-x-1 -rotate-[4deg]">
          {'= '}
          <span data-testid="numeros-everests">{formatNumber(everests)}</span>
          {` ${copy.everestUnit}`}
        </Sticker>
      </div>

      <PlateDivider />

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Stat
          testId="numeros-moving-time"
          value={formatDuration(totals.movingTimeS)}
          label={copy.movingTimeLabel}
        />
        <Stat
          testId="numeros-activities"
          value={formatNumber(totals.activityCount)}
          label={copy.activitiesLabel}
          extra={
            <span className="text-[11px] text-label-ink">
              <span data-testid="numeros-active-days">{formatNumber(totals.activeDays)}</span>{' '}
              {copy.activeDaysSuffix}
            </span>
          }
        />
        <div className="col-span-2 flex items-end justify-between gap-3 border-t-2 border-line-light pt-2">
          <div className="flex flex-col gap-1">
            <span className="font-display text-[27px] leading-none">
              <span data-testid="numeros-elevation">{formatNumber(totals.elevationGainM)}</span>{' '}
              <span className="text-[18px]">m</span>
            </span>
            <span className="text-[11px] text-label-ink">{copy.elevationLabel}</span>
          </div>
          <span
            role="img"
            aria-label={`${formatNumber(everests)} ${copy.everestAria}`}
            className="flex items-end gap-[3px]"
          >
            {Array.from({ length: wholeEverests }, (_, index) => (
              <EverestMark key={index} />
            ))}
            {everestFraction >= 0.05 && <EverestFractionMark fraction={everestFraction} />}
          </span>
        </div>
      </div>

      <PlateNote>
        {copy.lapsLead}{' '}
        <strong className="font-semibold text-text-ink">
          <span data-testid="numeros-laps">{formatNumber(laps)}</span>{' '}
          {laps === 1 ? copy.lapsUnitSingular : copy.lapsUnit}
        </strong>{' '}
        {copy.lapsTail}
      </PlateNote>

      <div className="mt-auto border-t-2 border-ink pt-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-on-bone">
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
          className="mt-2 flex flex-col gap-2"
        >
          {totals.bySport.map((row) => {
            const share = Math.round(row.share * 100)
            return (
              <li
                key={row.sport}
                className="grid grid-cols-[92px_minmax(0,1fr)_44px] items-center gap-2 text-[13px] text-text-ink"
              >
                <span className="min-w-0 truncate">{t.sports[row.sport]}</span>
                <span className="h-2.5 min-w-0 overflow-hidden rounded-pill bg-bone-soft shadow-[inset_1px_1px_2px_rgba(15,16,13,0.18)]">
                  <span className="block h-full bg-orange-text" style={{ width: `${share}%` }} />
                </span>
                <span className="text-right font-mono text-[11px] tabular-nums text-label-ink">
                  {formatNumber(share)} %
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </StoryPlate>
  )
}
