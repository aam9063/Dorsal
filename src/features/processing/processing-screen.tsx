import { t } from '../../shared/i18n'
import { formatNumber } from '../../shared/format'
import { useAnalysis } from '../../shared/hooks'
import type { ReactNode } from 'react'
import type {
  AnalyzeFailureCode,
  AnalyzeOutcome,
  AnalyzePhase,
  AnalyzeReadStats,
  YearSummary,
} from '../../worker/client'

const PLATE = 'relative rounded-[4px] bg-bone text-ink shadow-[0_16px_34px_rgba(15,16,13,0.4)]'

/** Secondary actions: outline only, no fill (design notes of 03-objeto-dorsal). */
const GHOST_PILL =
  'inline-flex min-h-11 items-center rounded-pill border border-line px-6 font-mono text-xs uppercase tracking-[0.14em] text-fg transition-colors hover:border-accent'

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

interface ProcessingScreenProps {
  file: File
  /** Called once with the validated summary and the read stats of the run. */
  onComplete: (summary: YearSummary, stats: AnalyzeReadStats) => void
  /** Called when the user cancels the run. */
  onCancel: () => void
}

function phaseLabel(phase: AnalyzePhase): string {
  switch (phase) {
    case 'reading':
      return t.processing.phaseReading
    case 'computing':
      return t.processing.phaseComputing
    case 'done':
      return t.processing.phaseDone
  }
}

function failureMessage(code: AnalyzeFailureCode | undefined): string {
  return code === 'unreadable' ? t.processing.errorUnreadable : t.processing.errorGeneric
}

function ErrorSection({
  testId,
  title,
  body,
  onBack,
}: {
  testId: string
  title: string
  body: string
  onBack: () => void
}) {
  return (
    <ScreenField number="02" meta={t.processing.errorMeta}>
      <section data-testid={testId} className="flex flex-col">
        <h1 className="mt-6 font-display text-[clamp(40px,6vw,56px)] uppercase leading-[0.98]">
          {title}
        </h1>
        <p
          className="mt-4 max-w-[60ch] text-base leading-relaxed text-fg-muted [text-wrap:pretty]"
          role="alert"
        >
          {body}
        </p>
        <button
          type="button"
          data-testid="processing-cancel"
          className={`${GHOST_PILL} mt-8 self-start`}
          onClick={onBack}
        >
          {t.processing.back}
        </button>
      </section>
    </ScreenField>
  )
}

function ProcessingError({
  code,
  onBack,
}: {
  code: AnalyzeFailureCode | undefined
  onBack: () => void
}) {
  if (code === 'zipInsteadOfCsv') {
    return (
      <ErrorSection
        testId="upload-error-zip"
        title={t.upload.errors.zipTitle}
        body={t.upload.errors.zipBody}
        onBack={onBack}
      />
    )
  }
  if (code === 'notStrava') {
    return (
      <ErrorSection
        testId="upload-error-not-strava"
        title={t.upload.errors.notStravaTitle}
        body={t.upload.errors.notStravaBody}
        onBack={onBack}
      />
    )
  }
  return (
    <ErrorSection
      testId="processing-root"
      title={t.processing.errorTitle}
      body={failureMessage(code)}
      onBack={onBack}
    />
  )
}

function CounterPlate({ label, value, rot }: { label: string; value: string; rot: string }) {
  return (
    <div className={`${PLATE} ${rot} flex min-w-[150px] flex-1 basis-[150px] flex-col gap-1.5 p-5`}>
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-label-ink">
        {label}
      </span>
      <span className="font-display text-[clamp(30px,4vw,40px)] leading-none">{value}</span>
    </div>
  )
}

export function ProcessingScreen({ file, onComplete, onCancel }: ProcessingScreenProps) {
  function handleFinished(outcome: AnalyzeOutcome): void {
    if (outcome.status === 'ok') {
      onComplete(outcome.summary, outcome.stats)
    }
    if (outcome.status === 'cancelled') {
      onCancel()
    }
  }

  const analysis = useAnalysis(file, handleFinished)

  if (analysis.status === 'error') {
    return <ProcessingError code={analysis.failure?.code} onBack={onCancel} />
  }

  const progress = analysis.progress ?? { phase: 'reading' as const, seenRows: 0, keptRows: 0 }

  return (
    <ScreenField number="01" meta={t.processing.meta} testId="processing-root">
      <h1 className="mt-6 font-display text-[clamp(44px,6vw,60px)] uppercase leading-[0.98]">
        {t.processing.title}
      </h1>
      <div
        aria-live="polite"
        data-testid="processing-progress"
        className="mt-6 flex flex-col gap-5"
      >
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent-text">
          {phaseLabel(progress.phase)}
        </p>
        <div className="flex flex-wrap gap-5">
          <CounterPlate
            rot="-rotate-[1.2deg]"
            label={t.processing.seenRowsLabel}
            value={formatNumber(progress.seenRows)}
          />
          <CounterPlate
            rot="rotate-[0.8deg]"
            label={t.processing.keptRowsLabel}
            value={formatNumber(progress.keptRows)}
          />
        </div>
      </div>
      <button
        type="button"
        data-testid="processing-cancel"
        className={`${GHOST_PILL} mt-10 self-start`}
        onClick={onCancel}
      >
        {t.processing.cancel}
      </button>
    </ScreenField>
  )
}
