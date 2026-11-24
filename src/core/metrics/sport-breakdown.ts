import type { Activity, SportKind } from '../model'

/** One row of the sport split panel of the season cards. */
export interface SportSeasonEntry {
  sport: SportKind
  /** Activities of the sport in 2026. */
  activityCount: number
  /** Sum of distance in metres; activities with `null` distance count as `0`. */
  distanceM: number
  /** Sum of moving time in seconds. */
  movingTimeS: number
  /** Sum of elevation gain in metres; `null` counts as `0`. */
  elevationGainM: number
  /** `movingTimeS / totals.movingTimeS`; `0` when the season total is `0`. */
  share: number
}

/**
 * Sport split of the season cards, over the kept 2026 activities: one entry
 * per sport present, ordered by `movingTimeS` descending (ties keep the order
 * in which the sports first appear in the season). The most practiced sport
 * of `odd/tasks/h11b-season-cards.md` S8 is the first entry: the sport with
 * the highest moving time, because walking and riding do not compare by km.
 */
export function sportBreakdown(activities: readonly Activity[]): SportSeasonEntry[] {
  const bySport = new Map<SportKind, Omit<SportSeasonEntry, 'sport' | 'share'>>()

  let totalMovingTimeS = 0
  for (const activity of activities) {
    totalMovingTimeS += activity.movingTimeS
    const entry = bySport.get(activity.sport) ?? {
      activityCount: 0,
      distanceM: 0,
      movingTimeS: 0,
      elevationGainM: 0,
    }
    entry.activityCount += 1
    entry.distanceM += activity.distanceM ?? 0
    entry.movingTimeS += activity.movingTimeS
    entry.elevationGainM += activity.elevationGainM ?? 0
    bySport.set(activity.sport, entry)
  }

  return [...bySport]
    .map(([sport, entry]): SportSeasonEntry => ({
      sport,
      ...entry,
      share: totalMovingTimeS === 0 ? 0 : entry.movingTimeS / totalMovingTimeS,
    }))
    .sort((first, second) => second.movingTimeS - first.movingTimeS)
}
