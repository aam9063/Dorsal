import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { seasonBests } from './season-bests'

function at(month: number, day: number): PlainDateTime {
  return { year: 2026, month, day, hour: 10, minute: 0, second: 0 }
}

function activity(values: {
  startLocal: PlainDateTime
  distanceM?: number | null
  elevationGainM?: number | null
  movingTimeS?: number
}): Activity {
  return {
    id: `a-${String(values.startLocal.month)}-${String(values.startLocal.day)}`,
    sport: 'run',
    sportRaw: 'Carrera',
    distanceM: values.distanceM ?? null,
    movingTimeS: values.movingTimeS ?? 1800,
    elapsedTimeS: 3600,
    elevationGainM: values.elevationGainM ?? null,
    avgHeartRate: null,
    maxHeartRate: null,
    avgPowerW: null,
    maxPowerW: null,
    weightedAvgPowerW: null,
    gear: null,
    ...values,
  }
}

describe('seasonBests', () => {
  it('marks the longest session by distance with its date', () => {
    const result = seasonBests([
      activity({ startLocal: at(2, 10), distanceM: 8000 }),
      activity({ startLocal: at(2, 12), distanceM: 12000 }),
      activity({ startLocal: at(3, 3), distanceM: 9500 }),
    ])

    expect(result?.longestSessionByDistance).toEqual({ distanceM: 12000, month: 2, day: 12 })
  })

  it('sums the elevation of each day and marks the biggest single day, ties to the earlier day', () => {
    const result = seasonBests([
      activity({ startLocal: at(1, 8), distanceM: 5000, elevationGainM: 900 }),
      activity({ startLocal: at(3, 5), distanceM: 5000, elevationGainM: 400 }),
      activity({ startLocal: at(3, 5), distanceM: 5000, elevationGainM: 600 }),
      activity({ startLocal: at(6, 20), distanceM: 5000, elevationGainM: 1000 }),
    ])

    expect(result?.biggestElevationDay).toEqual({ elevationGainM: 1000, month: 3, day: 5 })

    const tie = seasonBests([
      activity({ startLocal: at(1, 8), distanceM: 5000, elevationGainM: 900 }),
      activity({ startLocal: at(3, 5), distanceM: 5000, elevationGainM: 900 }),
    ])
    expect(tie?.biggestElevationDay).toEqual({ elevationGainM: 900, month: 1, day: 8 })
  })

  it('marks the best week of the year, dated by its Monday', () => {
    const season = [
      activity({ startLocal: at(1, 5), distanceM: 4000 }),
      activity({ startLocal: at(1, 6), distanceM: 4000 }),
      activity({ startLocal: at(1, 7), distanceM: 4000 }),
      activity({ startLocal: at(5, 11), distanceM: 11000 }),
      activity({ startLocal: at(5, 12), distanceM: 9000 }),
    ]

    expect(seasonBests(season)?.bestWeek).toEqual({
      distanceM: 20000,
      isoWeek: 20,
      monday: { month: 5, day: 11 },
    })
  })

  it('leaves a mark null when nothing in the season could prove it', () => {
    const noDistance = seasonBests([
      activity({ startLocal: at(2, 10), distanceM: null, elevationGainM: 300 }),
    ])
    expect(noDistance?.longestSessionByDistance).toBeNull()
    expect(noDistance?.biggestElevationDay).toEqual({ elevationGainM: 300, month: 2, day: 10 })

    const noElevation = seasonBests([activity({ startLocal: at(2, 10), distanceM: 5000 })])
    expect(noElevation?.biggestElevationDay).toBeNull()
    expect(noElevation?.longestSessionByDistance).not.toBeNull()
    expect(noElevation?.bestWeek).not.toBeNull()
  })

  it('returns null without activity counts invented for an empty season', () => {
    expect(seasonBests([])).toBeNull()
  })
})
