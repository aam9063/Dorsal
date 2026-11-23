import type { Activity, SportKind } from '../model'
import { dayOrdinal, weekdayOf } from '../time'

/** Identifiers of the seven deterministic archetypes of story 05. */
export type ArchetypeId =
  | 'earlyBird'
  | 'nightOwl'
  | 'weekendWarrior'
  | 'methodical'
  | 'multisport'
  | 'longDistance'
  | 'steady'

/** Result of story 05 "Tu arquetipo", plus the 24-bucket start-hour histogram. */
export interface Archetype {
  /** First matching rule of the ordered list. */
  primary: ArchetypeId
  /** Next matching rule after the primary, or `steady` when nothing else matches. */
  secondary: ArchetypeId
  /** Number of activities per local start hour, index `0`..`23`. */
  startHours: number[]
}

/**
 * Archetype of story 05. Rules are evaluated in this exact order and every
 * match is recorded: the first match is `primary` and the next one is
 * `secondary` (`steady` always matches as the fallback). Shares use integer
 * comparisons so the thresholds are exact: `>= 0.50`, `>= 0.40`,
 * `>= 0.60`, `>= 0.70` of weeks with at least four active days, three sports
 * with `>= 0.10` each, and median moving time `>= 4500` s (75 min).
 * Returns `null` with fewer than ten activities.
 */
/**
 * Both boundaries are exclusive, matching BRIEF §6.1 wording: a start *before*
 * 08:00 is not 08:00, and a start *after* 20:00 is not 20:00. Seconds are
 * compared, not just the hour, so 20:30 counts as after 20:00.
 */
const EARLY_BIRD_BEFORE_S = 8 * 3600
const NIGHT_OWL_AFTER_S = 20 * 3600

function secondsSinceMidnight(value: Activity['startLocal']): number {
  return value.hour * 3600 + value.minute * 60 + value.second
}

export function archetype(activities: readonly Activity[]): Archetype | null {
  if (activities.length < 10) {
    return null
  }

  const startHours = new Array<number>(24).fill(0)
  let earlyStarts = 0
  let nightStarts = 0
  let movingTimeS = 0
  let weekendMovingTimeS = 0
  const timeBySport = new Map<SportKind, number>()
  const activeDaysByMondayWeek = new Map<number, Set<number>>()

  for (const activity of activities) {
    const { hour } = activity.startLocal
    startHours[hour] = (startHours[hour] ?? 0) + 1
    const startSecond = secondsSinceMidnight(activity.startLocal)
    if (startSecond < EARLY_BIRD_BEFORE_S) {
      earlyStarts += 1
    }
    if (startSecond > NIGHT_OWL_AFTER_S) {
      nightStarts += 1
    }
    movingTimeS += activity.movingTimeS
    const weekday = weekdayOf(activity.startLocal)
    if (weekday === 0 || weekday === 6) {
      weekendMovingTimeS += activity.movingTimeS
    }
    timeBySport.set(activity.sport, (timeBySport.get(activity.sport) ?? 0) + activity.movingTimeS)
    const ordinal = dayOrdinal(activity.startLocal)
    const mondayOrdinal = ordinal - ((weekday + 6) % 7)
    const days = activeDaysByMondayWeek.get(mondayOrdinal) ?? new Set<number>()
    days.add(ordinal)
    activeDaysByMondayWeek.set(mondayOrdinal, days)
  }

  const qualifyingWeeks = [...activeDaysByMondayWeek.values()].filter(
    (days) => days.size >= 4,
  ).length
  const weeksWithActivity = activeDaysByMondayWeek.size
  const sportsWithShare = [...timeBySport.values()].filter(
    (sportMovingTimeS) => sportMovingTimeS * 10 >= movingTimeS,
  ).length

  const sortedMovingTimes = [...activities.map((a) => a.movingTimeS)].sort(
    (first, second) => first - second,
  )
  const middleIndex = Math.floor(sortedMovingTimes.length / 2)
  const lowerMiddle = sortedMovingTimes[middleIndex - 1] ?? 0
  const upperMiddle = sortedMovingTimes[middleIndex] ?? 0
  const medianMovingTimeS =
    sortedMovingTimes.length % 2 === 0 ? (lowerMiddle + upperMiddle) / 2 : upperMiddle

  const matches: ArchetypeId[] = []
  if (earlyStarts * 2 >= activities.length) {
    matches.push('earlyBird')
  }
  if (nightStarts * 5 >= activities.length * 2) {
    matches.push('nightOwl')
  }
  if (movingTimeS > 0 && weekendMovingTimeS * 5 >= movingTimeS * 3) {
    matches.push('weekendWarrior')
  }
  if (weeksWithActivity > 0 && qualifyingWeeks * 10 >= weeksWithActivity * 7) {
    matches.push('methodical')
  }
  if (movingTimeS > 0 && sportsWithShare >= 3) {
    matches.push('multisport')
  }
  if (medianMovingTimeS >= 4500) {
    matches.push('longDistance')
  }
  matches.push('steady')

  return {
    primary: matches[0] ?? 'steady',
    secondary: matches[1] ?? 'steady',
    startHours,
  }
}
