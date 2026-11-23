import type { Activity, SportKind } from '../model'
import { dayOrdinal } from '../time'

/** One row of the sport split of story 02, in decreasing moving time. */
export interface TotalsBySport {
  sport: SportKind
  /** Total moving time of the sport in seconds. */
  movingTimeS: number
  /** `movingTimeS / totalMovingTimeS`; `0` when the season total is `0`. */
  share: number
}

/** Aggregates of story 02 "Los números" over the kept 2026 activities. */
export interface Totals {
  /** Sum of distance in metres; activities with `null` distance count as `0`. */
  distanceM: number
  /** Sum of moving time in seconds. */
  movingTimeS: number
  /** Number of kept 2026 activities. */
  activityCount: number
  /** Number of distinct local days with at least one activity. */
  activeDays: number
  /** Sum of elevation gain in metres; `null` counts as `0`. */
  elevationGainM: number
  /** One row per sport present, sorted by moving time descending. */
  bySport: TotalsBySport[]
  /** 400 m track laps: `distanceM / 400`. */
  trackLaps: number
  /** Everest equivalents: `elevationGainM / 8849`. */
  everests: number
}

/**
 * Totals for story 02, in metres and seconds. `activeDays` counts distinct
 * `dayOrdinal(startLocal)` values; `trackLaps = distanceM / 400` and
 * `everests = elevationGainM / 8849`; sport shares sum to `1` (or are all `0`).
 */
export function totals(activities: readonly Activity[]): Totals {
  let distanceM = 0
  let movingTimeS = 0
  let elevationGainM = 0
  const dayOrdinals = new Set<number>()
  const timeBySport = new Map<SportKind, number>()

  for (const activity of activities) {
    distanceM += activity.distanceM ?? 0
    movingTimeS += activity.movingTimeS
    elevationGainM += activity.elevationGainM ?? 0
    dayOrdinals.add(dayOrdinal(activity.startLocal))
    timeBySport.set(activity.sport, (timeBySport.get(activity.sport) ?? 0) + activity.movingTimeS)
  }

  const bySport = [...timeBySport]
    .map(([sport, sportMovingTimeS]) => ({
      sport,
      movingTimeS: sportMovingTimeS,
      share: movingTimeS === 0 ? 0 : sportMovingTimeS / movingTimeS,
    }))
    .sort((first, second) => second.movingTimeS - first.movingTimeS)

  return {
    distanceM,
    movingTimeS,
    activityCount: activities.length,
    activeDays: dayOrdinals.size,
    elevationGainM,
    bySport,
    trackLaps: distanceM / 400,
    everests: elevationGainM / 8849,
  }
}
