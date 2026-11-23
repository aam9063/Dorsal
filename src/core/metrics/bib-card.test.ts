import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { bibCard } from './bib-card'

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

describe('bibCard', () => {
  it('rounds total kilometres to the bib number and keeps the twelve-month series in metres', () => {
    const season = [
      activity({ id: 'b1', startLocal: at(1, 15), distanceM: 1234 }),
      activity({ id: 'b2', startLocal: at(2, 3), distanceM: 567 }),
      activity({ id: 'b3', startLocal: at(3, 20), distanceM: 1000 }),
      activity({ id: 'b4', startLocal: at(3, 21), distanceM: null }),
    ]

    const result = bibCard(season)

    expect(result).toEqual({
      number: 3,
      distanceKm: 2.801,
      monthlyDistanceM: [1234, 567, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    })
  })

  it('returns a zero card for an empty season', () => {
    expect(bibCard([])).toEqual({
      number: 0,
      distanceKm: 0,
      monthlyDistanceM: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    })
  })
})
