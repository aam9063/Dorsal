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

/** Reads the analysis produced by the worker, one counter per documented state. */
export interface AnalyzeReadStats {
  /** Data rows seen, the header excluded. */
  totalRows: number
  /** Rows that became 2026 activities. */
  inSeason: number
  /** Valid rows outside the 2026 season, discarded at read time. */
  discardedOtherYear: number
  /** Rows that could not be normalized and were ignored. */
  corruptRows: number
}

export type AnalyzeFailureCode =
  'unreadable' | 'notStrava' | 'zipInsteadOfCsv' | 'contract' | 'failed'

export interface AnalyzeFailure {
  code: AnalyzeFailureCode
  message: string
}

/**
 * Outcome of one analysis. Bad data never throws: it arrives as a typed
 * failure, a cancelled run produces no summary, and a successful one carries
 * the read stats the refusal and warning states need (odd/tasks/h06-upload-errors.md,
 * decision 7).
 */
export type AnalyzeOutcome =
  | { status: 'ok'; summary: YearSummary; stats: AnalyzeReadStats }
  | { status: 'cancelled' }
  | { status: 'error'; failure: AnalyzeFailure }

/** RPC surface the worker exposes through Comlink (BRIEF §3). */
export interface AnalyzeApi {
  analyze(file: File, reportProgress: (progress: AnalyzeProgress) => void): Promise<AnalyzeOutcome>
  cancel(): void
}
