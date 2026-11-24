import { formatNumber } from '../../../../shared/format'
import { heartbeatCoverageSentence, heartbeatPeakDate, t } from '../../../../shared/i18n'
import type { YearSummary } from '../../../../core/model/year-summary'

/** Geometry of the decorative heartbeat line, in the W7 artboard coordinates. */
const ECG_WIDTH = 390
const ECG_HEIGHT = 110

const twoDecimals = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Hero number for the season beats: two decimals of millions from one million up. */
function beatsHeroText(beats: number): string {
  return beats >= 1_000_000
    ? twoDecimals.format(beats / 1_000_000)
    : formatNumber(Math.round(beats))
}

/**
 * Story 07 (BRIEF §6), shown only when `summary.heartbeats` exists. The total
 * beats lead, followed by the resting-days equivalence — a number nobody can
 * feel needs its equivalence next to it —, then the season peak with its date
 * and the coverage in words (odd/tasks/h10-stories-05-07.md, decision 3). An
 * activity can carry a maximum heart rate without an average, so the peak
 * block is omitted when `peak` is `null` while the story still renders
 * (decision 4). The heartbeat line of the W7 artboard is decorative and
 * carries no data, so the story draws its fixed shape and marks it
 * `aria-hidden`.
 */
export function LatidosStory({ summary }: { summary: YearSummary }) {
  const copy = t.stories['07-latidos']
  const heartbeats = summary.heartbeats
  if (heartbeats === null) {
    return null
  }

  const heroText = beatsHeroText(heartbeats.beats)
  const heroUnit = heartbeats.beats >= 1_000_000 ? copy.millionsUnit : copy.beatsUnit
  const restingDays = Math.round(heartbeats.restingDays)
  const coveragePct = Math.round(heartbeats.coverage * 100)
  const peak = heartbeats.peak
  const peakMonth = peak === null ? '' : (t.months[peak.month - 1] ?? '')

  return (
    <div data-testid="story-07-latidos" className="rounded-panel bg-surface p-6">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">{copy.title}</p>

      <div className="mt-8 flex flex-col gap-1">
        <span className="text-[17px] text-fg-muted">{copy.lead}</span>
        <span
          data-testid="latidos-beats"
          className="font-display text-[104px] leading-[0.92] text-accent-text"
        >
          {heroText}
        </span>
        <span className="font-display text-3xl uppercase leading-tight">{heroUnit}</span>
      </div>

      <svg
        viewBox={`0 0 ${ECG_WIDTH} ${ECG_HEIGHT}`}
        aria-hidden="true"
        fill="none"
        className="mt-7 w-full"
      >
        <path
          d="M0 70 H54 L62 58 L70 70 H86 L96 18 L108 100 L118 70 H160 L168 58 L176 70 H192 L202 6 L214 104 L224 70 H266 L274 58 L282 70 H298 L308 18 L320 100 L330 70 H390"
          className="stroke-fg"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={202} cy={6} r={5} className="fill-accent stroke-fg" strokeWidth="2.5" />
      </svg>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex gap-3 items-baseline border-t-2 border-line pt-2.5">
          <span data-testid="latidos-resting-days" className="min-w-20 font-display text-2xl">
            {formatNumber(restingDays)}{' '}
            {restingDays === 1 ? copy.restingUnitSingular : copy.restingUnit}
          </span>
          <span className="text-sm leading-snug text-fg-muted">{copy.restingDaysLead}</span>
        </div>
        {peak !== null && (
          <div
            data-testid="latidos-peak"
            className="flex gap-3 items-baseline border-t-2 border-line pt-2.5"
          >
            <span className="min-w-20 font-display text-2xl text-accent-text">
              {formatNumber(peak.bpm)} ppm
            </span>
            <span className="text-sm leading-snug text-fg-muted">
              {copy.peakLead} {heartbeatPeakDate(peak.day, peakMonth)}.
            </span>
          </div>
        )}
      </div>

      <p data-testid="latidos-coverage" className="mt-4 text-[15px] leading-relaxed text-fg-muted">
        {heartbeatCoverageSentence(coveragePct)}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-fg-subtle">{copy.estimateNote}</p>
    </div>
  )
}
