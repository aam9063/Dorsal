import Papa from 'papaparse'
import { sportForEsLabel, type Activity, type SportKind } from '../model'
import { isInSeason2026, parseExportDate, type PlainDateTime } from '../time'

/**
 * Column indices of the Spanish `activities.csv` layout. The contract is
 * `docs/export-format.md`: columns are read by index because five header
 * names appear twice, so a name-based lookup would be ambiguous and would
 * also break on non-Spanish accounts.
 */
const COLUMN = {
  activityId: 0,
  activityDate: 1,
  sport: 3,
  elapsedSeconds: 5,
  /** Indexed only: the metre distance below is authoritative, so this stays unread. */
  distanceKm: 6,
  heartRateMax: 7,
  gear: 11,
  /** Duplicate of `elapsedSeconds` with a `.0` tail; never needed. */
  elapsedSecondsDecimal: 15,
  movingSeconds: 16,
  distanceMetres: 17,
  elevationGainM: 20,
  heartRateAvg: 31,
} as const

const FIELD_COUNT = 104

const EMPTY = ''

export interface ReadStats {
  /** Data rows seen, the header excluded. */
  totalRows: number
  /** Rows returned as 2026 activities. */
  inSeason: number
  /** Valid rows whose local start time is outside the 2026 season; never stored. */
  discardedOtherYear: number
  /** Rows that could not be normalized: wrong field count, unparsable date or a non-numeric required value. */
  corruptRows: number
}

export interface ReadResult {
  activities: Activity[]
  stats: ReadStats
}

function field(row: readonly string[], index: number): string {
  return row[index] ?? EMPTY
}

/**
 * A whole quantity that the export writes with a decimal tail (`150.0`, `243.0`
 * for heart rate and elevation), rounded to the integer the model stores.
 * `null` when absent, `'invalid'` otherwise.
 */
function readOptionalWholeNumber(text: string): number | null | 'invalid' {
  if (text === EMPTY) {
    return null
  }
  return /^\d+(\.\d+)?$/.test(text) ? Math.round(Number(text)) : 'invalid'
}

/**
 * Decimal seconds with a documented `.0` tail (`5100.0`), truncated to whole
 * seconds (BRIEF §5.2 / docs/export-format.md "Numbers"). Negative time does
 * not exist in an export, so it is corrupt rather than kept.
 */
function readRequiredSeconds(text: string): number | null | 'invalid' {
  if (text === EMPTY || !/^\d+(\.\d+)?$/.test(text)) {
    return 'invalid'
  }
  return Math.trunc(Number(text))
}

/**
 * Metres with a dot decimal (`1234.6`). A comma is only accepted as a
 * thousands separator with valid 3-digit grouping, so `1,234.6` reads as
 * 1234.6 while `1234,6` and `1.234,6` are rejected: reading them by stripping
 * the comma would silently multiply the distance by ten.
 */
function readOptionalMetres(text: string): number | null | 'invalid' {
  if (text === EMPTY) {
    return null
  }
  const trimmed = text.trim()
  const hasValidThousands = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmed)
  const hasNoThousands = /^\d+(\.\d+)?$/.test(trimmed)
  if (!hasValidThousands && !hasNoThousands) {
    return 'invalid'
  }
  return Number(trimmed.replaceAll(',', EMPTY))
}

/** Text column: empty is absent, and the raw value is kept verbatim. */
function readOptionalText(text: string): string | null {
  return text === EMPTY ? null : text
}

/**
 * The header is the only row whose first field is not an activity id, so a
 * file without one keeps its first row instead of losing it.
 */
function looksLikeHeader(row: readonly string[]): boolean {
  return !/^\d+$/.test(field(row, COLUMN.activityId))
}

function normalizeRow(row: readonly string[]): Activity | null {
  if (row.length !== FIELD_COUNT) {
    return null
  }
  const id = field(row, COLUMN.activityId)
  if (id === EMPTY) {
    return null
  }
  const startLocal: PlainDateTime | null = parseExportDate(field(row, COLUMN.activityDate))
  if (startLocal === null) {
    return null
  }
  const sportRaw = field(row, COLUMN.sport)
  const sport: SportKind = sportForEsLabel(sportRaw)
  const elapsedTimeS = readRequiredSeconds(field(row, COLUMN.elapsedSeconds))
  const movingTimeS = readRequiredSeconds(field(row, COLUMN.movingSeconds))
  const distanceM = readOptionalMetres(field(row, COLUMN.distanceMetres))
  const elevationGainM = readOptionalWholeNumber(field(row, COLUMN.elevationGainM))
  const maxHeartRate = readOptionalWholeNumber(field(row, COLUMN.heartRateMax))
  const avgHeartRate = readOptionalWholeNumber(field(row, COLUMN.heartRateAvg))
  if (
    elapsedTimeS === null ||
    elapsedTimeS === 'invalid' ||
    movingTimeS === null ||
    movingTimeS === 'invalid'
  ) {
    return null
  }
  if (
    distanceM === 'invalid' ||
    elevationGainM === 'invalid' ||
    maxHeartRate === 'invalid' ||
    avgHeartRate === 'invalid'
  ) {
    return null
  }
  return {
    id,
    startLocal,
    sport,
    sportRaw,
    distanceM,
    movingTimeS,
    elapsedTimeS,
    elevationGainM,
    avgHeartRate,
    maxHeartRate,
    gear: readOptionalText(field(row, COLUMN.gear)),
  }
}

/**
 * Incremental reader used by the worker, where rows arrive in chunks from the
 * `File` and progress must be reported before the end. `src/core/` may not
 * touch `File` or `Blob`, so the transport stays outside and only the row
 * decision lives here.
 */
export interface SeasonAccumulator {
  /** Feeds one parsed row. The first row is treated as a header when it looks like one. */
  addRow(row: readonly string[]): void
  /** Rows kept so far, so progress never waits for the file to finish. */
  readonly keptRows: number
  /** Rows seen so far, header excluded. */
  readonly seenRows: number
  /** The activities kept so far and the final counters. */
  finish(): ReadResult
}

export function createSeasonAccumulator(): SeasonAccumulator {
  const activities: Activity[] = []
  let totalRows = 0
  let inSeason = 0
  let discardedOtherYear = 0
  let corruptRows = 0
  let isHeaderRow = true

  return {
    addRow(row: readonly string[]): void {
      if (isHeaderRow) {
        isHeaderRow = false
        if (looksLikeHeader(row)) {
          return
        }
      }
      totalRows += 1
      const activity = normalizeRow(row)
      if (activity === null) {
        corruptRows += 1
        return
      }
      if (!isInSeason2026(activity.startLocal)) {
        discardedOtherYear += 1
        return
      }
      activities.push(activity)
      inSeason += 1
    },
    get keptRows(): number {
      return inSeason
    },
    get seenRows(): number {
      return totalRows
    },
    finish(): ReadResult {
      return {
        activities,
        stats: { totalRows, inSeason, discardedOtherYear, corruptRows },
      }
    },
  }
}

/**
 * Reads an `activities.csv` export of the layout documented in
 * `docs/export-format.md` into kept 2026 activities plus small counters.
 *
 * Rows are handled one at a time through {@link createSeasonAccumulator}, so no
 * intermediate array of every row exists (BRIEF §4.2: rows from other years are
 * never held in memory, they only increment a counter). A row that cannot be
 * normalized is skipped and counted without ever throwing or aborting the
 * parse. Pure and deterministic: the same text always yields the same result.
 */
export function readActivities(csvText: string): ReadResult {
  const accumulator = createSeasonAccumulator()

  Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: 'greedy',
    step: (result) => {
      accumulator.addRow(result.data)
    },
  })

  return accumulator.finish()
}
