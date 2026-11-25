import type { YearSummary } from '../../core/model/year-summary'
import { formatKilometres } from '../../shared/format'
import { t } from '../../shared/i18n'
import {
  bibCardArchetypeText,
  bibCardGeometry,
  bibCardMarkRows,
  bibCardNameText,
  bibCardNumberSize,
  bibCardStatRows,
  bibCardStickerText,
  CARD_STAGE_NUMERAL,
} from './render-bib-card'

/**
 * The card as the story shows it: a DOM replica of `drawBibCard`, so opening
 * story 08 costs no canvas work (odd/tasks/h11-bib-card.md decision 6) and the
 * player has something to render before the PNG is requested. It mirrors the
 * redesigned composition block for block — punched pins, editorial spine head,
 * number, name, archetype, the Everest sticker, twelve month bars, the dashed
 * tear-off with its punched hole, the closing stats, the best marks and the
 * footer — and reads every string from the same helpers the canvas draw uses,
 * so the two can never drift apart on copy or numbers.
 */
export function BibCardPreview({
  summary,
  name,
  cardWidth = 0,
}: {
  summary: YearSummary
  name: string | null
  /** The card's own width in layout pixels; 0 until the story measures it. */
  cardWidth?: number
}) {
  const copy = t.stories['08-dorsal']
  const numberText = String(summary.bibCard.number)
  const archetype = bibCardArchetypeText(summary)
  const stickerText = bibCardStickerText(summary)
  const monthly = summary.bibCard.monthlyDistanceM
  const maxMonthly = Math.max(...monthly, 0)
  const peakMonth = monthly.indexOf(maxMonthly)
  const marks = bibCardMarkRows(summary)
  const statRows = bibCardStatRows(summary)
  // The preview card *is* the plate, so the number uses the renderer's own fit
  // rule scaled to this width: what fits here fits on the exported PNG.
  const numberSize =
    cardWidth > 0
      ? Math.max(
          20,
          Math.round(
            bibCardNumberSize(numberText.length) * (cardWidth / bibCardGeometry.plateWidth),
          ),
        )
      : 0

  return (
    <div
      data-testid="dorsal-preview"
      className="relative flex w-[86%] max-w-sm flex-col gap-2.5 rounded-[6px] bg-bone p-4 pt-2.5 text-ink shadow-xl"
    >
      <span
        aria-hidden="true"
        className="absolute left-[14px] top-2.5 size-3 rounded-full bg-ink shadow-[inset_2px_2px_3px_rgba(252,82,0,0.45)]"
      />
      <span
        aria-hidden="true"
        className="absolute right-[14px] top-2.5 size-3 rounded-full bg-ink shadow-[inset_2px_2px_3px_rgba(252,82,0,0.45)]"
      />

      <header className="mt-1 flex items-baseline gap-2 border-y border-line-light py-1">
        <span aria-hidden="true" className="font-display text-lg leading-none">
          {CARD_STAGE_NUMERAL}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-label-ink">
          {copy.plate}
        </span>
      </header>

      <div
        data-testid="dorsal-number"
        className="-mx-4 text-center font-display leading-none whitespace-nowrap"
        style={{ fontSize: numberSize > 0 ? `${numberSize}px` : undefined }}
      >
        {numberText}
      </div>

      <div className="text-center text-[13px] font-bold uppercase tracking-[0.24em]">
        {bibCardNameText(name)}
      </div>

      {archetype === null ? null : (
        <div className="text-center font-mono text-[9px] uppercase tracking-[0.18em] text-label-ink">
          {archetype}
        </div>
      )}

      {stickerText === null ? null : (
        <div className="flex justify-end pr-0.5">
          <span className="-rotate-[4deg] rounded-pill bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
            {stickerText}
          </span>
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
                key={`bar-${String(index)}`}
                className={`flex-1 rounded-[3px] ${index === peakMonth && height > 0 ? 'bg-accent' : 'bg-ink'}`}
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

      <div aria-hidden="true" className="relative border-t-2 border-dashed border-bone-soft">
        <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
      </div>

      <div
        className="grid gap-1 text-center"
        style={{ gridTemplateColumns: `repeat(${statRows.length}, minmax(0, 1fr))` }}
      >
        {statRows.map((row) => (
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
          <ul className="divide-y divide-line-light">
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
