/**
 * The only `src/core/` module allowed to produce a date value
 * (AGENTS.md §5.1): `new Date()` and `Math.random` are lint-banned there, so
 * every timestamp Dorsal keeps travels as a plain {@link PlainDateTime}.
 */

/** A local wall-clock time with a 1-based `month`. Mirrors the export format. */
export interface PlainDateTime {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const MONTHS_BY_ABBREVIATION: ReadonlyMap<string, number> = new Map([
  ['ene', 1],
  ['feb', 2],
  ['mar', 3],
  ['abr', 4],
  ['may', 5],
  ['jun', 6],
  ['jul', 7],
  ['ago', 8],
  ['sept', 9],
  ['oct', 10],
  ['nov', 11],
  ['dic', 12],
])

/** `d MMM yyyy, H:mm:ss`: day and hour are not zero-padded, minute/second always are. */
const EXPORT_DATE_PATTERN =
  /^(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sept|oct|nov|dic) (\d{4}), (\d{1,2}):(\d{1,2}):(\d{1,2})$/

/**
 * Decision 2 of `odd/tasks/h02-export-reader.md`: the export carries no
 * timezone offset, so the file is treated as already-local wall-clock time.
 * This identity is the single place where a conversion would be applied if
 * that assumption is ever disproven; it exists so the change stays one line
 * instead of being scattered through the reader.
 */
function asExportedLocalWallClock(value: PlainDateTime): PlainDateTime {
  return value
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31
}

/**
 * Parses the documented export timestamp `5 nov 2026, 18:32:11` into a
 * {@link PlainDateTime}. Spanish month abbreviations include the four-letter
 * `sept`. Returns `null` for anything else — including out-of-range
 * day/month/hour/minute/second values — and never throws.
 */
export function parseExportDate(text: string): PlainDateTime | null {
  const match = EXPORT_DATE_PATTERN.exec(text)
  if (match === null) {
    return null
  }
  const [dayText, monthAbbreviation, yearText, hourText, minuteText, secondText] = match.slice(1)
  const month =
    monthAbbreviation === undefined ? undefined : MONTHS_BY_ABBREVIATION.get(monthAbbreviation)
  if (dayText === undefined || month === undefined || yearText === undefined) {
    return null
  }
  const day = Number(dayText)
  const year = Number(yearText)
  const hour = Number(hourText ?? '-1')
  const minute = Number(minuteText ?? '-1')
  const second = Number(secondText ?? '-1')
  if (day < 1 || day > daysInMonth(year, month)) {
    return null
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null
  }
  return asExportedLocalWallClock({ year, month, day, hour, minute, second })
}

/** First and last instant of the 2026 season, inclusive (BRIEF §5.4). */
const SEASON_START: PlainDateTime = { year: 2026, month: 1, day: 1, hour: 0, minute: 0, second: 0 }
const SEASON_END: PlainDateTime = {
  year: 2026,
  month: 12,
  day: 31,
  hour: 23,
  minute: 59,
  second: 59,
}

function toComparable(value: PlainDateTime): number {
  return (
    value.year * 1_000_000_000_00 +
    value.month * 1_000_000_000 +
    value.day * 1_000_000 +
    value.hour * 10_000 +
    value.minute * 100 +
    value.second
  )
}

/** True between 2026-01-01 00:00:00 and 2026-12-31 23:59:59, inclusive. */
export function isInSeason2026(value: PlainDateTime): boolean {
  return (
    toComparable(value) >= toComparable(SEASON_START) &&
    toComparable(value) <= toComparable(SEASON_END)
  )
}

/** `0` is Sunday and `6` is Saturday, so no locale is involved. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Days since 1970-01-01 for a calendar date, using Howard Hinnant's civil
 * algorithm. Monotonic, so two dates are consecutive when their ordinals
 * differ by one, and a streak needs no date arithmetic anywhere else.
 */
export function dayOrdinal(value: PlainDateTime): number {
  const { year, month, day } = value
  const shiftedYear = month <= 2 ? year - 1 : year
  const era = Math.floor(shiftedYear / 400)
  const yearOfEra = shiftedYear - era * 400
  const shiftedMonth = month + (month > 2 ? -3 : 9)
  const dayOfYear = Math.floor((153 * shiftedMonth + 2) / 5) + day - 1
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear
  return era * 146_097 + dayOfEra - 719_468
}

/**
 * Weekday of a calendar date. 1970-01-01 was a Thursday, hence the `+ 4`, and
 * the extra `+ 7` keeps the modulo positive for dates before the epoch.
 */
export function weekdayOf(value: PlainDateTime): Weekday {
  const shifted = (dayOrdinal(value) % 7) + 7 + 4
  return (shifted % 7) as Weekday
}
