import type { YearSummary } from '../../core/model/year-summary'

let handedOff: YearSummary | null = null

/** Keeps the summary of the run that just finished for the result screen. */
export function handOffSeasonSummary(summary: YearSummary): void {
  handedOff = summary
}

/** The summary handed off by the last completed run, `null` before any run. */
export function handedOffSeasonSummary(): YearSummary | null {
  return handedOff
}
