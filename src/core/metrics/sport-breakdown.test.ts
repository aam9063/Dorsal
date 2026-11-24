import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { sportBreakdown } from './sport-breakdown'

function at(month: number, day: number): PlainDateTime {
  return { year: 2026, month, day, hour: 10, minute: 0, second: 0 }
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

describe('sportBreakdown', () => {
  it('splits a hand-computed season by sport, ordered by moving time descending, with the time share', () => {
    const season = [
      activity({
        id: 'a1',
        startLocal: at(2, 10),
        distanceM: 8000,
        movingTimeS: 3600,
        elevationGainM: 120,
      }),
      activity({
        id: 'a2',
        startLocal: at(2, 11),
        sport: 'ride',
        sportRaw: 'Bicicleta',
        distanceM: 40000,
        movingTimeS: 5400,
        elevationGainM: 300,
      }),
      activity({
        id: 'a3',
        startLocal: at(3, 2),
        distanceM: 12000,
        movingTimeS: 2000,
        elevationGainM: 40,
      }),
      activity({
        id: 'a4',
        startLocal: at(3, 3),
        sport: 'swim',
        sportRaw: 'Natación',
        distanceM: null,
        movingTimeS: 60,
      }),
    ]

    expect(sportBreakdown(season)).toEqual([
      {
        sport: 'run',
        activityCount: 2,
        distanceM: 20000,
        movingTimeS: 5600,
        elevationGainM: 160,
        share: 5600 / 11060,
      },
      {
        sport: 'ride',
        activityCount: 1,
        distanceM: 40000,
        movingTimeS: 5400,
        elevationGainM: 300,
        share: 5400 / 11060,
      },
      {
        sport: 'swim',
        activityCount: 1,
        distanceM: 0,
        movingTimeS: 60,
        elevationGainM: 0,
        share: 60 / 11060,
      },
    ])
  })

  it('keeps an absent distance or elevation at zero and a single sport at share 1', () => {
    expect(
      sportBreakdown([
        activity({
          id: 'a1',
          startLocal: at(1, 5),
          sport: 'walk',
          sportRaw: 'Caminata',
          distanceM: null,
          movingTimeS: 1800,
          elevationGainM: null,
        }),
      ]),
    ).toEqual([
      {
        sport: 'walk',
        activityCount: 1,
        distanceM: 0,
        movingTimeS: 1800,
        elevationGainM: 0,
        share: 1,
      },
    ])
  })

  it('returns an empty split for an empty season', () => {
    expect(sportBreakdown([])).toEqual([])
  })
})
