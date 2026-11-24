import { describe, expect, it } from 'vitest'
import {
  calendarDateOf,
  dayOrdinal,
  isInSeason2026,
  isoWeekOf,
  isoWeekdayOf,
  parseExportDate,
  weekdayOf,
  type PlainDateTime,
} from './index'

const MONTH_ABBREVIATIONS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sept',
  'oct',
  'nov',
  'dic',
] as const

function plainDateTime(values: {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}): PlainDateTime {
  return values
}

describe('parseExportDate', () => {
  it('parses one documented row per month, including the four-letter September', () => {
    MONTH_ABBREVIATIONS.forEach((abbreviation, index) => {
      expect(parseExportDate(`5 ${abbreviation} 2026, 7:30:45`)).toEqual({
        year: 2026,
        month: index + 1,
        day: 5,
        hour: 7,
        minute: 30,
        second: 45,
      })
    })
  })

  it('parses the documented exact example 5 nov 2026, 18:32:11', () => {
    expect(parseExportDate('5 nov 2026, 18:32:11')).toEqual({
      year: 2026,
      month: 11,
      day: 5,
      hour: 18,
      minute: 32,
      second: 11,
    })
  })

  it('returns null for an out-of-range day, month, hour, minute or second without throwing', () => {
    expect(parseExportDate('32 ene 2026, 10:00:00')).toBeNull()
    expect(parseExportDate('29 feb 2026, 10:00:00')).toBeNull()
    expect(parseExportDate('31 feb 2026, 10:00:00')).toBeNull()
    expect(parseExportDate('13 mes 2026, 10:00:00')).toBeNull()
    expect(parseExportDate('5 tic 2026, 10:00:00')).toBeNull()
    expect(parseExportDate('5 ene 2026, 24:00:00')).toBeNull()
    expect(parseExportDate('5 ene 2026, 10:60:00')).toBeNull()
    expect(parseExportDate('5 ene 2026, 10:00:60')).toBeNull()
  })

  it('returns null for empty and garbage input without throwing', () => {
    expect(parseExportDate('')).toBeNull()
    expect(parseExportDate('   ')).toBeNull()
    expect(parseExportDate('hello')).toBeNull()
    expect(parseExportDate('5 nov 2026')).toBeNull()
    expect(parseExportDate('26-12-31 10:00:00')).toBeNull()
  })
})

describe('isInSeason2026', () => {
  it('accepts the documented boundary cases of the 2026 season', () => {
    expect(
      isInSeason2026(
        plainDateTime({ year: 2025, month: 12, day: 31, hour: 23, minute: 30, second: 0 }),
      ),
    ).toBe(false)
    expect(
      isInSeason2026(
        plainDateTime({ year: 2026, month: 1, day: 1, hour: 0, minute: 10, second: 0 }),
      ),
    ).toBe(true)
    expect(
      isInSeason2026(
        plainDateTime({ year: 2026, month: 12, day: 31, hour: 23, minute: 50, second: 0 }),
      ),
    ).toBe(true)
    expect(
      isInSeason2026(
        plainDateTime({ year: 2026, month: 1, day: 1, hour: 0, minute: 0, second: 0 }),
      ),
    ).toBe(true)
    expect(
      isInSeason2026(
        plainDateTime({ year: 2026, month: 12, day: 31, hour: 23, minute: 59, second: 59 }),
      ),
    ).toBe(true)
    expect(
      isInSeason2026(
        plainDateTime({ year: 2027, month: 1, day: 1, hour: 0, minute: 0, second: 0 }),
      ),
    ).toBe(false)
  })

  it('accepts both Spanish clock-change dates of 2026', () => {
    expect(
      isInSeason2026(
        plainDateTime({ year: 2026, month: 3, day: 29, hour: 3, minute: 30, second: 0 }),
      ),
    ).toBe(true)
    expect(
      isInSeason2026(
        plainDateTime({ year: 2026, month: 10, day: 25, hour: 2, minute: 30, second: 0 }),
      ),
    ).toBe(true)
  })
})

describe('calendar arithmetic', () => {
  const date = (year: number, month: number, day: number): PlainDateTime => ({
    year,
    month,
    day,
    hour: 12,
    minute: 0,
    second: 0,
  })

  it('gives consecutive ordinals to consecutive days', () => {
    expect(dayOrdinal(date(2026, 3, 28)) + 1).toBe(dayOrdinal(date(2026, 3, 29)))
    expect(dayOrdinal(date(2025, 12, 31)) + 1).toBe(dayOrdinal(date(2026, 1, 1)))
    expect(dayOrdinal(date(2024, 2, 28)) + 1).toBe(dayOrdinal(date(2024, 2, 29)))
    expect(dayOrdinal(date(2024, 2, 29)) + 1).toBe(dayOrdinal(date(2024, 3, 1)))
    expect(dayOrdinal(date(2026, 12, 31)) + 1).toBe(dayOrdinal(date(2027, 1, 1)))
  })

  it('gives 1970-01-01 the ordinal zero', () => {
    expect(dayOrdinal(date(1970, 1, 1))).toBe(0)
  })

  it('knows the weekday of known dates', () => {
    expect(weekdayOf(date(1970, 1, 1))).toBe(4)
    expect(weekdayOf(date(2026, 1, 1))).toBe(4)
    expect(weekdayOf(date(2026, 12, 31))).toBe(4)
    expect(weekdayOf(date(2024, 2, 29))).toBe(4)
    expect(weekdayOf(date(2000, 1, 1))).toBe(6)
    expect(weekdayOf(date(2026, 11, 23))).toBe(1)
  })

  it('advances the weekday by one per day, wrapping after Saturday', () => {
    let previous = weekdayOf(date(2026, 1, 1))
    for (let day = 2; day <= 10; day += 1) {
      const current = weekdayOf(date(2026, 1, day))
      expect(current).toBe(((previous + 1) % 7) as typeof previous)
      previous = current
    }
  })
})

describe('ISO-8601 weeks', () => {
  const date = (year: number, month: number, day: number): PlainDateTime => ({
    year,
    month,
    day,
    hour: 12,
    minute: 0,
    second: 0,
  })

  it('places 2026-01-01, a Thursday, in ISO week 1 of 2026', () => {
    expect(isoWeekOf(date(2026, 1, 1))).toEqual({ isoYear: 2026, isoWeek: 1 })
  })

  it('keeps Sunday 2026-01-04 in week 1 and moves Monday 2026-01-05 to week 2', () => {
    expect(isoWeekOf(date(2026, 1, 4))).toEqual({ isoYear: 2026, isoWeek: 1 })
    expect(isoWeekOf(date(2026, 1, 5))).toEqual({ isoYear: 2026, isoWeek: 2 })
  })

  it('maps known mid-year Mondays of 2026 to their weeks', () => {
    expect(isoWeekOf(date(2026, 6, 15))).toEqual({ isoYear: 2026, isoWeek: 25 })
    expect(isoWeekOf(date(2026, 11, 23))).toEqual({ isoYear: 2026, isoWeek: 48 })
  })

  it('closes the 53rd week: every day from Monday 2026-12-28 to Thursday 2026-12-31 is week 53', () => {
    for (const day of [28, 29, 30, 31]) {
      expect(isoWeekOf(date(2026, 12, day))).toEqual({ isoYear: 2026, isoWeek: 53 })
    }
  })

  it('keeps the Monday that opens week 1 of 2026 in the previous calendar year', () => {
    expect(isoWeekOf(date(2025, 12, 29))).toEqual({ isoYear: 2026, isoWeek: 1 })
  })

  it('rolls the last week of a 52-week year over to week 1 of the next ISO year', () => {
    expect(isoWeekOf(date(2024, 12, 30))).toEqual({ isoYear: 2025, isoWeek: 1 })
    expect(isoWeekOf(date(2024, 12, 31))).toEqual({ isoYear: 2025, isoWeek: 1 })
  })

  it('numbers the weekday from Monday as the ISO convention does', () => {
    expect(isoWeekdayOf(date(2026, 1, 5))).toBe(1)
    expect(isoWeekdayOf(date(2026, 1, 1))).toBe(4)
    expect(isoWeekdayOf(date(2026, 1, 4))).toBe(7)
  })
})

describe('calendarDateOf', () => {
  const date = (year: number, month: number, day: number): PlainDateTime => ({
    year,
    month,
    day,
    hour: 12,
    minute: 0,
    second: 0,
  })

  it('gives 1970-01-01 the ordinal zero and itself back', () => {
    expect(dayOrdinal(date(1970, 1, 1))).toBe(0)
    expect(calendarDateOf(0)).toEqual({ year: 1970, month: 1, day: 1 })
  })

  it('is the inverse of dayOrdinal for known dates', () => {
    const known: [number, number, number][] = [
      [2024, 2, 29],
      [2025, 12, 29],
      [2026, 3, 15],
      [2026, 12, 31],
      [2027, 1, 1],
    ]
    for (const [year, month, day] of known) {
      expect(calendarDateOf(dayOrdinal(date(year, month, day)))).toEqual({
        year,
        month,
        day,
      })
    }
  })

  it('spanning a whole year advances the ordinal by 365 and by 366', () => {
    expect(dayOrdinal(date(2027, 1, 1)) - dayOrdinal(date(2026, 1, 1))).toBe(365)
    expect(dayOrdinal(date(2025, 1, 1)) - dayOrdinal(date(2024, 1, 1))).toBe(366)
  })

  it('advances by one calendar day across every month boundary of 2026', () => {
    const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    monthLengths.forEach((length, index) => {
      const lastDay = calendarDateOf(dayOrdinal(date(2026, index + 1, length)) + 1)
      expect(lastDay.month).toBe(index < 11 ? index + 2 : 1)
      expect(lastDay.day).toBe(1)
    })
  })
})
