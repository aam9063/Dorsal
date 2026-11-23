import type { Activity } from '../model'
import type { Weekday } from '../time'
import { dayOrdinal, weekdayOf } from '../time'

/** Numbered day of the daily heatmap; `level` is the story 04 intensity 1..4. */
export interface HeatmapDay {
  /** `1` (January) to `12` (December). */
  month: number
  /** Day of month, `1` to `31`. */
  day: number
  /** Total moving time of the day in seconds. */
  movingTimeS: number
  /** Nearest-rank quartile level of the day's moving time: `1` lowest, `4` highest. */
  level: 1 | 2 | 3 | 4
}

/** One end of the longest streak, identified by calendar day. */
export interface StreakSpan {
  /** `1` (January) to `12` (December). */
  month: number
  /** Day of month, `1` to `31`. */
  day: number
}

/** Longest run of consecutive local days with activity. */
export interface LongestStreak {
  /** Number of consecutive active days. */
  days: number
  /** First day of the streak; `null` when there is no activity at all. */
  from: StreakSpan | null
  /** Last day of the streak; `null` when there is no activity at all. */
  to: StreakSpan | null
}

/** Weekday of story 04, present in the most distinct Monday-based weeks. */
export interface FavoriteWeekday {
  /** `0` is Sunday and `6` is Saturday, as in `src/core/time/`. */
  weekday: Weekday
  /** Number of distinct Monday-based weeks containing that weekday. */
  weeks: number
}

/** Every metric of story 04 "Constancia". */
export interface Consistency {
  /** One entry per active day, ordered by day ascending. */
  heatmap: HeatmapDay[]
  longestStreak: LongestStreak
  /**
   * Weekday present in the most distinct Monday-based weeks; ties break by
   * greater total moving time on that weekday, then by lower weekday index.
   */
  favoriteWeekday: FavoriteWeekday
}

interface DayAggregate {
  ordinal: number
  month: number
  day: number
  movingTimeS: number
}

/** Nearest-rank percentile of a non-empty ascending list. */
function nearestRankQuantile(sorted: readonly number[], fraction: number): number {
  const rank = Math.ceil(fraction * sorted.length)
  const index = Math.min(Math.max(rank, 1), sorted.length) - 1
  const value = sorted[index]
  return value ?? 0
}

function levelOf(movingTimeS: number, q1: number, q2: number, q3: number): 1 | 2 | 3 | 4 {
  if (movingTimeS <= q1) {
    return 1
  }
  if (movingTimeS <= q2) {
    return 2
  }
  if (movingTimeS <= q3) {
    return 3
  }
  return 4
}

/**
 * Daily intensity, longest streak and favorite weekday for story 04. Heatmap
 * levels are nearest-rank quartiles of the active days' total moving time;
 * the streak is the longest run of consecutive `dayOrdinal` values, ties keep
 * the earliest. Returns `null` only for an empty season (the worker guarantees
 * at least one activity before stories run).
 */
export function consistency(activities: readonly Activity[]): Consistency | null {
  if (activities.length === 0) {
    return null
  }

  const daysByOrdinal = new Map<number, DayAggregate>()
  const weekdayData = new Map<Weekday, { mondayOrdinals: Set<number>; movingTimeS: number }>()

  for (const activity of activities) {
    const { month, day } = activity.startLocal
    const ordinal = dayOrdinal(activity.startLocal)
    const existing = daysByOrdinal.get(ordinal)
    if (existing === undefined) {
      daysByOrdinal.set(ordinal, { ordinal, month, day, movingTimeS: activity.movingTimeS })
    } else {
      existing.movingTimeS += activity.movingTimeS
    }
    const weekday = weekdayOf(activity.startLocal)
    const weekdayEntry = weekdayData.get(weekday) ?? {
      mondayOrdinals: new Set<number>(),
      movingTimeS: 0,
    }
    weekdayEntry.mondayOrdinals.add(ordinal - ((weekday + 6) % 7))
    weekdayEntry.movingTimeS += activity.movingTimeS
    weekdayData.set(weekday, weekdayEntry)
  }

  const days = [...daysByOrdinal.values()].sort((first, second) => first.ordinal - second.ordinal)
  const sortedDayTimes = days.map((day) => day.movingTimeS).sort((first, second) => first - second)
  const q1 = nearestRankQuantile(sortedDayTimes, 0.25)
  const q2 = nearestRankQuantile(sortedDayTimes, 0.5)
  const q3 = nearestRankQuantile(sortedDayTimes, 0.75)
  const heatmap = days.map((day) => ({
    month: day.month,
    day: day.day,
    movingTimeS: day.movingTimeS,
    level: levelOf(day.movingTimeS, q1, q2, q3),
  }))

  let bestDays = 0
  let bestStartOrdinal: number | null = null
  let bestEndOrdinal: number | null = null
  let runStartOrdinal: number | null = null
  let runLength = 0
  let previousOrdinal: number | null = null
  for (const day of days) {
    if (previousOrdinal !== null && day.ordinal === previousOrdinal + 1) {
      runLength += 1
    } else {
      runStartOrdinal = day.ordinal
      runLength = 1
    }
    previousOrdinal = day.ordinal
    if (runLength > bestDays) {
      bestDays = runLength
      bestStartOrdinal = runStartOrdinal
      bestEndOrdinal = day.ordinal
    }
  }

  const calendarDayByOrdinal = new Map<number, { month: number; day: number }>()
  for (const day of days) {
    calendarDayByOrdinal.set(day.ordinal, { month: day.month, day: day.day })
  }
  const longestStreak: LongestStreak = {
    days: bestDays,
    from: bestStartOrdinal === null ? null : (calendarDayByOrdinal.get(bestStartOrdinal) ?? null),
    to: bestEndOrdinal === null ? null : (calendarDayByOrdinal.get(bestEndOrdinal) ?? null),
  }

  let favoriteWeekday: FavoriteWeekday | null = null
  for (let weekday = 0 as Weekday; weekday <= 6; weekday = (weekday + 1) as Weekday) {
    const entry = weekdayData.get(weekday)
    if (entry === undefined || entry.mondayOrdinals.size === 0) {
      continue
    }
    if (favoriteWeekday === null) {
      favoriteWeekday = { weekday, weeks: entry.mondayOrdinals.size }
      continue
    }
    const current = weekdayData.get(favoriteWeekday.weekday)
    if (
      current === undefined ||
      entry.mondayOrdinals.size > favoriteWeekday.weeks ||
      (entry.mondayOrdinals.size === favoriteWeekday.weeks &&
        current !== undefined &&
        entry.movingTimeS > current.movingTimeS)
    ) {
      favoriteWeekday = { weekday, weeks: entry.mondayOrdinals.size }
    }
  }
  if (favoriteWeekday === null) {
    return null
  }

  return { heatmap, longestStreak, favoriteWeekday }
}
