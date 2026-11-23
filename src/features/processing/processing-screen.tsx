import { t } from '../../shared/i18n'
import { formatNumber } from '../../shared/format'
import { useAnalysis } from '../../shared/hooks'
import type {
  AnalyzeFailureCode,
  AnalyzeOutcome,
  AnalyzePhase,
  YearSummary,
} from '../../worker/client'

const SECTION_CLASS = 'mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:px-8'
const BUTTON_CLASS =
  'inline-flex min-h-11 items-center self-start rounded-pill border border-line px-8 font-semibold text-fg'

interface ProcessingScreenProps {
  file: File
  /** Called once with the validated summary when the run finishes. */
  onComplete: (summary: YearSummary) => void
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

function ProcessingError({
  code,
  onBack,
}: {
  code: AnalyzeFailureCode | undefined
  onBack: () => void
}) {
  return (
    <section data-testid="processing-root" className={SECTION_CLASS}>
      <h1 className="text-5xl">{t.processing.errorTitle}</h1>
      <p className="text-base text-fg-muted" role="alert">
        {failureMessage(code)}
      </p>
      <button
        type="button"
        data-testid="processing-cancel"
        className={BUTTON_CLASS}
        onClick={onBack}
      >
        {t.processing.back}
      </button>
    </section>
  )
}

export function ProcessingScreen({ file, onComplete, onCancel }: ProcessingScreenProps) {
  function handleFinished(outcome: AnalyzeOutcome): void {
    if (outcome.status === 'ok') {
      onComplete(outcome.summary)
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
    <section data-testid="processing-root" className={SECTION_CLASS}>
      <h1 className="text-5xl">{t.processing.title}</h1>
      <div aria-live="polite" data-testid="processing-progress">
        <p className="text-base text-fg-muted">{phaseLabel(progress.phase)}</p>
        <p className="font-mono text-sm text-fg-subtle">
          {t.processing.seenRowsLabel}: {formatNumber(progress.seenRows)}
          <br />
          {t.processing.keptRowsLabel}: {formatNumber(progress.keptRows)}
        </p>
      </div>
      <button
        type="button"
        data-testid="processing-cancel"
        className={BUTTON_CLASS}
        onClick={onCancel}
      >
        {t.processing.cancel}
      </button>
    </section>
  )
}
