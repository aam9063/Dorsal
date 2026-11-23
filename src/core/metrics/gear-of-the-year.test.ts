import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { gearOfTheYear } from './gear-of-the-year'

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
    gear: null,
    ...values,
  }
}

describe('gearOfTheYear', () => {
  it('groups by gear, sorts by moving time and flags running shoes over 800 km', () => {
    const season = [
      activity({
        id: 'g1',
        startLocal: at(1, 10),
        gear: 'Zapatillas asfalto',
        distanceM: 850000,
        movingTimeS: 6000,
      }),
      activity({
        id: 'g2',
        startLocal: at(2, 10),
        gear: 'Zapatillas asfalto',
        distanceM: 100000,
        movingTimeS: 2000,
      }),
      activity({
        id: 'g3',
        startLocal: at(3, 10),
        sport: 'ride',
        sportRaw: 'Bicicleta',
        gear: 'Bici carretera',
        distanceM: 500000,
        movingTimeS: 12000,
      }),
      activity({ id: 'g4', startLocal: at(4, 10), distanceM: 1000, movingTimeS: 1000 }),
    ]

    const result = gearOfTheYear(season)

    expect(result).not.toBeNull()
    expect(result?.items).toEqual([
      {
        name: 'Bici carretera',
        distanceM: 500000,
        movingTimeS: 12000,
        activityCount: 1,
        needsRetiring: false,
      },
      {
        name: 'Zapatillas asfalto',
        distanceM: 950000,
        movingTimeS: 8000,
        activityCount: 2,
        needsRetiring: true,
      },
    ])
    expect(result?.star).toBe('Bici carretera')
    expect(result?.showsBikes).toBe(true)
  })

  it('never returns the unassigned group and keeps the star among assigned items', () => {
    const unassigned = Array.from({ length: 6 }, (_, index) =>
      activity({ id: `u${index}`, startLocal: at(1, 1 + index), movingTimeS: 1000 }),
    )
    const assigned = [
      ...Array.from({ length: 3 }, (_, index) =>
        activity({
          id: `x${index}`,
          startLocal: at(2, 1 + index),
          gear: 'Zapatillas pista',
          movingTimeS: 1000,
        }),
      ),
      activity({
        id: 'y0',
        startLocal: at(3, 1),
        sport: 'ride',
        sportRaw: 'Bicicleta',
        gear: 'Bici',
        movingTimeS: 1000,
      }),
    ]
    const season = [...unassigned, ...assigned]
    expect(season).toHaveLength(10)

    const result = gearOfTheYear(season)

    expect(result?.items.map((item) => item.name)).toEqual(['Zapatillas pista', 'Bici'])
    expect(result?.star).toBe('Zapatillas pista')
    expect(result?.showsBikes).toBe(false)
  })

  it('does not flag anything below the 800 km boundary or over it for non-run gear', () => {
    const season = [
      activity({
        id: 'r1',
        startLocal: at(1, 10),
        gear: 'Zapatillas pista',
        distanceM: 799999,
        movingTimeS: 3000,
      }),
      activity({
        id: 'b1',
        startLocal: at(2, 10),
        sport: 'ride',
        sportRaw: 'Bicicleta',
        gear: 'Bici gravel',
        distanceM: 900000,
        movingTimeS: 4000,
      }),
      activity({ id: 'u1', startLocal: at(3, 10), movingTimeS: 1000 }),
    ]

    const result = gearOfTheYear(season)

    expect(result?.items).toEqual([
      {
        name: 'Bici gravel',
        distanceM: 900000,
        movingTimeS: 4000,
        activityCount: 1,
        needsRetiring: false,
      },
      {
        name: 'Zapatillas pista',
        distanceM: 799999,
        movingTimeS: 3000,
        activityCount: 1,
        needsRetiring: false,
      },
    ])
  })

  it('returns null when moving time with gear is below 0.30 of the total', () => {
    const season = [
      activity({ id: 'g1', startLocal: at(1, 10), gear: 'Zapatillas', movingTimeS: 3000 }),
      activity({ id: 'u1', startLocal: at(2, 10), movingTimeS: 3000 }),
      activity({ id: 'u2', startLocal: at(3, 10), movingTimeS: 3000 }),
      activity({ id: 'u3', startLocal: at(4, 10), movingTimeS: 3000 }),
    ]

    expect(gearOfTheYear(season)).toBeNull()
    expect(gearOfTheYear([])).toBeNull()
  })

  it('keeps the section when moving time with gear is exactly 0.30 of the total', () => {
    const season = [
      activity({
        id: 'g1',
        startLocal: at(1, 10),
        gear: 'Zapatillas',
        movingTimeS: 3000,
        distanceM: 50000,
      }),
      activity({ id: 'u1', startLocal: at(2, 10), movingTimeS: 3000 }),
      activity({ id: 'u2', startLocal: at(3, 10), movingTimeS: 2000 }),
      activity({ id: 'u3', startLocal: at(4, 10), movingTimeS: 2000 }),
    ]

    const result = gearOfTheYear(season)

    expect(result?.star).toBe('Zapatillas')
  })
})
