/** Geometry of the Everest equivalence mark, in the SVG units of the W2 artboard. */
export const EVEREST_WIDTH = 26
export const EVEREST_HEIGHT = 22
export const EVEREST_APEX_X = 13

export interface EverestFill {
  /** Top-left corner of the filled band, on the left slope of the triangle. */
  leftX: number
  /** Top-right corner of the filled band, on the right slope of the triangle. */
  rightX: number
  /** Height that separates the filled band from the apex. */
  topY: number
}

/**
 * The lower `fraction` share of the one full triangle, as a band between its
 * two slopes and its base. A fraction then reads as part of the same mountain
 * instead of a second, smaller one.
 */
export function everestFill(fraction: number): EverestFill {
  const share = Math.min(Math.max(fraction, 0), 1)
  return {
    leftX: EVEREST_APEX_X * share,
    rightX: EVEREST_WIDTH - EVEREST_APEX_X * share,
    topY: EVEREST_HEIGHT * (1 - share),
  }
}
