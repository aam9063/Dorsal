import * as Comlink from 'comlink'
import { YearSummary } from '../core/model/year-summary'
import type { AnalyzeApi, AnalyzeOutcome, AnalyzeProgress } from './contract'

export type {
  AnalyzeFailure,
  AnalyzeFailureCode,
  AnalyzeOutcome,
  AnalyzePhase,
  AnalyzeProgress,
} from './contract'
export type { YearSummary } from '../core/model/year-summary'

/** One analysis running on its own worker; `cancel` stops the read between chunks. */
export interface AnalysisRun {
  outcome: Promise<AnalyzeOutcome>
  cancel(): void
}

/**
 * Starts the worker, hands it the `File` (a `Blob`, so it travels by
 * reference) and validates the summary it returns: a contract violation is a
 * processing error, never a broken story (odd/tasks/h05-worker-progress.md,
 * decision 5). The worker is terminated once the outcome is known.
 */
export function startAnalysis(
  file: File,
  onProgress: (progress: AnalyzeProgress) => void,
): AnalysisRun {
  const worker = new Worker(new URL('./index.ts', import.meta.url), { type: 'module' })
  const api = Comlink.wrap<AnalyzeApi>(worker)
  const outcome: Promise<AnalyzeOutcome> = api
    .analyze(file, Comlink.proxy(onProgress))
    .then(validateSummary)
    .catch((error: unknown): AnalyzeOutcome => ({
      status: 'error',
      failure: { code: 'failed', message: String(error) },
    }))
    .finally(() => {
      void worker.terminate()
    })

  return {
    outcome,
    cancel: () => {
      void api.cancel()
    },
  }
}

function validateSummary(outcome: AnalyzeOutcome): AnalyzeOutcome {
  if (outcome.status !== 'ok') {
    return outcome
  }
  const parsed = YearSummary.safeParse(outcome.summary)
  return parsed.success
    ? outcome
    : { status: 'error', failure: { code: 'contract', message: parsed.error.message } }
}
