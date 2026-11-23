import { formatNumber } from '../../../../shared/format'
import { t } from '../../../../shared/i18n'
import type { YearSummary } from '../../../../core/model/year-summary'

/** Geometry of the mountain silhouette, in the viewBox coordinates of the W3 artboard. */
const WIDTH = 350
const HEIGHT = 260
const BASELINE = 250
const TOP = 20

function monthName(month: number): string {
  return t.months[month - 1] ?? ''
}

function monthAbbreviation(month: number): string {
  return t.monthsAbbr[month - 1] ?? ''
}

/**
 * Story 03 (BRIEF §6), shown only when `summary.monthlyProfile` exists. The
 * silhouette is drawn from the monthly distances — no fixed path (the W3
 * artboard's idea, data-driven geometry): twelve points, the peak marked as a
 * "Puerto HC", the valley as a circle, both named in text below the chart.
 */
export function PerfilStory({ summary }: { summary: YearSummary }) {
  const copy = t.stories['03-perfil']
  const profile = summary.monthlyProfile
  if (profile === null) {
    return null
  }

  const maxDistance = Math.max(...profile.months.map((month) => month.distanceM))
  const x = (month: number) => ((month - 1) * WIDTH) / 11
  const y = (distance: number) =>
    BASELINE - (maxDistance > 0 ? (distance / maxDistance) * (BASELINE - TOP) : 0)

  const profilePoints = profile.months.map(
    (month) => `${x(month.month).toFixed(1)},${y(month.distanceM).toFixed(1)}`,
  )
  const silhouette = `M0,${String(BASELINE)} L${profilePoints.join(' L')} L${String(WIDTH)},${String(BASELINE)} Z`
  const outline = `M${profilePoints.join(' L')}`
  const peakX = x(profile.peak.month)
  const peakY = y(profile.peak.distanceM)
  const valleyX = x(profile.valley.month)
  const valleyY = y(profile.valley.distanceM)
  const peakKm = formatNumber(Math.round(profile.peak.distanceM / 1000))

  return (
    <div data-testid="story-03-perfil" className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-5xl uppercase leading-[0.95]">{copy.title}</h1>
        <p className="text-[15px] leading-relaxed text-fg-muted">{copy.subtitle}</p>
      </div>

      <figure className="relative flex flex-col gap-2">
        <div
          className="absolute top-0 flex -translate-x-1/2 items-center gap-1.5"
          style={{
            left: `${Math.min(88, Math.max(12, (peakX / WIDTH) * 100)).toFixed(1)}%`,
          }}
        >
          <span className="rounded-[3px] bg-accent px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink">
            {copy.peakBadge}
          </span>
          <span
            data-testid="perfil-peak"
            className="whitespace-nowrap text-xs font-semibold text-fg"
          >
            {copy.peakLabel} {monthName(profile.peak.month)} · {peakKm} {copy.unitKm}
          </span>
        </div>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={[
            copy.profileAriaLead,
            ...profile.months.map(
              (month) =>
                `${monthName(month.month)} ${formatNumber(Math.round(month.distanceM / 1000))}`,
            ),
          ].join(' ')}
          className="w-full"
        >
          <path d={silhouette} className="fill-fg" />
          <g className="stroke-fg" strokeOpacity="0.22">
            {profile.months.slice(1).map((month) => (
              <line
                key={month.month}
                x1={x(month.month)}
                y1={y(month.distanceM)}
                x2={x(month.month)}
                y2={BASELINE}
              />
            ))}
          </g>
          <path
            d={outline}
            className="stroke-accent"
            fill="none"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <line
            x1={peakX}
            y1={peakY}
            x2={peakX}
            y2={TOP - 10}
            className="stroke-fg"
            strokeWidth="1.5"
          />
          <circle
            cx={peakX}
            cy={peakY}
            r="5.5"
            className="fill-accent stroke-fg"
            strokeWidth="2.5"
          />
          <circle
            data-testid="perfil-valley-marker"
            cx={valleyX}
            cy={valleyY}
            r="5.5"
            className="fill-bg stroke-accent"
            strokeWidth="2.5"
          />
        </svg>
        <div className="flex justify-between font-mono text-[11px] text-fg-subtle">
          {profile.months.map((month) => (
            <span
              key={month.month}
              className={month.month === profile.peak.month ? 'font-semibold text-fg' : undefined}
            >
              {monthAbbreviation(month.month)}
            </span>
          ))}
        </div>
      </figure>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3 border-t-2 border-line pt-2.5">
          <span data-testid="perfil-valley" className="min-w-16 font-display text-2xl">
            {formatNumber(Math.round(profile.valley.distanceM / 1000))} {copy.unitKm}
          </span>
          <span className="text-sm leading-snug text-fg-muted">
            <strong className="text-fg">
              {copy.valleyLabel} {monthName(profile.valley.month)}.
            </strong>{' '}
            {copy.valleyBody}
          </span>
        </div>
        {profile.comeback !== null && (
          <div className="flex items-baseline gap-3 border-t-2 border-line pt-2.5">
            <span data-testid="perfil-comeback" className="min-w-16 font-display text-2xl">
              ×{formatNumber(Math.round(profile.comeback * 10) / 10)}
            </span>
            <span className="text-sm leading-snug text-fg-muted">
              <strong className="text-fg">{copy.comebackLabel}.</strong> {copy.comebackBody}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
