import { describe, expect, test } from 'vitest'
import { formatCountValue, parseCountValue, shouldAnimate } from './gsap-reveal-policy'

describe('shouldAnimate', () => {
  test('animates when the user allows motion', () => {
    expect(shouldAnimate(false)).toBe(true)
  })

  test('does nothing under prefers-reduced-motion: reduce', () => {
    expect(shouldAnimate(true)).toBe(false)
  })
})

describe('parseCountValue', () => {
  test('reads the hero total kilometres without grouping', () => {
    expect(parseCountValue('3214')).toEqual({
      value: 3214,
      decimals: 0,
      grouped: false,
      suffix: '',
    })
  })

  test('keeps the suffix of a stat with units', () => {
    expect(parseCountValue('287 h')).toEqual({
      value: 287,
      decimals: 0,
      grouped: false,
      suffix: ' h',
    })
  })

  test('reads a grouped Spanish number with a dot separator', () => {
    expect(parseCountValue('41.380')).toEqual({
      value: 41380,
      decimals: 0,
      grouped: true,
      suffix: '',
    })
  })

  test('reads a value with decimals and a symbol suffix', () => {
    expect(parseCountValue('4,7×')).toEqual({
      value: 4.7,
      decimals: 1,
      grouped: false,
      suffix: '×',
    })
  })

  test('reads whole days with their suffix', () => {
    expect(parseCountValue('23 días')).toEqual({
      value: 23,
      decimals: 0,
      grouped: false,
      suffix: ' días',
    })
  })

  test('returns null when there is nothing to count', () => {
    expect(parseCountValue('')).toBeNull()
    expect(parseCountValue('Temporada 2026')).toBeNull()
    expect(parseCountValue('23 días 4 h')).toBeNull()
    expect(parseCountValue('km')).toBeNull()
  })
})

describe('formatCountValue', () => {
  test.each([
    ['3214', '3214'],
    ['412', '412'],
    ['287 h', '287 h'],
    ['41.380', '41.380'],
    ['4,7×', '4,7×'],
    ['23 días', '23 días'],
  ])('reproduces the markup value %s exactly at the end of the count', (text, expected) => {
    const parsed = parseCountValue(text)
    if (parsed === null) {
      throw new Error(`parseCountValue(${JSON.stringify(text)}) returned null`)
    }
    expect(formatCountValue(parsed.value, parsed)).toBe(expected)
  })

  test('formats intermediate values well inside the numeric range', () => {
    const parsed = parseCountValue('41.380')
    if (parsed === null) {
      throw new Error('parseCountValue(41.380) returned null')
    }
    expect(formatCountValue(0, parsed)).toBe('0')
    expect(formatCountValue(20500.4, parsed)).toBe('20.500')

    const withDecimals = parseCountValue('4,7×')
    if (withDecimals === null) {
      throw new Error('parseCountValue(4,7×) returned null')
    }
    expect(formatCountValue(2.34, withDecimals)).toBe('2,3×')
  })
})
