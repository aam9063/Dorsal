import { archetypePeakSentence, t } from '../../../../shared/i18n'
import type { YearSummary } from '../../../../core/model/year-summary'

/** Clock geometry, in the viewBox coordinates of the W5 artboard. */
const CLOCK_SIZE = 300
const CLOCK_CENTER = 150
const SPOKE_BASE_Y = 96
const SPOKE_MIN_LENGTH = 3
const SPOKE_MAX_LENGTH = 76
const CENTER_RADIUS = 44

function peakHourOf(startHours: readonly number[]): { hour: number; count: number } {
  let hour = 0
  let count = 0
  startHours.forEach((value, index) => {
    if (value > count) {
      hour = index
      count = value
    }
  })
  return { hour, count }
}

/** Hour index as a clock time, e.g. `7` → "7:00". */
function hourText(hour: number): string {
  return `${hour}:00`
}

/**
 * Story 05 (BRIEF §6), shown only when `summary.archetype` exists. The
 * headline is the archetype's own name, never the rule id, and the secondary
 * trait appears as a supporting line (odd/tasks/h10-stories-05-07.md,
 * decision 1). The 24-hour distribution is a radial chart like the W5
 * artboard's clock, built from `startHours` with the peak hour in its centre;
 * the spoke length carries the information and the sentence below the clock
 * names the peak hour in text (decision 2), so no colour is required.
 */
export function ArquetipoStory({ summary }: { summary: YearSummary }) {
  const copy = t.stories['05-arquetipo']
  const archetype = summary.archetype
  if (archetype === null) {
    return null
  }

  const totalStarts = archetype.startHours.reduce((sum, count) => sum + count, 0)
  const peak = peakHourOf(archetype.startHours)
  const peakSharePct = totalStarts === 0 ? 0 : Math.round((peak.count / totalStarts) * 100)
  const maxCount = Math.max(...archetype.startHours)
  const peakText = hourText(peak.hour)

  const spokenClock = `${copy.distributionLabel}. ${archetypePeakSentence(peakSharePct, peakText)}`
  const primaryName = copy.archetypeNames[archetype.primary]
  const secondaryName = copy.archetypeNames[archetype.secondary]

  return (
    <div data-testid="story-05-arquetipo" className="rounded-panel bg-accent p-6 text-ink">
      <p className="font-mono text-[13px] uppercase tracking-[0.14em]">{copy.title}</p>

      <div className="mt-5 flex flex-col gap-1">
        <span className="text-[17px]">{copy.lead}</span>
        <h1 data-testid="arquetipo-name" className="font-display text-5xl uppercase leading-[0.95]">
          {primaryName}
        </h1>
        <span data-testid="arquetipo-secondary" className="pt-1 text-[15px] leading-snug">
          {copy.secondaryLead} <strong>{secondaryName}</strong>
        </span>
      </div>

      <figure className="mt-5 flex flex-col gap-2">
        <svg
          data-testid="arquetipo-clock"
          viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
          role="img"
          aria-label={spokenClock}
          className="w-full self-center"
        >
          <g className="stroke-ink" strokeWidth="8" strokeLinecap="round">
            {archetype.startHours.map((count, hour) => (
              <line
                key={hour}
                x1={CLOCK_CENTER}
                y1={SPOKE_BASE_Y}
                x2={CLOCK_CENTER}
                y2={
                  SPOKE_BASE_Y -
                  (maxCount > 0
                    ? SPOKE_MIN_LENGTH + (count / maxCount) * SPOKE_MAX_LENGTH
                    : SPOKE_MIN_LENGTH)
                }
                transform={`rotate(${hour * 15} ${CLOCK_CENTER} ${CLOCK_CENTER})`}
                strokeOpacity={count === 0 ? 0.3 : 1}
              />
            ))}
          </g>
          <circle cx={CLOCK_CENTER} cy={CLOCK_CENTER} r={CENTER_RADIUS} className="fill-ink" />
          <text
            x={CLOCK_CENTER}
            y={CLOCK_CENTER + 2}
            textAnchor="middle"
            fontSize="30"
            className="fill-orange font-display"
          >
            {peakText}
          </text>
          <text
            x={CLOCK_CENTER}
            y={CLOCK_CENTER + 20}
            textAnchor="middle"
            fontSize="9"
            letterSpacing="1"
            className="fill-bone font-mono"
          >
            {copy.clockPeakLabel}
          </text>
          <g fontSize="11" fontWeight="600" className="fill-ink font-mono">
            <text x={150} y={10} textAnchor="middle">
              0h
            </text>
            <text x={299} y={154} textAnchor="end">
              6h
            </text>
            <text x={150} y={298} textAnchor="middle">
              12h
            </text>
            <text x={1} y={154} textAnchor="start">
              18h
            </text>
          </g>
        </svg>
        <figcaption data-testid="arquetipo-peak-hour" className="text-[15px] leading-relaxed">
          {archetypePeakSentence(peakSharePct, peakText)}
        </figcaption>
      </figure>

      <div className="mt-5 flex flex-wrap gap-2">
        <span
          data-testid="arquetipo-primary-chip"
          className="rounded-pill bg-ink px-3.5 py-2 text-[13px] font-semibold text-orange"
        >
          {primaryName}
        </span>
        <span className="rounded-pill border-[1.5px] border-ink px-3.5 py-2 text-[13px] font-semibold">
          {secondaryName}
        </span>
      </div>
    </div>
  )
}
