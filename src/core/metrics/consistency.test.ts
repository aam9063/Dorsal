import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { consistency } from './consistency'

function at(month: number, day: number): PlainDateTime {
  return { year: 2026, month, day, hour: 10, minute: 0, second: 0 }
}

function activity(values: { startLocal: PlainDateTime; movingTimeS: number }): Activity {
  return {
    id: 'a',
    sport: 'run',
    sportRaw: 'Carrera',
    distanceM: 0,
    elapsedTimeS: 0,
    elevationGainM: 0,
    avgHeartRate: null,
    maxHeartRate: null,
    gear: null,
    ...values,
  }
}

const FOUR_DAY_SEASON = [
  activity({ startLocal: at(1, 5), movingTimeS: 700 }),
  activity({ startLocal: at(1, 5), movingTimeS: 500 }),
  activity({ startLocal: at(1, 6), movingTimeS: 600 }),
  activity({ startLocal: at(1, 8), movingTimeS: 300 }),
  activity({ startLocal: at(1, 9), movingTimeS: 900 }),
]

describe('consistency', () => {
  it('aggregates one heatmap entry per active day with nearest-rank quartile levels', () => {
    const result = consistency(FOUR_DAY_SEASON)

    expect(result).not.toBeNull()
    const data = result!
    expect(data.heatmap).toEqual([
      { month: 1, day: 5, movingTimeS: 1200, level: 4 },
      { month: 1, day: 6, movingTimeS: 600, level: 2 },
      { month: 1, day: 8, movingTimeS: 300, level: 1 },
      { month: 1, day: 9, movingTimeS: 900, level: 3 },
    ])
  })

  it('keeps the earliest of equal-length streaks', () => {
    const result = consistency(FOUR_DAY_SEASON)

    expect(result?.longestStreak).toEqual({
      days: 2,
      from: { month: 1, day: 5 },
      to: { month: 1, day: 6 },
    })
  })

  it('puts a lone active day in the lowest quartile', () => {
    expect(consistency([activity({ startLocal: at(3, 12), movingTimeS: 4200 })])?.heatmap).toEqual([
      { month: 3, day: 12, movingTimeS: 4200, level: 1 },
    ])
  })

  it('counts the favorite weekday over distinct Monday-based weeks', () => {
    const season = [
      activity({ startLocal: at(1, 5), movingTimeS: 600 }),
      activity({ startLocal: at(1, 6), movingTimeS: 500 }),
      activity({ startLocal: at(1, 12), movingTimeS: 300 }),
    ]

    expect(consistency(season)?.favoriteWeekday).toEqual({ weekday: 1, weeks: 2 })
  })

  it('breaks weekday ties by greater total moving time, then by lower weekday index', () => {
    const timeTie = [
      activity({ startLocal: at(1, 5), movingTimeS: 300 }),
      activity({ startLocal: at(1, 6), movingTimeS: 610 }),
    ]
    expect(consistency(timeTie)?.favoriteWeekday).toEqual({ weekday: 2, weeks: 1 })

    const fullTie = [
      activity({ startLocal: at(1, 5), movingTimeS: 300 }),
      activity({ startLocal: at(1, 7), movingTimeS: 300 }),
    ]
    expect(consistency(fullTie)?.favoriteWeekday).toEqual({ weekday: 1, weeks: 1 })
  })

  it('returns null for an empty season', () => {
    expect(consistency([])).toBeNull()
  })
})
