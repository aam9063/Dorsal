import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { heartbeats } from './heartbeats'

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

describe('heartbeats', () => {
  it('sums beats as average heart rate times moving minutes and keeps the peak with its date', () => {
    const season = [
      activity({
        id: 'h1',
        startLocal: at(1, 5),
        avgHeartRate: 150,
        maxHeartRate: 190,
        movingTimeS: 3600,
      }),
      activity({
        id: 'h2',
        startLocal: at(3, 10),
        avgHeartRate: 160,
        maxHeartRate: 195,
        movingTimeS: 1800,
      }),
      activity({ id: 'h3', startLocal: at(6, 20), movingTimeS: 3600 }),
    ]

    const result = heartbeats(season)

    expect(result).not.toBeNull()
    expect(result?.beats).toBe(150 * 60 + 160 * 30)
    expect(result?.restingDays).toBeCloseTo(13800 / 86400, 12)
    expect(result?.peak).toEqual({ bpm: 195, month: 3, day: 10 })
    expect(result?.coverage).toBeCloseTo(5400 / 9000, 12)
  })

  it('returns a null peak when no activity carries a maximum heart rate', () => {
    const season = [
      activity({ id: 'h1', startLocal: at(2, 1), avgHeartRate: 150, movingTimeS: 1000 }),
      activity({
        id: 'h2',
        startLocal: at(2, 2),
        avgHeartRate: 150,
        maxHeartRate: null,
        movingTimeS: 1000,
      }),
    ]

    const result = heartbeats(season)

    expect(result?.beats).toBe(5000)
    expect(result?.peak).toBeNull()
    expect(result?.coverage).toBe(1)
  })

  it('returns null when moving time with heart rate is below 0.30 of the total', () => {
    const season = [
      activity({ id: 'h1', startLocal: at(1, 5), avgHeartRate: 150, movingTimeS: 1000 }),
      activity({ id: 'h2', startLocal: at(1, 6), movingTimeS: 5000 }),
    ]

    expect(heartbeats(season)).toBeNull()
    expect(heartbeats([])).toBeNull()
  })

  it('keeps the section when coverage is exactly 0.30', () => {
    const season = [
      activity({
        id: 'h1',
        startLocal: at(1, 5),
        avgHeartRate: 150,
        maxHeartRate: 190,
        movingTimeS: 3000,
      }),
      activity({ id: 'h2', startLocal: at(1, 6), movingTimeS: 7000 }),
    ]

    const result = heartbeats(season)

    expect(result?.peak).toEqual({ bpm: 190, month: 1, day: 5 })
  })
})

describe('heartbeats peak', () => {
  it('takes the peak from an activity that carries a maximum but no average', () => {
    const season = [
      activity({
        id: 'm1',
        startLocal: at(2, 10),
        avgHeartRate: 150,
        maxHeartRate: 190,
        movingTimeS: 3600,
      }),
      activity({
        id: 'm2',
        startLocal: at(5, 20),
        avgHeartRate: null,
        maxHeartRate: 210,
        movingTimeS: 600,
      }),
    ]

    const result = heartbeats(season)

    expect(result?.peak).toEqual({ bpm: 210, month: 5, day: 20 })
    expect(result?.beats).toBeCloseTo(9000, 6)
    expect(result?.coverage).toBeCloseTo(3600 / 4200, 6)
  })
})
