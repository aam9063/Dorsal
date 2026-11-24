import type { YearSummary } from '../../core/model/year-summary'
import { formatKilometres } from '../../shared/format'
import { t } from '../../shared/i18n'
import {
  bibCardArchetypeText,
  bibCardMarkRows,
  bibCardNameText,
  bibCardStatRows,
} from './render-bib-card'

/**
 * The card as the story shows it: a DOM replica of `drawBibCard`, so opening
 * story 08 costs no canvas work (odd/tasks/h11-bib-card.md decision 6) and the
 * player has something to render before the PNG is requested. It mirrors the
 * H-11b composition block for block — season band, number, name, archetype,
 * twelve month bars, tear-off edge, three stats and the best marks — and reads
 * every string from the same helpers the canvas draw uses, so the two can never
 * drift apart on copy or numbers.
 */
export function BibCardPreview({ summary, name }: { summary: YearSummary; name: string | null }) {
  const copy = t.stories['08-dorsal']
  const numberText = String(summary.bibCard.number)
  const archetype = bibCardArchetypeText(summary)
  const monthly = summary.bibCard.monthlyDistanceM
  const maxMonthly = Math.max(...monthly, 0)
  const peakMonth = monthly.indexOf(maxMonthly)
  const marks = bibCardMarkRows(summary)

  return (
    <div
      data-testid="dorsal-preview"
      className="relative flex w-[86%] max-w-sm rotate-[-3deg] flex-col gap-3 rounded-card bg-bone p-5 text-ink shadow-xl"
    >
      <span className="absolute left-3 top-3 h-2.5 w-2.5 rounded-pill bg-accent" />
      <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-pill bg-accent" />
      <span className="absolute bottom-3 left-3 h-2.5 w-2.5 rounded-pill bg-accent" />
      <span className="absolute bottom-3 right-3 h-2.5 w-2.5 rounded-pill bg-accent" />

      <div className="flex items-center justify-between gap-2 rounded-chip bg-ink px-3 py-1.5 font-mono text-[7px] tracking-[0.1em] text-accent">
        <span className="min-w-0 truncate">{copy.plate.toUpperCase()}</span>
        <span className="shrink-0">{copy.plateKm}</span>
      </div>

      <div
        data-testid="dorsal-number"
        className={`translate-x-[2.5%] text-center font-display leading-none ${numberText.length >= 5 ? 'text-[64px]' : 'text-[80px]'}`}
      >
        {numberText}
      </div>

      <div className="text-center text-sm font-bold uppercase tracking-[0.24em]">
        {bibCardNameText(name)}
      </div>

      {archetype === null ? null : (
        <div className="-mt-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-label-ink">
          {archetype}
        </div>
      )}

      <div>
        <div className="mb-1 flex items-baseline justify-between gap-1 font-mono text-[8px] uppercase tracking-[0.08em] text-label-ink">
          <span className="whitespace-nowrap">{copy.chartCaption}</span>
          {maxMonthly > 0 ? (
            <span className="whitespace-nowrap tabular-nums">
              {t.monthsShort[peakMonth] ?? ''} · {formatKilometres(maxMonthly)}
            </span>
          ) : null}
        </div>
        <div data-testid="dorsal-chart" className="flex h-14 items-end gap-1">
          {monthly.map((distanceM, index) => {
            const height = maxMonthly > 0 ? (distanceM / maxMonthly) * 100 : 0
            return (
              <div
                key={t.monthsAbbr[index] ?? String(index)}
                className={`flex-1 rounded-t ${index === peakMonth && height > 0 ? 'bg-accent' : 'bg-ink'}`}
                style={{ height: `${height}%`, minHeight: height > 0 ? 2 : 0 }}
              />
            )
          })}
        </div>
        <div className="mt-1 flex gap-1 font-mono text-[8px] text-label-ink">
          {t.monthsAbbr.map((month, index) => (
            <span key={`${month}-${String(index)}`} className="flex-1 text-center">
              {month}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 border-t-2 border-dashed border-ink pt-2 text-center">
        {bibCardStatRows(summary).map((row) => (
          <div key={row.label}>
            <div className="font-display text-2xl leading-none">{row.value}</div>
            <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-label-ink">
              {row.label}
            </div>
          </div>
        ))}
      </div>

      {marks.length === 0 ? null : (
        <div
          data-testid="dorsal-marks"
          className="font-mono text-[9px] uppercase tracking-[0.12em]"
        >
          <div className="mb-1 text-label-ink">{copy.carnet.marksTitle}</div>
          <ul className="divide-y divide-dashed divide-ink/25">
            {marks.map((mark) => (
              <li key={mark.label} className="py-1">
                <span className="block text-label-ink">{mark.label}</span>
                <span className="block text-right whitespace-nowrap">{mark.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center font-mono text-[8px] uppercase tracking-[0.2em] text-label-ink">
        {copy.madeWith}
      </div>
    </div>
  )
}
