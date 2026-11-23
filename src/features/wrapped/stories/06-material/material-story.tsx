import { formatDuration, formatKilometres, formatNumber } from '../../../../shared/format'
import { t } from '../../../../shared/i18n'
import type { YearSummary } from '../../../../core/model/year-summary'

/**
 * Story 06 (BRIEF §6.2), shown only when `summary.gear` exists. It renders the
 * metric verbatim (odd/tasks/h09-gear-of-the-year.md, decision 1): the star is
 * looked up by name and the list is displayed as returned, already sorted by
 * hours. The poster language of the wrapped applies to gear: the eyebrow, the
 * star's own name as the headline, its hours as the hero number with the
 * kilometres beside it, then a ranking whose bars are `aria-hidden` (the
 * numbers beside them carry the information) and a retirement badge on every
 * item flagged for this season's 800 km.
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

  const hours = Math.floor(starItem.movingTimeS / 3600)
  const minutes = Math.floor((starItem.movingTimeS % 3600) / 60)
  const starLead = gear.showsBikes ? copy.starLead.bikes : copy.starLead.shoes

  return (
    <div data-testid="story-06-material" className="flex w-full flex-col gap-5">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">{copy.eyebrow}</p>

      <div className="flex flex-col gap-1">
        <span data-testid="material-star-lead" className="text-[17px] text-fg-muted">
          {starLead}
        </span>
        <h1
          data-testid="material-star-name"
          className="break-words font-display text-5xl uppercase leading-[0.95]"
        >
          {starItem.name}
        </h1>
      </div>

      <div className="flex items-end justify-between gap-3 border-t-2 border-line pt-3">
        <div className="flex flex-col gap-1">
          <span data-testid="material-star-hours" className="flex items-baseline">
            <span className="font-display text-8xl leading-none text-accent-text">
              {formatNumber(hours)}
            </span>
            <span className="font-display text-2xl uppercase">
              {' h '}
              {formatNumber(minutes)} min
            </span>
          </span>
          <span className="text-[13px] text-fg-subtle">{copy.hoursLabel}</span>
        </div>
        <span
          data-testid="material-star-km"
          className="font-mono text-sm tabular-nums text-fg-muted"
        >
          {formatKilometres(starItem.distanceM)} km
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
          {copy.rankingLabel}
        </p>
        <ul data-testid="material-ranking" className="flex flex-col gap-3">
          {gear.items.map((item, index) => {
            const share =
              starItem.movingTimeS > 0
                ? Math.round((item.movingTimeS / starItem.movingTimeS) * 100)
                : 0
            return (
              <li
                key={item.name}
                data-testid={`material-row-${index}`}
                className="border-t-2 border-line pt-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 break-words text-sm text-fg">{item.name}</span>
                  {item.needsRetiring && (
                    <span
                      data-testid="material-retired-badge"
                      className="rounded-pill bg-accent px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink"
                    >
                      {copy.retirementBadge}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-dim"
                  >
                    <span className="block h-full bg-accent" style={{ width: `${share}%` }} />
                  </span>
                  <span className="whitespace-nowrap font-mono text-xs tabular-nums text-fg-muted">
                    <span data-testid={`material-hours-${index}`}>
                      {formatDuration(item.movingTimeS)}
                    </span>
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-fg-subtle">
                  <span data-testid={`material-km-${index}`}>
                    {formatKilometres(item.distanceM)} km
                  </span>
                  <span>
                    {formatNumber(item.activityCount)}{' '}
                    {item.activityCount === 1 ? copy.rowActivitySingular : copy.rowActivityPlural}
                  </span>
                </div>
                {item.needsRetiring && (
                  <p className="mt-1 text-[11px] text-fg-subtle">{copy.retirementNote}</p>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
