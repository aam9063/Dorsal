import type { Activity } from '../model'

/** Race-bib data of story 08 "Tu dorsal". */
export interface BibCard {
  /** Total kilometres rounded to the nearest integer. */
  number: number
  /** Total kilometres as an exact ratio of the metres sum. */
  distanceKm: number
  /** Twelve monthly distance values in metres, January to December. */
  monthlyDistanceM: number[]
}

/**
 * Race-bib numbers for story 08: `number = round(distanceM / 1000)` and the
 * twelve-entry monthly distance series (in metres) used by the mini profile.
 */
export function bibCard(activities: readonly Activity[]): BibCard {
  let distanceM = 0
  const monthlyDistanceM = new Array<number>(12).fill(0)

  for (const activity of activities) {
    const metres = activity.distanceM ?? 0
    distanceM += metres
    monthlyDistanceM[activity.startLocal.month - 1] =
      (monthlyDistanceM[activity.startLocal.month - 1] ?? 0) + metres
  }

  return {
    number: Math.round(distanceM / 1000),
    distanceKm: distanceM / 1000,
    monthlyDistanceM,
  }
}
