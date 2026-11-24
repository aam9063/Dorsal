import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { isoWeekOf } from '../time'
import { MIN_SESSIONS_PER_WEEK, weeklyLoad } from './weekly-load'

function at(month: number, day: number): PlainDateTime {
  return { year: 2026, month, day, hour: 10, minute: 0, second: 0 }
}

function activity(values: { startLocal: PlainDateTime; distanceM: number | null }): Activity {
  return {
    id: `a-${String(values.startLocal.month)}-${String(values.startLocal.day)}`,
    startLocal: values.startLocal,
    sport: 'run',
    sportRaw: 'Carrera',
    distanceM: values.distanceM,
    movingTimeS: 1800,
    elapsedTimeS: 1800,
    elevationGainM: 0,
    avgHeartRate: null,
    maxHeartRate: null,
    avgPowerW: null,
    maxPowerW: null,
    weightedAvgPowerW: null,
    gear: null,
  }
}

describe('weeklyLoad', () => {
  it('is exported as one constant the card can print', () => {
    expect(MIN_SESSIONS_PER_WEEK).toBe(3)
  })

  it('keys weeks by ISO number with their Monday and stores only weeks with activity', () => {
    // 2026-01-01 is a Thursday: week 1 spans Mon 2025-12-29 to Sun 2026-01-04,
    // week 2 is Mon 2026-01-05 to Sun 2026-01-11.
    const season = [
      activity({ startLocal: at(1, 5), distanceM: 5000 }),
      activity({ startLocal: at(1, 6), distanceM: 4000 }),
      activity({ startLocal: at(1, 9), distanceM: 6000 }),
      activity({ startLocal: at(2, 20), distanceM: 0 }),
    ]

    const result = weeklyLoad(season)

    expect(result?.weeks).toEqual([
      {
        isoYear: 2026,
        isoWeek: 2,
        monday: { month: 1, day: 5 },
        activityCount: 3,
        distanceM: 15000,
      },
      { isoYear: 2026, isoWeek: 8, monday: { month: 2, day: 16 }, activityCount: 1, distanceM: 0 },
    ])
    expect(isoWeekOf(at(1, 7))).toEqual({ isoYear: 2026, isoWeek: 2 })
  })

  it('picks the week with the most distance across all sports, ties to the earlier isoWeek', () => {
    const season = [
      activity({ startLocal: at(1, 5), distanceM: 5000 }),
      activity({ startLocal: at(1, 6), distanceM: 5000 }),
      activity({ startLocal: at(1, 12), distanceM: 6000 }),
      activity({ startLocal: at(1, 13), distanceM: 4000 }),
    ]

    const result = weeklyLoad(season)

    expect(result?.best?.isoWeek).toBe(2)
    expect(result?.best?.distanceM).toBe(10000)

    const tieToEarlier = weeklyLoad([
      activity({ startLocal: at(1, 6), distanceM: 7000 }),
      activity({ startLocal: at(1, 13), distanceM: 7000 }),
    ])
    expect(tieToEarlier?.best?.isoWeek).toBe(2)
  })

  it('counts consecutive fulfilled weeks only while the buckets stay adjacent', () => {
    const season = [
      ...[at(1, 5), at(1, 6), at(1, 7)].map((startLocal) =>
        activity({ startLocal, distanceM: 1000 }),
      ),
      ...[at(1, 12), at(1, 13)].map((startLocal) => activity({ startLocal, distanceM: 1000 })),
      ...[at(2, 2), at(2, 3), at(2, 4)].map((startLocal) =>
        activity({ startLocal, distanceM: 1000 }),
      ),
      ...[at(2, 9), at(2, 10), at(2, 11)].map((startLocal) =>
        activity({ startLocal, distanceM: 1000 }),
      ),
    ]

    const result = weeklyLoad(season)

    expect(result?.longestFulfilledStreak).toBe(2)
  })

  it('does not connect the last week of one bucket to the next when a week has no activity', () => {
    const result = weeklyLoad([
      activity({ startLocal: at(1, 5), distanceM: 1000 }),
      activity({ startLocal: at(1, 6), distanceM: 1000 }),
      activity({ startLocal: at(1, 7), distanceM: 1000 }),
      activity({ startLocal: at(2, 4), distanceM: 1000 }),
      activity({ startLocal: at(2, 25), distanceM: 1000 }),
      activity({ startLocal: at(2, 26), distanceM: 1000 }),
      activity({ startLocal: at(2, 27), distanceM: 1000 }),
    ])

    expect(result?.longestFulfilledStreak).toBe(1)
  })

  it('returns null for an empty season', () => {
    expect(weeklyLoad([])).toBeNull()
  })
})
