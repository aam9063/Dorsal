import type { Activity } from '../model'

/** Distance of one calendar month of 2026. */
export interface MonthDistance {
  /** `1` (January) to `12` (December). */
  month: number
  /** Sum of distance in metres; activities with `null` distance count as `0`. */
  distanceM: number
}

/** Full profile of story 03 "El perfil de tu año". */
export interface MonthlyProfile {
  /** Always twelve entries, January to December, `0` where nothing happened. */
  months: MonthDistance[]
  /** Month with the greatest distance; ties keep the earliest month. */
  peak: MonthDistance
  /**
   * Month with the smallest distance among months that have activity;
   * an empty month never wins. Ties keep the earliest month.
   */
  valley: MonthDistance
  /**
   * Greatest distance of the months strictly after the valley, divided by the
   * valley distance; `null` when the valley is `0` or no later month with
   * activity exists.
   */
  comeback: number | null
}

/**
 * Monthly distance profile for story 03, in metres. Returns `null` when fewer
 * than three months contain at least one activity.
 */
export function monthlyProfile(activities: readonly Activity[]): MonthlyProfile | null {
  const distanceByMonth = new Array<number>(12).fill(0)
  const monthsWithActivity = new Set<number>()

  for (const activity of activities) {
    monthsWithActivity.add(activity.startLocal.month)
    const monthIndex = activity.startLocal.month - 1
    distanceByMonth[monthIndex] = (distanceByMonth[monthIndex] ?? 0) + (activity.distanceM ?? 0)
  }

  if (monthsWithActivity.size < 3) {
    return null
  }

  const months: MonthDistance[] = distanceByMonth.map((distanceM, index) => ({
    month: index + 1,
    distanceM,
  }))

  let peak: MonthDistance = months[0] ?? { month: 1, distanceM: 0 }
  for (const month of months) {
    if (month.distanceM > peak.distanceM) {
      peak = month
    }
  }

  let valley: MonthDistance | null = null
  for (const month of months) {
    if (!monthsWithActivity.has(month.month)) {
      continue
    }
    if (valley === null || month.distanceM < valley.distanceM) {
      valley = month
    }
  }
  if (valley === null) {
    return null
  }

  const valleyDistance = valley.distanceM
  let comeback: number | null = null
  if (valleyDistance > 0) {
    let bestAfterValley: number | null = null
    for (const month of months) {
      if (month.month > valley.month && monthsWithActivity.has(month.month)) {
        if (bestAfterValley === null || month.distanceM > bestAfterValley) {
          bestAfterValley = month.distanceM
        }
      }
    }
    if (bestAfterValley !== null) {
      comeback = bestAfterValley / valleyDistance
    }
  }

  return { months, peak, valley, comeback }
}
