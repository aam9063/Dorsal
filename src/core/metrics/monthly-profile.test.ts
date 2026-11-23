import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { monthlyProfile } from './monthly-profile'

function at(
  month: number,
  day: number,
  distanceM: number | null,
): { startLocal: PlainDateTime; distanceM: number | null } {
  return { startLocal: { year: 2026, month, day, hour: 10, minute: 0, second: 0 }, distanceM }
}

function activity(values: { startLocal: PlainDateTime; distanceM: number | null }): Activity {
  return {
    id: 'a',
    sport: 'run',
    sportRaw: 'Carrera',
    movingTimeS: 3600,
    elapsedTimeS: 3600,
    elevationGainM: 0,
    avgHeartRate: null,
    maxHeartRate: null,
    gear: null,
    ...values,
  }
}

describe('monthlyProfile', () => {
  it('fills twelve months and computes peak, valley and comeback from a hand-computed season', () => {
    const season = [at(1, 15, 10000), at(2, 3, 2000), at(6, 20, 6000)].map(activity)

    const result = monthlyProfile(season)

    expect(result).not.toBeNull()
    const profile = result!
    expect(profile.months.map((month) => month.month)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ])
    expect(profile.months.map((month) => month.distanceM)).toEqual([
      10000, 2000, 0, 0, 0, 6000, 0, 0, 0, 0, 0, 0,
    ])
    expect(profile.peak).toEqual({ month: 1, distanceM: 10000 })
    expect(profile.valley).toEqual({ month: 2, distanceM: 2000 })
    expect(profile.comeback).toBe(3)
  })

  it('never lets an empty month win the valley', () => {
    const season = [at(1, 10, 5000), at(3, 5, 100), at(4, 12, 200)].map(activity)

    const profile = monthlyProfile(season)

    expect(profile?.peak).toEqual({ month: 1, distanceM: 5000 })
    expect(profile?.valley).toEqual({ month: 3, distanceM: 100 })
    expect(profile?.comeback).toBe(2)
  })

  it('keeps the earliest month on distance ties', () => {
    const season = [at(2, 1, 3000), at(4, 1, 3000), at(6, 1, 3000)].map(activity)

    const profile = monthlyProfile(season)

    expect(profile?.peak).toEqual({ month: 2, distanceM: 3000 })
    expect(profile?.valley).toEqual({ month: 2, distanceM: 3000 })
    expect(profile?.comeback).toBe(1)
  })

  it('returns a null comeback when the valley distance is zero', () => {
    const season = [at(1, 1, null), at(2, 1, null), at(3, 1, null)].map(activity)

    const profile = monthlyProfile(season)

    expect(profile?.peak).toEqual({ month: 1, distanceM: 0 })
    expect(profile?.valley).toEqual({ month: 1, distanceM: 0 })
    expect(profile?.comeback).toBeNull()
  })

  it('returns null when fewer than three months have activity', () => {
    const season = [at(1, 10, 5000), at(2, 10, 5000)].map(activity)

    expect(monthlyProfile(season)).toBeNull()
  })
})
