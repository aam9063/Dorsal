import type { Activity } from '../model'

/**
 * One month of the power panel. `bestWeightedAvgPowerW` (column 46) is the
 * primary intensity value; `bestMaxPowerW` and the average power are extras,
 * and every best is `null` for a month where no activity proves that field.
 */
export interface PowerWindow {
  /** `1` (January) to `12` (December). */
  month: number
  bestWeightedAvgPowerW: number | null
  bestMaxPowerW: number | null
  /** Activities of the month, with or without power. */
  activityCount: number
  /** Activities of the month carrying any of the three power columns. */
  sessionsWithPower: number
  /** `sessionsWithPower / activityCount`; `0` when the month had no activity. */
  coverage: number
}

/** Year totals of the power panel, the same fields as a month. */
export interface PowerYearTotal {
  bestWeightedAvgPowerW: number | null
  bestMaxPowerW: number | null
  activityCount: number
  sessionsWithPower: number
  coverage: number
}

/** Power evolution of the season cards (S8). */
export interface PowerProfile {
  /** Months with at least one activity, ordered by month ascending. */
  months: PowerWindow[]
  totals: PowerYearTotal
}

function carryingPower(activity: Activity): boolean {
  return (
    activity.avgPowerW !== null ||
    activity.maxPowerW !== null ||
    activity.weightedAvgPowerW !== null
  )
}

function bestOf(values: (number | null)[]): number | null {
  let best: number | null = null
  for (const value of values) {
    if (value !== null && (best === null || value > best)) {
      best = value
    }
  }
  return best
}

/**
 * Power profile for the season cards (S8), conditional on the export carrying
 * watts: months with activity get the best weighted average, the best max
 * power, `sessionsWithPower` (any of the three columns) and the coverage, and
 * the year totals carry the same fields. Returns `null` when no 2026 activity
 * carries any watt, so the panel can disappear (S4).
 */
export function powerProfile(activities: readonly Activity[]): PowerProfile | null {
  if (activities.length === 0) {
    return null
  }

  const monthWindows = new Map<number, Activity[]>()
  for (const activity of activities) {
    const list = monthWindows.get(activity.startLocal.month) ?? []
    list.push(activity)
    monthWindows.set(activity.startLocal.month, list)
  }

  const months: PowerWindow[] = [...monthWindows.keys()]
    .sort((first, second) => first - second)
    .map((month) => {
      const list = monthWindows.get(month) ?? []
      return {
        month,
        bestWeightedAvgPowerW: bestOf(list.map((activity) => activity.weightedAvgPowerW)),
        bestMaxPowerW: bestOf(list.map((activity) => activity.maxPowerW)),
        activityCount: list.length,
        sessionsWithPower: list.filter(carryingPower).length,
        coverage: list.length === 0 ? 0 : list.filter(carryingPower).length / list.length,
      }
    })

  const sessionsWithPower = activities.filter(carryingPower).length
  const totals: PowerYearTotal = {
    bestWeightedAvgPowerW: bestOf(activities.map((activity) => activity.weightedAvgPowerW)),
    bestMaxPowerW: bestOf(activities.map((activity) => activity.maxPowerW)),
    activityCount: activities.length,
    sessionsWithPower,
    coverage: activities.length === 0 ? 0 : sessionsWithPower / activities.length,
  }

  if (sessionsWithPower === 0) {
    return null
  }

  return { months, totals }
}
