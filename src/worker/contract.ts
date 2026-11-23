import type { YearSummary } from '../core/model/year-summary'

/** Phase of the analysis, the brief's own work split (BRIEF §4.2). */
export type AnalyzePhase = 'reading' | 'computing' | 'done'

/**
 * Real counters from the read, never an invented percentage: `seenRows` counts
 * every data row (header excluded) and `keptRows` the 2026 activities so far.
 */
export interface AnalyzeProgress {
  phase: AnalyzePhase
  seenRows: number
  keptRows: number
}

export type AnalyzeFailureCode = 'unreadable' | 'contract' | 'failed'

export interface AnalyzeFailure {
  code: AnalyzeFailureCode
  message: string
}

/**
 * Outcome of one analysis. Bad data never throws: it arrives as a typed
 * failure, and a cancelled run produces no summary.
 */
export type AnalyzeOutcome =
  | { status: 'ok'; summary: YearSummary }
  | { status: 'cancelled' }
  | { status: 'error'; failure: AnalyzeFailure }

/** RPC surface the worker exposes through Comlink (BRIEF §3). */
export interface AnalyzeApi {
  analyze(file: File, reportProgress: (progress: AnalyzeProgress) => void): Promise<AnalyzeOutcome>
  cancel(): void
}
