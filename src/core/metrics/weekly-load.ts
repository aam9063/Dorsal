import type { Activity } from '../model'
import { calendarDateOf, dayOrdinal, isoWeekOf, isoWeekdayOf, type IsoWeek } from '../time'

/**
 * A week counts as fulfilled when it holds at least this many activities
 * (S8 of `odd/tasks/h11b-season-cards.md`). One exported constant, so the
 * card can print the rule ("3 o más entrenos") next to the number.
 */
export const MIN_SESSIONS_PER_WEEK = 3

/** One ISO week of 2026 with activity. */
export interface WeeklyEntry {
  isoYear: number
  /** `1` to `53`, ISO-8601. */
  isoWeek: number
  /** Monday of the week, as `{month, day}`. */
  monday: { month: number; day: number }
  /** Activities of the week. */
  activityCount: number
  /** Sum of distance in metres across all sports; `null` distance counts as `0`. */
  distanceM: number
}

/** Weekly aggregates of the season cards over the kept 2026 activities. */
export interface WeeklyLoad {
  /** Weeks with at least one activity, ordered by `(isoYear, isoWeek)` ascending. */
  weeks: WeeklyEntry[]
  /**
   * The week with the highest `distanceM` across all sports; ties go to the
   * earlier `(isoYear, isoWeek)`. Non-null inside a non-empty season.
   */
  best: WeeklyEntry | null
  /**
   * Longest run of adjacent `isoWeek` buckets, within the same ISO year, that
   * each hold at least {@link MIN_SESSIONS_PER_WEEK} activities. `0` when no
   * week is fulfilled.
   */
  longestFulfilledStreak: number
}

function weekKeyOf({ isoYear, isoWeek }: IsoWeek): number {
  return isoYear * 100 + isoWeek
}

function entryFrom(
  events: { isoWeek: IsoWeek; activity: Activity }[],
  isoWeek: IsoWeek,
): Omit<WeeklyEntry, 'isoYear' | 'isoWeek'> {
  let mondayOrdinal = 0
  let activityCount = 0
  let distanceM = 0
  for (const event of events) {
    if (event.isoWeek.isoYear !== isoWeek.isoYear || event.isoWeek.isoWeek !== isoWeek.isoWeek) {
      continue
    }
    activityCount += 1
    distanceM += event.activity.distanceM ?? 0
    mondayOrdinal = Math.max(
      mondayOrdinal,
      dayOrdinal(event.activity.startLocal) - isoWeekdayOf(event.activity.startLocal) + 1,
    )
  }
  const monday = calendarDateOf(mondayOrdinal)
  return { monday: { month: monday.month, day: monday.day }, activityCount, distanceM }
}

/**
 * ISO-8601 weekly load for the season cards (S8): only weeks with at least one
 * activity are stored, the best week is the one with the most distance across
 * all sports (ties to the earlier week), and fulfilled weeks are the ones with
 * at least {@link MIN_SESSIONS_PER_WEEK} activities. Returns `null` for an
 * empty season.
 */
export function weeklyLoad(activities: readonly Activity[]): WeeklyLoad | null {
  if (activities.length === 0) {
    return null
  }

  const events = activities.map((activity) => ({
    isoWeek: isoWeekOf(activity.startLocal),
    activity,
  }))
  const byWeek = new Map<
    number,
    { isoWeek: IsoWeek; entry: Omit<WeeklyEntry, 'isoYear' | 'isoWeek'> }
  >()
  for (const event of events) {
    const key = weekKeyOf(event.isoWeek)
    const current = byWeek.get(key)
    if (current === undefined) {
      byWeek.set(key, { isoWeek: event.isoWeek, entry: entryFrom(events, event.isoWeek) })
    }
  }

  const weeks: WeeklyEntry[] = [...byWeek.values()]
    .sort((first, second) => weekKeyOf(first.isoWeek) - weekKeyOf(second.isoWeek))
    .map(({ isoWeek, entry }) => ({
      isoYear: isoWeek.isoYear,
      isoWeek: isoWeek.isoWeek,
      ...entry,
    }))

  let best = weeks[0] ?? null
  for (const week of weeks) {
    if (week.distanceM > (best?.distanceM ?? 0)) {
      best = week
    }
  }

  let longestFulfilledStreak = 0
  let currentStreak = 0
  let previousKey: number | null = null
  for (const week of weeks) {
    const key = weekKeyOf(week)
    const fulfilled = week.activityCount >= MIN_SESSIONS_PER_WEEK
    const adjacent = previousKey !== null && key === previousKey + 1
    currentStreak = fulfilled ? (adjacent ? currentStreak + 1 : 1) : 0
    longestFulfilledStreak = Math.max(longestFulfilledStreak, currentStreak)
    previousKey = key
  }

  return { weeks, best, longestFulfilledStreak }
}
