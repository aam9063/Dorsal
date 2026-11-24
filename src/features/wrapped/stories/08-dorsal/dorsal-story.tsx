import { useState } from 'react'
import { BibCardPreview, bibCardActionLabel, shareOrDownloadBibCard } from '../../../share'
import type { YearSummary } from '../../../../core/model/year-summary'
import { t } from '../../../../shared/i18n'
import { useSeasonName } from '../01-portada/season-name'

/**
 * Story 08 (BRIEF §6, odd/tasks/h11-bib-card.md): the card preview plus the
 * one action, whose label states what will actually happen in this browser —
 * share the PNG file where the Web Share API supports files, download it
 * otherwise. The PNG is painted on demand when the button is pressed, so
 * opening the story draws nothing (decision 6).
 */
export function DorsalStory({ summary }: { summary: YearSummary }) {
  const copy = t.stories['08-dorsal']
  const name = useSeasonName()
  const trimmedName = name.trim()
  const [busy, setBusy] = useState(false)
  const label = bibCardActionLabel()

  return (
    <div
      data-testid="story-08-dorsal"
      className="flex w-full flex-col gap-4 rounded-panel bg-accent p-6 text-ink"
    >
      <p className="font-mono text-xs uppercase tracking-[0.14em]">{copy.eyebrow}</p>

      <div className="flex flex-1 items-center justify-center rounded-chip py-4">
        <BibCardPreview summary={summary} name={trimmedName === '' ? null : trimmedName} />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-testid="share-download"
          aria-busy={busy}
          disabled={busy}
          className="pointer-events-auto inline-flex min-h-14 items-center justify-center rounded-pill bg-ink font-sans text-base font-bold text-accent aria-busy:opacity-70"
          onClick={() => {
            setBusy(true)
            shareOrDownloadBibCard({ summary, name: trimmedName === '' ? null : trimmedName })
              .catch(() => {
                setBusy(false)
              })
              .finally(() => {
                setBusy(false)
              })
          }}
        >
          {label}
        </button>
        <p className="text-center text-xs text-ink">{copy.actionHint}</p>
      </div>
    </div>
  )
}
