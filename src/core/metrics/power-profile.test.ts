import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { powerProfile } from './power-profile'

function at(month: number, day: number): PlainDateTime {
  return { year: 2026, month, day, hour: 10, minute: 0, second: 0 }
}

function activity(values: {
  startLocal: PlainDateTime
  avgPowerW?: number | null
  maxPowerW?: number | null
  weightedAvgPowerW?: number | null
}): Activity {
  return {
    id: `a-${String(values.startLocal.month)}-${String(values.startLocal.day)}`,
    startLocal: values.startLocal,
    sport: 'ride',
    sportRaw: 'Bicicleta',
    distanceM: 40000,
    movingTimeS: 5400,
    elapsedTimeS: 5400,
    elevationGainM: 0,
    avgHeartRate: null,
    maxHeartRate: null,
    avgPowerW: values.avgPowerW ?? null,
    maxPowerW: values.maxPowerW ?? null,
    weightedAvgPowerW: values.weightedAvgPowerW ?? null,
    gear: null,
  }
}

describe('powerProfile', () => {
  it('stores the best weighted average and best max power per month and for the year', () => {
    const season = [
      activity({ startLocal: at(1, 10), weightedAvgPowerW: 220.5, avgPowerW: 200, maxPowerW: 900 }),
      activity({ startLocal: at(1, 24), weightedAvgPowerW: 214, avgPowerW: 210, maxPowerW: 870 }),
      activity({ startLocal: at(3, 5), weightedAvgPowerW: 240, avgPowerW: 230, maxPowerW: 962 }),
      activity({
        startLocal: at(3, 20),
        avgPowerW: null,
        maxPowerW: null,
        weightedAvgPowerW: null,
      }),
    ]

    const result = powerProfile(season)

    expect(result?.months).toEqual([
      {
        month: 1,
        bestWeightedAvgPowerW: 220.5,
        bestMaxPowerW: 900,
        activityCount: 2,
        sessionsWithPower: 2,
        coverage: 1,
      },
      {
        month: 3,
        bestWeightedAvgPowerW: 240,
        bestMaxPowerW: 962,
        activityCount: 2,
        sessionsWithPower: 1,
        coverage: 0.5,
      },
    ])
    expect(result?.totals).toEqual({
      bestWeightedAvgPowerW: 240,
      bestMaxPowerW: 962,
      activityCount: 4,
      sessionsWithPower: 3,
      coverage: 0.75,
    })
  })

  it('counts a session as with power when any of the three columns carries a watt', () => {
    const season = [
      activity({ startLocal: at(2, 3), weightedAvgPowerW: 218.6 }),
      activity({ startLocal: at(2, 4), maxPowerW: 812 }),
      activity({ startLocal: at(2, 5), avgPowerW: 200 }),
      activity({ startLocal: at(2, 6) }),
    ]

    const result = powerProfile(season)

    expect(result?.months[0]).toEqual({
      month: 2,
      bestWeightedAvgPowerW: 218.6,
      bestMaxPowerW: 812,
      activityCount: 4,
      sessionsWithPower: 3,
      coverage: 0.75,
    })
    expect(result?.totals.sessionsWithPower).toBe(3)
    expect(result?.totals.bestWeightedAvgPowerW).toBe(218.6)
    expect(result?.totals.bestMaxPowerW).toBe(812)
  })

  it('stays usable when the file fills only the weighted average of column 46', () => {
    const onlyWeighted = powerProfile([
      activity({ startLocal: at(4, 2), weightedAvgPowerW: 236.4 }),
      activity({ startLocal: at(4, 3) }),
    ])

    expect(onlyWeighted?.months[0]).toEqual({
      month: 4,
      bestWeightedAvgPowerW: 236.4,
      bestMaxPowerW: null,
      activityCount: 2,
      sessionsWithPower: 1,
      coverage: 0.5,
    })
    expect(onlyWeighted?.totals).toEqual({
      bestWeightedAvgPowerW: 236.4,
      bestMaxPowerW: null,
      activityCount: 2,
      sessionsWithPower: 1,
      coverage: 0.5,
    })
  })

  it('returns null when no activity of the season carries any watt', () => {
    expect(
      powerProfile([activity({ startLocal: at(5, 1) }), activity({ startLocal: at(6, 1) })]),
    ).toBeNull()
    expect(powerProfile([])).toBeNull()
  })
})
