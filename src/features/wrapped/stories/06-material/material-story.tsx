import {
  formatDuration,
  formatHourParts,
  formatKilometres,
  formatNumber,
} from '../../../../shared/format'
import { t } from '../../../../shared/i18n'
import type { YearSummary } from '../../../../core/model/year-summary'
import { PlateHead, PlateTitle, StoryPlate } from '../story-plate'

/**
 * Story 06 (BRIEF §6.2), on its bone plate, shown only when `summary.gear`
 * exists. It renders the metric verbatim (odd/tasks/h09-gear-of-the-year.md,
 * decision 1): the star is looked up by name and the list is displayed as
 * returned, already sorted by hours. The plate language applies to gear: the
 * numbered band and the title, the star's own name as the headline, its hours
 * as the hero number with the kilometres beside it, then a ranking whose bars
 * are `aria-hidden` (the numbers beside them carry the information) and the
 * retirement sticker on every item flagged for this season's 800 km.
 */
export function MaterialStory({ summary }: { summary: YearSummary }) {
  const copy = t.stories['06-material']
  const gear = summary.gear
  if (gear === null || gear.star === null) {
    return null
  }
  const starItem = gear.items.find((item) => item.name === gear.star)
  if (starItem === undefined) {
    return null
  }

  const starHours = formatHourParts(starItem.movingTimeS)
  const starLead = gear.showsBikes ? copy.starLead.bikes : copy.starLead.shoes

  return (
    <StoryPlate testId="story-06-material" className="gap-4">
      <PlateHead number="06" />
      <PlateTitle>{copy.title}</PlateTitle>

      <div className="flex flex-col gap-1 text-center">
        <span
          data-testid="material-star-lead"
          className="text-[13.5px] text-body-ink [text-wrap:pretty]"
        >
          {starLead}
        </span>
        <h3
          data-testid="material-star-name"
          className="break-words font-display text-[clamp(34px,10vw,44px)] uppercase leading-[0.95] text-accent-on-bone"
        >
          {starItem.name}
        </h3>
      </div>

      <div className="flex items-end justify-between gap-3 border-t-2 border-line-light pt-2">
        <div className="flex flex-col gap-1">
          <span data-testid="material-star-hours" className="flex items-baseline">
            <span className="font-display text-[clamp(56px,17vw,76px)] leading-none text-accent-on-bone">
              {starHours.hours}
            </span>
            <span className="font-display text-[22px] uppercase leading-none">
              {' h '}
              {starHours.minutes === null ? null : `${starHours.minutes} min`}
            </span>
          </span>
          <span className="text-[11px] text-label-ink">{copy.hoursLabel}</span>
        </div>
        <span
          data-testid="material-star-km"
          className="font-mono text-[13px] tabular-nums text-label-ink"
        >
          {formatKilometres(starItem.distanceM)} km
        </span>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-on-bone">
          {copy.rankingLabel}
        </p>
        <ul data-testid="material-ranking" className="flex flex-col gap-2.5">
          {gear.items.map((item, index) => {
            const share =
              starItem.movingTimeS > 0
                ? Math.round((item.movingTimeS / starItem.movingTimeS) * 100)
                : 0
            return (
              <li
                key={item.name}
                data-testid={`material-row-${index}`}
                className="border-t-2 border-line-light pt-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 break-words text-[13px] text-text-ink">{item.name}</span>
                  {item.needsRetiring && (
                    <span
                      data-testid="material-retired-badge"
                      className="-rotate-2 rounded-pill bg-accent px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink shadow-[0_3px_7px_rgba(0,0,0,0.3)]"
                    >
                      {copy.retirementBadge}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-bone-soft shadow-[inset_1px_1px_2px_rgba(15,16,13,0.18)]"
                  >
                    <span className="block h-full bg-orange-text" style={{ width: `${share}%` }} />
                  </span>
                  <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-label-ink">
                    <span data-testid={`material-hours-${index}`}>
                      {formatDuration(item.movingTimeS)}
                    </span>
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-label-ink">
                  <span data-testid={`material-km-${index}`}>
                    {formatKilometres(item.distanceM)} km
                  </span>
                  <span>
                    {formatNumber(item.activityCount)}{' '}
                    {item.activityCount === 1 ? copy.rowActivitySingular : copy.rowActivityPlural}
                  </span>
                </div>
                {item.needsRetiring && (
                  <p className="mt-1 text-[11px] text-label-ink">{copy.retirementNote}</p>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </StoryPlate>
  )
}
