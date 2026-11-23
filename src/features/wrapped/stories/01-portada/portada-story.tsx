import { t } from '../../../../shared/i18n'
import { formatKilometres } from '../../../../shared/format'
import type { YearSummary } from '../../../../core/model/year-summary'

/** Story 01 (BRIEF §6): the season year and the total kilometres. */
export function PortadaStory({ summary }: { summary: YearSummary }) {
  const copy = t.stories['01-portada']

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">{copy.title}</p>
      <p className="text-sm uppercase tracking-[0.2em] text-fg-muted">{copy.seasonLabel}</p>
      <p className="font-display text-8xl leading-none">{copy.year}</p>
      <p className="mt-2 text-fg-muted">
        <span className="font-display text-5xl text-fg">
          {formatKilometres(summary.totals.distanceM)}
        </span>{' '}
        {copy.kilometresLabel.toLowerCase()}
      </p>
    </div>
  )
}
