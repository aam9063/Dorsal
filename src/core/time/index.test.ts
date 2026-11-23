import { describe, expect, it } from 'vitest'
import { dayOrdinal, isInSeason2026, parseExportDate, weekdayOf, type PlainDateTime } from './index'

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
