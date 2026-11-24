import type { Activity } from '../model'
import { dayOrdinal, type PlainDateTime } from '../time'
import { weeklyLoad } from './weekly-load'

/** The longest session of the season, by distance. */
export interface LongestSessionMark {
  /** Distance in metres. */
  distanceM: number
  /** Day of the session, as calendar integers and never a string. */
  month: number
  day: number
}

/** The single day of 2026 with the most elevation gain summed over activities. */
export interface BiggestElevationDayMark {
  /** Elevation gain in metres. */
  elevationGainM: number
  /** Day of the gain, as calendar integers and never a string. */
  month: number
  day: number
}

/** The week with the most distance, dated by its Monday (S8). */
export interface BestWeekMark {
  distanceM: number
  isoWeek: number
  monday: { month: number; day: number }
}

/** The three "mejores marcas" of the season cards (S8). */
export interface SeasonBests {
  longestSessionByDistance: LongestSessionMark | null
  biggestElevationDay: BiggestElevationDayMark | null
  bestWeek: BestWeekMark | null
}

function ordinalOf(month: number, day: number): number {
  const value: PlainDateTime = { year: 2026, month, day, hour: 12, minute: 0, second: 0 }
  return dayOrdinal(value)
}

/**
 * The best marks Dorsal computes itself (S3/S8): the longest session by
 * distance, the biggest single-day elevation gain (summed per calendar day),
 * and the best week of `weeklyLoad`, each with its date as `{month, day}`.
 * A mark is `null` when nothing in the season could prove it: no distance at
 * all, no elevation at all, or no activity. Mark ties keep the earlier date,
 * so the result is deterministic.
 */
export function seasonBests(activities: readonly Activity[]): SeasonBests | null {
  if (activities.length === 0) {
    return null
  }

  let longestSessionByDistance: LongestSessionMark | null = null
  for (const activity of activities) {
    const distanceM = activity.distanceM
    if (distanceM === null) {
      continue
    }
    const month = activity.startLocal.month
    const day = activity.startLocal.day
    if (
      longestSessionByDistance === null ||
      distanceM > longestSessionByDistance.distanceM ||
      (distanceM === longestSessionByDistance.distanceM &&
        ordinalOf(month, day) <
          ordinalOf(longestSessionByDistance.month, longestSessionByDistance.day))
    ) {
      longestSessionByDistance = { distanceM, month, day }
    }
  }

  const elevationByOrdinal = new Map<
    number,
    { elevationGainM: number; month: number; day: number }
  >()
  for (const activity of activities) {
    if (activity.elevationGainM === null) {
      continue
    }
    const key = dayOrdinal(activity.startLocal)
    const current = elevationByOrdinal.get(key) ?? {
      elevationGainM: 0,
      month: activity.startLocal.month,
      day: activity.startLocal.day,
    }
    current.elevationGainM += activity.elevationGainM
    elevationByOrdinal.set(key, current)
  }
  let biggestElevationDay: BiggestElevationDayMark | null = null
  for (const value of elevationByOrdinal.values()) {
    if (
      biggestElevationDay === null ||
      value.elevationGainM > biggestElevationDay.elevationGainM ||
      (value.elevationGainM === biggestElevationDay.elevationGainM &&
        ordinalOf(value.month, value.day) <
          ordinalOf(biggestElevationDay.month, biggestElevationDay.day))
    ) {
      biggestElevationDay = value
    }
  }

  const load = weeklyLoad(activities)
  const best = load?.best
  const bestWeek: BestWeekMark | null =
    best === null || best === undefined
      ? null
      : {
          distanceM: best.distanceM,
          isoWeek: best.isoWeek,
          monday: best.monday,
        }

  return { longestSessionByDistance, biggestElevationDay, bestWeek }
}
