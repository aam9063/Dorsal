/**
 * Clock geometry of story 05, in the viewBox coordinates of the W5 artboard.
 * The hour labels keep a room of their own from the tip of a full-length
 * spoke, instead of colliding with it.
 */
export const CLOCK_SIZE = 320
export const CLOCK_CENTER = 160
/** Distance from the centre to the base of a spoke. */
export const SPOKE_BASE_REACH = 54
export const SPOKE_MIN_LENGTH = 3
export const SPOKE_MAX_LENGTH = 76
/** Distance from the centre to the tip of a full-length spoke. */
export const SPOKE_REACH = SPOKE_BASE_REACH + SPOKE_MIN_LENGTH + SPOKE_MAX_LENGTH
/** Room between the tip of a full-length spoke and the hour labels. */
export const LABEL_GAP = 12
export const LABEL_REACH = SPOKE_REACH + LABEL_GAP
/** Radius of the filled centre disc of the W5 artboard. */
export const CENTER_RADIUS = 44

export interface ClockSpoke {
  hour: number
  length: number
}

export interface HourLabel {
  hour: 0 | 6 | 12 | 18
  x: number
  /** The baseline of the 11 px label. */
  y: number
  anchor: 'start' | 'middle' | 'end'
}

/** Spoke length for a count of starts, from `SPOKE_MIN_LENGTH` to `SPOKE_MAX_LENGTH`. */
export function spokeLength(count: number, maxCount: number): number {
  if (maxCount <= 0 || count <= 0) {
    return 0
  }
  return SPOKE_MIN_LENGTH + (count / maxCount) * SPOKE_MAX_LENGTH
}

/**
 * One spoke per hour with activity; hours with zero starts draw nothing, so
 * no faint tick merges into a dashed ring around the real rays.
 */
export function activeSpokes(startHours: readonly number[]): ClockSpoke[] {
  const maxCount = Math.max(...startHours)
  return startHours.flatMap((count, hour) =>
    count > 0 ? [{ hour, length: spokeLength(count, maxCount) }] : [],
  )
}

/** The four cardinal hour labels, upright and clear of the spoke tips. */
export const HOUR_LABELS: readonly HourLabel[] = [
  { hour: 0, x: CLOCK_CENTER, y: CLOCK_CENTER - LABEL_REACH, anchor: 'middle' },
  { hour: 6, x: CLOCK_CENTER + LABEL_REACH, y: CLOCK_CENTER + 4, anchor: 'end' },
  { hour: 12, x: CLOCK_CENTER, y: CLOCK_CENTER + LABEL_REACH + 7, anchor: 'middle' },
  { hour: 18, x: CLOCK_CENTER - LABEL_REACH, y: CLOCK_CENTER + 4, anchor: 'start' },
]
