import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { totals } from './totals'

function at(month: number, day: number, hour = 10): PlainDateTime {
  return { year: 2026, month, day, hour, minute: 0, second: 0 }
}

function activity(
  values: Partial<Omit<Activity, 'startLocal'>> & { startLocal: PlainDateTime },
): Activity {
  return {
    id: 'a',
    sport: 'run',
    sportRaw: 'Carrera',
    distanceM: 0,
    movingTimeS: 0,
    elapsedTimeS: 0,
    elevationGainM: 0,
    avgHeartRate: null,
    maxHeartRate: null,
    avgPowerW: null,
    maxPowerW: null,
    weightedAvgPowerW: null,
    gear: null,
    ...values,
  }
}

describe('totals', () => {
  it('sums a hand-computed three-day season and splits moving time by sport', () => {
    const season = [
      activity({
        id: 'a1',
        startLocal: at(2, 10),
        distanceM: 5000,
        movingTimeS: 1800,
        elevationGainM: 100,
      }),
      activity({
        id: 'a2',
        startLocal: at(2, 11),
        sport: 'ride',
        sportRaw: 'Bicicleta',
        distanceM: null,
        movingTimeS: 2700,
        elevationGainM: null,
      }),
      activity({
        id: 'a3',
        startLocal: at(3, 1),
        distanceM: 10000,
        movingTimeS: 3600,
        elevationGainM: 200,
      }),
      activity({ id: 'a4', startLocal: at(3, 1), distanceM: 1000, movingTimeS: 900 }),
    ]

    const result = totals(season)

    expect(result).toEqual({
      distanceM: 16000,
      movingTimeS: 9000,
      activityCount: 4,
      activeDays: 3,
      elevationGainM: 300,
      bySport: [
        { sport: 'run', movingTimeS: 6300, share: 0.7 },
        { sport: 'ride', movingTimeS: 2700, share: 0.3 },
      ],
      trackLaps: 40,
      everests: 300 / 8849,
    })
  })

  it('treats absent distance and elevation as zero and a zero total as share 0', () => {
    const result = totals([
      activity({
        id: 'a1',
        startLocal: at(1, 5),
        sport: 'swim',
        sportRaw: 'Natación',
        distanceM: null,
        movingTimeS: 0,
        elevationGainM: null,
      }),
    ])

    expect(result).toEqual({
      distanceM: 0,
      movingTimeS: 0,
      activityCount: 1,
      activeDays: 1,
      elevationGainM: 0,
      bySport: [{ sport: 'swim', movingTimeS: 0, share: 0 }],
      trackLaps: 0,
      everests: 0,
    })
  })

  it('returns all-zero totals for an empty season', () => {
    expect(totals([])).toEqual({
      distanceM: 0,
      movingTimeS: 0,
      activityCount: 0,
      activeDays: 0,
      elevationGainM: 0,
      bySport: [],
      trackLaps: 0,
      everests: 0,
    })
  })
})
