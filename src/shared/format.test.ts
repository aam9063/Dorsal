import { describe, expect, it } from 'vitest'
import { formatDuration, formatHourParts, formatKilometres, formatNumber } from './format'

describe('formatDuration', () => {
  it('shows hours and minutes together', () => {
    expect(formatDuration(3600 + 12 * 60)).toBe('1 h 12 min')
    expect(formatDuration(81 * 3600 + 36 * 60)).toBe('81 h 36 min')
  })

  it('drops the minutes when they are zero instead of printing "0 min"', () => {
    expect(formatDuration(8 * 3600)).toBe('8 h')
    expect(formatDuration(3600)).toBe('1 h')
  })

  it('shows only minutes below one hour', () => {
    expect(formatDuration(10 * 60)).toBe('10 min')
    expect(formatDuration(0)).toBe('0 min')
  })
})

describe('formatNumber and formatKilometres', () => {
  it('groups thousands the way Spanish does, from five digits', () => {
    expect(formatNumber(30666)).toBe('30.666')
    expect(formatNumber(4760)).toBe('4760')
    expect(formatKilometres(816000)).toBe('816,0')
  })
})

describe('formatHourParts', () => {
  it('returns the minutes only when there are some', () => {
    expect(formatHourParts(81 * 3600 + 36 * 60)).toEqual({ hours: '81', minutes: '36' })
  })

  it('returns null minutes for a whole number of hours', () => {
    expect(formatHourParts(8 * 3600)).toEqual({ hours: '8', minutes: null })
  })
})
