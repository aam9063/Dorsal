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

/** Plain integer (`-12`); throws nothing, answers `null` for absent and unparsable. */
function readOptionalInteger(text: string): number | null | 'invalid' {
  if (text === EMPTY) {
    return null
  }
  return /^-?\d+$/.test(text) ? Number(text) : 'invalid'
}

/**
 * Decimal seconds with a documented `.0` tail (`5100.0`), truncated to whole
 * seconds (BRIEF §5.2 / docs/export-format.md "Numbers").
 */
function readRequiredSeconds(text: string): number | null | 'invalid' {
  if (text === EMPTY || !/^-?\d+(\.\d+)?$/.test(text)) {
    return 'invalid'
  }
  return Math.trunc(Number(text))
}

/**
 * Metres with a dot decimal (`1234.6`). Thousands separators, if an export
 * carries them, are stripped rather than trusted clean
 * (docs/export-format.md "Non-negotiable reading rules" 4).
 */
function readOptionalMetres(text: string): number | null | 'invalid' {
  if (text === EMPTY) {
    return null
  }
  const cleaned = text.replaceAll(/[\s,]/g, EMPTY)
  return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : 'invalid'
}

/** Text column: empty is absent, and the raw value is kept verbatim. */
function readOptionalText(text: string): string | null {
  return text === EMPTY ? null : text
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
  const elevationGainM = readOptionalInteger(field(row, COLUMN.elevationGainM))
  const maxHeartRate = readOptionalInteger(field(row, COLUMN.heartRateMax))
  const avgHeartRate = readOptionalInteger(field(row, COLUMN.heartRateAvg))
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
 * Reads an `activities.csv` export of the layout documented in
 * `docs/export-format.md` into kept 2026 activities plus small counters.
 *
 * Rows are handled one at a time through Papa Parse's `step` callback, so no
 * intermediate array of every row exists (BRIEF §4.2: rows from other years
 * are never held in memory, they only increment a counter). A row that cannot
 * be normalized is skipped and counted without ever throwing or aborting the
 * parse. Pure and deterministic: the same text always yields the same result.
 */
export function readActivities(csvText: string): ReadResult {
  const activities: Activity[] = []
  let totalRows = 0
  let inSeason = 0
  let discardedOtherYear = 0
  let corruptRows = 0
  let isHeaderRow = true

  Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: 'greedy',
    step: (result) => {
      if (isHeaderRow) {
        isHeaderRow = false
        return
      }
      totalRows += 1
      const activity = normalizeRow(result.data)
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
  })

  return {
    activities,
    stats: { totalRows, inSeason, discardedOtherYear, corruptRows },
  }
}
