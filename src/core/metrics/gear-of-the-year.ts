import type { Activity, SportKind } from '../model'

/** One assigned gear group of story 06, as the user wrote its name. */
export interface GearItem {
  name: string
  /** Sum of distance in metres of the activities with this gear. */
  distanceM: number
  /** Sum of moving time in seconds of the activities with this gear. */
  movingTimeS: number
  /** Number of activities of 2026 with this gear. */
  activityCount: number
  /**
   * True when the group covers mostly `run` activities (strict majority of its
   * activity count) and its 2026 distance is above `800_000` m: the shoes have
   * covered more than 800 km this season, so they should be retired.
   */
  needsRetiring: boolean
}

/** Full result of story 06 "Tu material". */
export interface GearOfTheYear {
  /** Assigned groups sorted by moving time descending. */
  items: GearItem[]
  /** Name of the item with the most moving time; `null` when there is no item. */
  star: string | null
  /** True when the sport with the most moving time is `ride`. */
  showsBikes: boolean
}

/**
 * Gear of the year for story 06. Activities without gear (or with a blank
 * name) go to the "unassigned" group, which is never returned. Returns `null`
 * when the share of moving time with assigned gear is below `0.30` of the
 * season total.
 */
export function gearOfTheYear(activities: readonly Activity[]): GearOfTheYear | null {
  let totalMovingTimeS = 0
  let assignedMovingTimeS = 0
  const groupsByGear = new Map<
    string,
    {
      name: string
      distanceM: number
      movingTimeS: number
      activityCount: number
      runCount: number
    }
  >()
  const timeBySport = new Map<SportKind, number>()

  for (const activity of activities) {
    totalMovingTimeS += activity.movingTimeS
    timeBySport.set(activity.sport, (timeBySport.get(activity.sport) ?? 0) + activity.movingTimeS)
    const gear = activity.gear
    if (gear === null || gear.trim() === '') {
      continue
    }
    assignedMovingTimeS += activity.movingTimeS
    const group = groupsByGear.get(gear) ?? {
      name: gear,
      distanceM: 0,
      movingTimeS: 0,
      activityCount: 0,
      runCount: 0,
    }
    group.distanceM += activity.distanceM ?? 0
    group.movingTimeS += activity.movingTimeS
    group.activityCount += 1
    if (activity.sport === 'run') {
      group.runCount += 1
    }
    groupsByGear.set(gear, group)
  }

  if (totalMovingTimeS === 0 || assignedMovingTimeS * 10 < totalMovingTimeS * 3) {
    return null
  }

  const items = [...groupsByGear.values()]
    .map(({ runCount, ...group }) => ({
      ...group,
      needsRetiring: runCount * 2 > group.activityCount && group.distanceM > 800_000,
    }))
    .sort((first, second) => second.movingTimeS - first.movingTimeS)

  let dominantSport: SportKind | null = null
  let dominantTime = 0
  for (const [sport, sportMovingTimeS] of timeBySport) {
    if (sportMovingTimeS > dominantTime) {
      dominantTime = sportMovingTimeS
      dominantSport = sport
    }
  }

  return {
    items,
    star: items[0]?.name ?? null,
    showsBikes: dominantSport === 'ride',
  }
}
