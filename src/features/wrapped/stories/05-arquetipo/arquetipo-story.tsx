import { archetypePeakSentence } from '../../../../shared/i18n'
import { useT } from '../../../../shared/hooks'
import type { YearSummary } from '../../../../core/model/year-summary'
import { PlateHead, PlateTitle, StoryPlate } from '../story-plate'
import {
  CLOCK_CENTER,
  CLOCK_SIZE,
  CENTER_RADIUS,
  HOUR_LABELS,
  SPOKE_BASE_REACH,
  activeSpokes,
} from './clock-geometry'

/** The base of every spoke sits this far above the centre, as on the W5 artboard. */
const SPOKE_BASE_Y = CLOCK_CENTER - SPOKE_BASE_REACH

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
 * Story 05 (BRIEF §6), on its bone plate, shown only when `summary.archetype`
 * exists. The headline is the archetype's own name, never the rule id, and the
 * secondary trait appears as a supporting line (odd/tasks/h10-stories-05-07.md,
 * decision 1). The 24-hour distribution is a radial chart like the W5
 * artboard's clock, built from `startHours`; the spoke length carries the
 * information, hours without starts draw nothing, and the sentence below the
 * clock is the one place that names the peak hour in text (decision 2), so no
 * colour is required. The primary archetype keeps the sticker treatment; the
 * secondary one is a flat outlined chip.
 */
export function ArquetipoStory({ summary }: { summary: YearSummary }) {
  const t = useT()
  const copy = t.stories['05-arquetipo']
  const archetype = summary.archetype
  if (archetype === null) {
    return null
  }

  const totalStarts = archetype.startHours.reduce((sum, count) => sum + count, 0)
  const peak = peakHourOf(archetype.startHours)
  const peakSharePct = totalStarts === 0 ? 0 : Math.round((peak.count / totalStarts) * 100)
  const peakText = hourText(peak.hour)

  const spokenClock = `${copy.distributionLabel}. ${archetypePeakSentence(peakSharePct, peakText)}`
  const primaryName = copy.archetypeNames[archetype.primary]
  const secondaryName = copy.archetypeNames[archetype.secondary]

  return (
    <StoryPlate testId="story-05-arquetipo" className="gap-4">
      <PlateHead number="05" />
      <PlateTitle>{copy.title}</PlateTitle>

      <div className="flex flex-col gap-1 text-center">
        <span className="text-[13.5px] text-body-ink [text-wrap:pretty]">{copy.lead}</span>
        <h3
          data-testid="arquetipo-name"
          className="font-display text-[36px] uppercase leading-[0.95] text-text-ink"
        >
          {primaryName}
        </h3>
        <span
          data-testid="arquetipo-secondary"
          className="pt-1 text-[13.5px] leading-snug text-body-ink [text-wrap:pretty]"
        >
          {copy.secondaryLead}{' '}
          <strong className="font-semibold text-text-ink">{secondaryName}</strong>
        </span>
      </div>

      <figure className="flex flex-col gap-2">
        <svg
          data-testid="arquetipo-clock"
          viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
          role="img"
          aria-label={spokenClock}
          className="w-full self-center"
        >
          <g className="stroke-ink" strokeWidth="8" strokeLinecap="round">
            {activeSpokes(archetype.startHours).map((spoke) => (
              <line
                key={spoke.hour}
                x1={CLOCK_CENTER}
                y1={SPOKE_BASE_Y}
                x2={CLOCK_CENTER}
                y2={SPOKE_BASE_Y - spoke.length}
                transform={`rotate(${spoke.hour * 15} ${CLOCK_CENTER} ${CLOCK_CENTER})`}
              />
            ))}
          </g>
          <circle cx={CLOCK_CENTER} cy={CLOCK_CENTER} r={CENTER_RADIUS} className="fill-ink" />
          <g fontSize="11" fontWeight="600" className="fill-ink font-mono">
            {HOUR_LABELS.map((label) => (
              <text key={label.hour} x={label.x} y={label.y} textAnchor={label.anchor}>
                {`${String(label.hour)}h`}
              </text>
            ))}
          </g>
        </svg>
        <figcaption
          data-testid="arquetipo-peak-hour"
          className="text-[13.5px] leading-relaxed text-body-ink [text-wrap:pretty]"
        >
          {archetypePeakSentence(peakSharePct, peakText)}
        </figcaption>
      </figure>

      <div className="mt-auto flex flex-wrap justify-center gap-2">
        <span
          data-testid="arquetipo-primary-chip"
          className="rotate-[2deg] rounded-pill bg-accent px-3.5 py-2 text-[13px] font-bold text-ink shadow-[0_4px_9px_rgba(0,0,0,0.35)]"
        >
          {primaryName}
        </span>
        <span className="rounded-pill border-[1.5px] border-ink px-3.5 py-2 text-[13px] font-semibold text-text-ink">
          {secondaryName}
        </span>
      </div>
    </StoryPlate>
  )
}
