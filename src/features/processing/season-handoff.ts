import type { YearSummary } from '../../core/model/year-summary'
import type { AnalyzeReadStats } from '../../worker/client'

/** The validated summary of a run plus the read stats its warnings need. */
export interface SeasonHandoff {
  summary: YearSummary
  stats: AnalyzeReadStats
}

let handedOff: SeasonHandoff | null = null

/** Keeps the validated summary of the run that just finished for the result screen. */
export function handOffSeasonSummary(season: SeasonHandoff): void {
  handedOff = season
}

/** The summary handed off by the last completed run, `null` before any run. */
export function handedOffSeasonSummary(): SeasonHandoff | null {
  return handedOff
}
