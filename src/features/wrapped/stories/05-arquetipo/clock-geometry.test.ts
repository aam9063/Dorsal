import { describe, expect, it } from 'vitest'
import {
  CLOCK_CENTER,
  CLOCK_SIZE,
  HOUR_LABELS,
  SPOKE_REACH,
  activeSpokes,
  spokeLength,
} from './clock-geometry'

describe('arquetipo clock geometry', () => {
  it('draws one spoke per hour with starts and none for the hours with zero', () => {
    const startHours = [0, 2, 0, 5, 0, 1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0]

    const spokes = activeSpokes(startHours)

    expect(spokes.map((spoke) => spoke.hour)).toEqual([1, 3, 5, 6, 16])
  })

  it('scales the busiest hour to the full spoke length', () => {
    const startHours = [0, 1, 0, 4]

    expect(spokeLength(4, Math.max(...startHours))).toBeGreaterThan(
      spokeLength(1, Math.max(...startHours)),
    )
    expect(spokeLength(Math.max(...startHours), Math.max(...startHours))).toBeGreaterThan(
      // A tick merged into the spokes is worth no length at all.
      0,
    )
  })

  it('keeps a zero-activity hour from drawing anything at all', () => {
    expect(spokeLength(0, 5)).toBeLessThanOrEqual(0)
  })

  it('keeps every hour label clear of the tip of a full-length spoke', () => {
    for (const label of HOUR_LABELS) {
      // The 11 px label hangs on its baseline: its centre is four units above it.
      const distance = Math.hypot(label.x - CLOCK_CENTER, label.y - 4 - CLOCK_CENTER)
      expect(distance).toBeGreaterThanOrEqual(SPOKE_REACH + 8)
    }
  })

  it('keeps every hour label inside the viewBox with room for its 11 px glyphs', () => {
    for (const label of HOUR_LABELS) {
      const top = label.y - 11
      const bottom = label.y + 3
      const start = label.anchor === 'end' ? label.x - 20 : label.x
      const end = label.anchor === 'start' ? label.x + 20 : label.x
      expect(top).toBeGreaterThanOrEqual(0)
      expect(bottom).toBeLessThanOrEqual(CLOCK_SIZE)
      expect(start).toBeGreaterThanOrEqual(0)
      expect(end).toBeLessThanOrEqual(CLOCK_SIZE)
    }
  })

  it('places the four cardinal hours upright at midnight, morning, noon and evening', () => {
    expect(HOUR_LABELS.map((label) => label.hour)).toEqual([0, 6, 12, 18])
    expect(HOUR_LABELS[0]?.anchor).toBe('middle')
    expect(HOUR_LABELS[3]?.anchor).toBe('start')
  })
})
