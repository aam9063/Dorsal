import Papa from 'papaparse'
import { createSeasonAccumulator, type SeasonAccumulator } from '../core/export-reader'
import { buildYearSummary } from '../core/metrics/build-year-summary'
import type { AnalyzeApi, AnalyzeOutcome, AnalyzePhase, AnalyzeProgress } from './contract'

/**
 * Rows per read tick. Papa defaults to 10 MB chunks, which would keep the
 * counters silent for most exports (odd/tasks/h02-export-reader.md, finding
 * R3-002); 256 KB keeps the read incremental and the progress real.
 */
const CHUNK_SIZE = 256 * 1024

function progressOf(phase: AnalyzePhase, accumulator: SeasonAccumulator): AnalyzeProgress {
  return { phase, seenRows: accumulator.seenRows, keptRows: accumulator.keptRows }
}

/**
 * Worker-side analysis API. The `File` is read by Papa Parse in chunks, each
 * chunk feeding the incremental season accumulator, so rows from other years
 * are counted and discarded without ever being stored (BRIEF §4.2). Nothing
 * throws for bad data: unreadable files resolve as a typed failure.
 */
export function createAnalyzeApi(): AnalyzeApi {
  let cancelled = false

  return {
    cancel(): void {
      cancelled = true
    },

    analyze(file, reportProgress) {
      cancelled = false
      return new Promise<AnalyzeOutcome>((resolve) => {
        let settled = false
        const settle = (outcome: AnalyzeOutcome): void => {
          if (settled) {
            return
          }
          settled = true
          resolve(outcome)
        }

        const accumulator = createSeasonAccumulator()

        Papa.parse<string[]>(file, {
          chunkSize: CHUNK_SIZE,
          skipEmptyLines: 'greedy',
          chunk: (results, parser) => {
            for (const row of results.data) {
              accumulator.addRow(row)
            }
            if (cancelled) {
              parser.abort()
              settle({ status: 'cancelled' })
              return
            }
            reportProgress(progressOf('reading', accumulator))
          },
          complete: () => {
            if (cancelled) {
              settle({ status: 'cancelled' })
              return
            }
            reportProgress(progressOf('computing', accumulator))
            const { activities } = accumulator.finish()
            const summary = buildYearSummary(activities)
            reportProgress(progressOf('done', accumulator))
            settle({ status: 'ok', summary })
          },
          error: (error) => {
            settle({
              status: 'error',
              failure: { code: 'unreadable', message: String(error.message) },
            })
          },
        })
      })
    },
  }
}
