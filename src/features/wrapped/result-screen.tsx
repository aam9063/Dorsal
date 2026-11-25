import { useRef, useState, type ReactNode } from 'react'
import { resultCorruptWarning, t } from '../../shared/i18n'
import { formatDuration, formatKilometres, formatNumber } from '../../shared/format'
import { handedOffSeasonSummary } from '../processing'
import { Player } from './player/player'
import { STORIES } from './stories/registry'
import { StoryContent } from './stories/story-content'

const PLATE = 'relative rounded-[4px] bg-bone text-ink shadow-[0_16px_34px_rgba(15,16,13,0.4)]'
const PIN =
  'absolute top-3 size-[18px] rounded-full bg-ink shadow-[inset_3px_3px_5px_rgba(252,82,0,0.45)]'

/**
 * The primary action of the screen: a bone sticker with an ink label and a hard
 * orange offset shadow, the single primary treatment of the product
 * (design notes of 03-objeto-dorsal, rule 1). Orange is never a fill here.
 */
const CTA_CHIP =
  'inline-flex min-h-11 items-center rounded-chip bg-bone px-6 py-3 font-mono text-[13px] font-bold uppercase tracking-[0.1em] text-ink shadow-[4px_4px_0_var(--color-orange)] transition-shadow hover:shadow-[6px_6px_0_var(--color-orange)] active:shadow-[2px_2px_0_var(--color-orange)]'

const PLATE_ROTATIONS = [
  '-rotate-[1.2deg]',
  'rotate-[0.8deg]',
  'rotate-[1.6deg]',
  '-rotate-[0.6deg]',
] as const

/**
 * The editorial spine's numbered header band: display numeral and mono metadata
 * on the same baseline between two hairlines (odd/tasks/redesign-objeto-dorsal.md, S2).
 */
function SectionHeader({
  number,
  meta,
  spineLabel,
}: {
  number: string
  meta: string
  /** Mono spine label trailing inside the band at narrow widths. */
  spineLabel?: string
}) {
  return (
    <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y border-line py-2.5">
      <span
        aria-hidden="true"
        className="font-display text-[clamp(34px,3vw,40px)] leading-[1.1] text-accent-text"
      >
        {number}
      </span>
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">{meta}</span>
      {spineLabel !== undefined && (
        <span
          aria-hidden="true"
          className="ml-auto hidden font-mono text-[11px] uppercase tracking-[0.3em] text-fg-subtle min-[480px]:inline lg:hidden"
        >
          {spineLabel}
        </span>
      )}
    </header>
  )
}

function SpineColumn() {
  return (
    <div aria-hidden="true" className="hidden lg:block lg:border-r lg:border-line lg:pt-6">
      <span className="block rotate-180 whitespace-nowrap pr-3 text-right font-mono text-[11px] uppercase tracking-[0.3em] text-fg-subtle [writing-mode:vertical-rl]">
        {t.landing.spineLabel}
      </span>
    </div>
  )
}

/**
 * Screen shell of the object language: rotated spine at desktop, in-band mono
 * label at narrow widths (odd/tasks/redesign-objeto-dorsal.md, decision 3).
 */
function ScreenField({
  number,
  meta,
  testId,
  children,
}: {
  number: string
  meta: string
  testId?: string
  children: ReactNode
}) {
  return (
    <div
      data-testid={testId}
      className="mx-auto flex w-full max-w-[720px] flex-col px-5 py-10 sm:px-8 sm:py-14 lg:grid lg:grid-cols-[44px_minmax(0,1fr)] lg:gap-8"
    >
      <SpineColumn />
      <div className="flex min-w-0 flex-col">
        <SectionHeader number={number} meta={meta} spineLabel={t.landing.spineLabel} />
        {children}
      </div>
    </div>
  )
}

/**
 * A headline number as a pinned bone plate: mono label over a display numeral.
 * `emphasis` marks the season's headline figure with the bib card's big number.
 */
function StatPlate({
  testId,
  label,
  value,
  rotation,
  emphasis = false,
}: {
  testId: string
  label: string
  value: string
  rotation: string
  emphasis?: boolean
}) {
  return (
    <div
      className={`${PLATE} ${rotation} flex flex-col px-5 pb-5 pt-9 ${
        emphasis
          ? 'w-full flex-1 basis-full flex-col-reverse sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-7 sm:pb-7 sm:pt-10'
          : 'flex-1 basis-[158px]'
      }`}
    >
      <span aria-hidden="true" className={`${PIN} left-4 sm:left-6`} />
      <span aria-hidden="true" className={`${PIN} right-4 sm:right-6`} />
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-label-ink">{label}</dt>
      <dd
        data-testid={testId}
        className={
          emphasis
            ? 'font-display text-[clamp(56px,8vw,84px)] leading-none text-accent-on-bone'
            : 'mt-1 font-display text-[clamp(30px,4vw,40px)] leading-none'
        }
      >
        {value}
      </dd>
    </div>
  )
}

export function ResultScreen() {
  const season = handedOffSeasonSummary()
  const [playerOpen, setPlayerOpen] = useState(false)
  const openPlayerRef = useRef<HTMLButtonElement>(null)

  if (season === null) {
    return (
      <ScreenField number="01" meta={t.result.meta} testId="result-root">
        <section className="flex flex-col">
          <h1 className="mt-6 font-display text-[clamp(44px,6vw,60px)] uppercase leading-[0.98]">
            {t.result.title}
          </h1>
          <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-fg-muted [text-wrap:pretty]">
            {t.result.subtitle}
          </p>
          <p
            className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-accent-text"
            data-testid="result-provisional"
          >
            {t.result.provisional}
          </p>
        </section>
      </ScreenField>
    )
  }

  const { summary, stats } = season

  const { totals } = summary

  return (
    <ScreenField number="01" meta={t.result.meta} testId="result-root">
      <section className="flex flex-col pt-6">
        <h1 className="font-display text-[clamp(44px,6vw,60px)] uppercase leading-[0.98]">
          {t.result.title}
        </h1>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-fg-muted [text-wrap:pretty]">
          {t.result.subtitle}
        </p>
        <dl data-testid="result-totals" className="mt-8 flex flex-wrap gap-4">
          <StatPlate
            testId="result-total-distance"
            label={t.result.kilometres}
            value={formatKilometres(totals.distanceM)}
            rotation="-rotate-[0.6deg]"
            emphasis
          />
          <StatPlate
            testId="result-total-moving-time"
            label={t.result.movingTime}
            value={formatDuration(totals.movingTimeS)}
            rotation={PLATE_ROTATIONS[1]}
          />
          <StatPlate
            testId="result-total-activities"
            label={t.result.activities}
            value={formatNumber(totals.activityCount)}
            rotation={PLATE_ROTATIONS[2]}
          />
          <StatPlate
            testId="result-total-active-days"
            label={t.result.activeDays}
            value={formatNumber(totals.activeDays)}
            rotation={PLATE_ROTATIONS[3]}
          />
          <StatPlate
            testId="result-total-elevation"
            label={t.result.elevation}
            value={formatNumber(totals.elevationGainM)}
            rotation={PLATE_ROTATIONS[0]}
          />
        </dl>
        {stats.corruptRows > 0 && (
          <p
            className="mt-4 text-base leading-relaxed text-fg-muted [text-wrap:pretty]"
            role="status"
            data-testid="upload-warning-corrupt"
          >
            {resultCorruptWarning(stats.corruptRows)}
          </p>
        )}
        <button
          ref={openPlayerRef}
          type="button"
          data-testid="result-open-player"
          onClick={() => {
            setPlayerOpen(true)
          }}
          className="mt-10 self-start"
        >
          <span data-impeccable-ignore="hard-offset-shadow" className={CTA_CHIP}>
            {t.result.openPlayer}
          </span>
        </button>
      </section>
      {playerOpen && (
        <Player
          stories={STORIES}
          summary={summary}
          renderStory={(story, storySummary) => (
            <StoryContent story={story} summary={storySummary} />
          )}
          onClose={() => {
            setPlayerOpen(false)
            openPlayerRef.current?.focus()
          }}
        />
      )}
    </ScreenField>
  )
}
