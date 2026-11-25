import { describe, expect, it } from 'vitest'
import { EVEREST_APEX_X, EVEREST_HEIGHT, EVEREST_WIDTH, everestFill } from './everest-geometry'

/** A corner sits on the left slope of the triangle when it satisfies its line. */
function onLeftSlope(x: number, y: number): boolean {
  return Math.abs(x - (EVEREST_APEX_X * (EVEREST_HEIGHT - y)) / EVEREST_HEIGHT) < 0.01
}

/** A corner sits on the right slope of the triangle when it satisfies its line. */
function onRightSlope(x: number, y: number): boolean {
  return Math.abs(x - EVEREST_APEX_X - (EVEREST_APEX_X * y) / EVEREST_HEIGHT) < 0.01
}

describe('everest mark geometry', () => {
  it('fills the lower share of a full-size triangle, so the fraction reads as part of one mountain', () => {
    const fill = everestFill(0.4)

    expect(fill.topY).toBeCloseTo(EVEREST_HEIGHT * 0.6)
    expect(onLeftSlope(fill.leftX, fill.topY)).toBe(true)
    expect(onRightSlope(fill.rightX, fill.topY)).toBe(true)
    expect(fill.leftX).toBeGreaterThan(0)
    expect(fill.rightX).toBeLessThan(EVEREST_WIDTH)
  })

  it('keeps the partial mark the same size as the whole mark', () => {
    const whole = everestFill(1)
    const part = everestFill(0.4)

    expect(whole.leftX).toBeCloseTo(EVEREST_APEX_X)
    expect(whole.rightX).toBeCloseTo(EVEREST_APEX_X)
    expect(whole.topY).toBeCloseTo(0)
    expect(part.topY).toBeGreaterThan(0)
  })

  it('collapses to the base for a fraction of zero', () => {
    const fill = everestFill(0)

    expect(fill.topY).toBeCloseTo(EVEREST_HEIGHT)
    expect(fill.leftX).toBeCloseTo(0)
    expect(fill.rightX).toBeCloseTo(EVEREST_WIDTH)
  })

  it('clamps a fraction outside the range to the nearest share', () => {
    expect(everestFill(1.4).topY).toBeCloseTo(0)
    expect(everestFill(-0.2).topY).toBeCloseTo(EVEREST_HEIGHT)
  })
})
