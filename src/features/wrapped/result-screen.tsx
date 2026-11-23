import { t, resultCorruptWarning } from '../../shared/i18n'
import { formatDuration, formatKilometres, formatNumber } from '../../shared/format'
import { handedOffSeasonSummary } from '../processing'

function Stat({ testId, label, value }: { testId: string; label: string; value: string }) {
  return (
    <div className="rounded-panel border border-line bg-surface p-4">
      <dt className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">{label}</dt>
      <dd data-testid={testId} className="mt-1 text-2xl tabular-nums whitespace-nowrap sm:text-3xl">
        {value}
      </dd>
    </div>
  )
}

export function ResultScreen() {
  const season = handedOffSeasonSummary()

  if (season === null) {
    return (
      <section
        data-testid="result-root"
        className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:px-8"
      >
        <h1 className="text-5xl">{t.result.title}</h1>
        <p className="text-base text-fg-muted">{t.result.subtitle}</p>
        <p className="text-sm text-fg-subtle" data-testid="result-provisional">
          {t.result.provisional}
        </p>
      </section>
    )
  }

  const { summary, stats } = season

  const { totals } = summary

  return (
    <section
      data-testid="result-root"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:px-8"
    >
      <h1 className="text-5xl">{t.result.title}</h1>
      <p className="text-base text-fg-muted">{t.result.subtitle}</p>
      <dl data-testid="result-totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          testId="result-total-distance"
          label={t.result.kilometres}
          value={formatKilometres(totals.distanceM)}
        />
        <Stat
          testId="result-total-moving-time"
          label={t.result.movingTime}
          value={formatDuration(totals.movingTimeS)}
        />
        <Stat
          testId="result-total-activities"
          label={t.result.activities}
          value={formatNumber(totals.activityCount)}
        />
        <Stat
          testId="result-total-active-days"
          label={t.result.activeDays}
          value={formatNumber(totals.activeDays)}
        />
        <Stat
          testId="result-total-elevation"
          label={t.result.elevation}
          value={formatNumber(totals.elevationGainM)}
        />
      </dl>
      {stats.corruptRows > 0 && (
        <p className="text-base text-fg-muted" role="status" data-testid="upload-warning-corrupt">
          {resultCorruptWarning(stats.corruptRows)}
        </p>
      )}
    </section>
  )
}
