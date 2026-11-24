import type { YearSummary } from '../../core/model/year-summary'
import { t } from '../../shared/i18n'
import { bibCardArchetypeText, bibCardNameText, bibCardStatRows } from './render-bib-card'

/**
 * The DOM replica of the bib card, following the `W8-Dorsal.dc.html`
 * artboard. It is a *preview*: no canvas is created here and the story never
 * draws the card on open (h11 decision 6). The card is a fixed-colour
 * artefact — bone plate, ink lettering — exactly like the PNG, so it does not
 * follow the theme: `bg-bone`, `text-ink` and `text-label-ink` are
 * theme-independent tokens, and the story's own surface is the accent field.
 */
export function BibCardPreview({ summary, name }: { summary: YearSummary; name: string | null }) {
  const copy = t.stories['08-dorsal']
  const stats = bibCardStatRows(summary)
  const archetype = bibCardArchetypeText(summary)
  const profile = summary.bibCard.monthlyDistanceM
  const max = Math.max(...profile)
  const silhouette = `0,54 0,54 ${profile
    .map((distanceM, index) => {
      const x = ((index * 350) / 11).toFixed(1)
      const y = (54 - (max > 0 ? (distanceM / max) * 44 : 0)).toFixed(1)
      return `${x},${y}`
    })
    .join(' ')} 350,54`

  return (
    <div
      data-testid="dorsal-preview"
      className="relative flex w-[86%] max-w-sm rotate-[-3deg] flex-col gap-2 rounded-card bg-bone p-5 text-ink shadow-xl"
    >
      {(
        [['left-3 top-3'], ['right-3 top-3'], ['left-3 bottom-3'], ['right-3 bottom-3']] as const
      ).map(([position]) => (
        <span
          key={position}
          aria-hidden="true"
          className={`absolute ${position} h-2.5 w-2.5 rounded-pill bg-accent`}
        />
      ))}

      <div className="mx-2 flex items-center justify-between whitespace-nowrap rounded-chip bg-ink px-2 py-1.5 font-mono text-[8px] font-semibold tracking-[0.08em] text-accent">
        <span>{copy.plate}</span>
        <span>{copy.plateKm}</span>
      </div>

      <div
        data-testid="dorsal-number"
        className="text-center font-display text-[88px] leading-[0.95]"
      >
        {summary.bibCard.number}
      </div>
      <div className="break-words text-center text-[15px] font-bold tracking-[0.24em]">
        {bibCardNameText(name)}
      </div>
      {archetype !== null && (
        <div className="break-words text-center font-mono text-[10px] tracking-[0.1em] text-label-ink">
          {archetype}
        </div>
      )}

      <svg
        viewBox="0 0 350 54"
        aria-hidden="true"
        preserveAspectRatio="none"
        className="mx-auto mt-2 h-10 w-full"
      >
        <polygon points={silhouette} className="fill-ink" />
      </svg>

      <div className="mt-1 grid grid-cols-3 gap-1.5 border-t-2 border-dashed border-ink pt-2.5 text-center">
        {stats.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <span className="font-display text-[19px] leading-tight">{row.value}</span>
            <span className="font-mono text-[9px] tracking-[0.08em]">{row.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 text-center font-mono text-[9px] tracking-[0.1em] text-label-ink">
        {copy.madeWith}
      </div>
    </div>
  )
}
