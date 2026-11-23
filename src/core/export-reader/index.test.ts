import { describe, expect, it } from 'vitest'
import { generatePersonaCsv, type PersonaName } from '../../../fixtures/generator'
import { readActivities } from './index'

const PERSONAS_IN_SEASON_ORDER = [
  'runner-es',
  'cyclist',
  'multisport',
  'no-gear',
  'few-activities',
  'ten-years-history',
  'no-2026',
  'year-boundaries',
  'broken-rows',
] as const satisfies readonly PersonaName[]

describe('readActivities on fixture personas', () => {
  it('keeps exactly the in/out split of the year-boundaries fixture and drops the excluded row', () => {
    const { activities, stats } = readActivities(generatePersonaCsv('year-boundaries'))

    expect(stats).toEqual({ totalRows: 13, inSeason: 6, discardedOtherYear: 7, corruptRows: 0 })
    expect(activities).toHaveLength(6)

    const excluded = activities.find(
      (activity) => activity.startLocal.year === 2025 && activity.startLocal.month === 12,
    )
    expect(excluded).toBeUndefined()

    const firstOfTheYear = activities.find(
      (activity) =>
        activity.startLocal.month === 1 &&
        activity.startLocal.day === 1 &&
        activity.startLocal.hour === 0 &&
        activity.startLocal.minute === 10,
    )
    expect(firstOfTheYear?.id).toMatch(/^\d+$/)
    expect(firstOfTheYear).toEqual({
      id: firstOfTheYear?.id,
      startLocal: { year: 2026, month: 1, day: 1, hour: 0, minute: 10, second: 47 },
      sport: 'run',
      sportRaw: 'Carrera',
      distanceM: 6100,
      movingTimeS: 3480,
      elapsedTimeS: 3600,
      elevationGainM: 58,
      avgHeartRate: 151,
      maxHeartRate: 172,
      gear: 'Zapatillas asfalto',
    })

    for (const startLocal of activities.map((activity) => activity.startLocal)) {
      expect(startLocal.year).toBe(2026)
    }
    const startLocalKeys = activities.map((activity) =>
      [activity.startLocal.month, activity.startLocal.day].join('-'),
    )
    expect(startLocalKeys).toEqual(
      expect.arrayContaining(['1-1', '3-28', '3-29', '10-24', '10-25', '12-31']),
    )
  })

  it('keeps every 2026 row of the ten-years-history fixture and discards all other years', () => {
    const { activities, stats } = readActivities(generatePersonaCsv('ten-years-history'))

    expect(stats).toEqual({ totalRows: 204, inSeason: 28, discardedOtherYear: 176, corruptRows: 0 })
    expect(activities).toHaveLength(stats.inSeason)
    for (const activity of activities) {
      expect(activity.startLocal.year).toBe(2026)
    }
  })

  it('returns zero activities for the no-2026 fixture and counts every row as discarded', () => {
    const { activities, stats } = readActivities(generatePersonaCsv('no-2026'))

    expect(stats).toEqual({
      totalRows: 192,
      inSeason: 0,
      discardedOtherYear: 192,
      corruptRows: 0,
    })
    expect(activities).toEqual([])
  })

  it('counts the corrupt rows of the broken-rows fixture without throwing', () => {
    const { activities, stats } = readActivities(generatePersonaCsv('broken-rows'))

    expect(stats).toEqual({ totalRows: 42, inSeason: 12, discardedOtherYear: 28, corruptRows: 2 })
    expect(activities).toHaveLength(12)
    for (const activity of activities) {
      expect(activity.startLocal.year).toBe(2026)
    }
  })

  it('preserves the 2026 sport distribution of the multisport fixture', () => {
    const { activities, stats } = readActivities(generatePersonaCsv('multisport'))

    expect(stats).toEqual({ totalRows: 236, inSeason: 90, discardedOtherYear: 146, corruptRows: 0 })
    const bySport = new Map<string, number>()
    for (const activity of activities) {
      bySport.set(activity.sport, (bySport.get(activity.sport) ?? 0) + 1)
    }
    expect(Object.fromEntries(bySport)).toEqual({ run: 40, ride: 24, swim: 18, other: 8 })
    for (const activity of activities.filter((candidate) => candidate.sport === 'other')) {
      expect(activity.distanceM).toBeNull()
      expect(activity.sportRaw).toBe('Entrenamiento con pesas')
    }
  })

  it('reads distance from column 17 and keeps moving time within elapsed time', () => {
    const lastOfTheYear = readActivities(generatePersonaCsv('year-boundaries')).activities.find(
      (activity) =>
        activity.startLocal.month === 12 &&
        activity.startLocal.day === 31 &&
        activity.startLocal.minute === 50,
    )
    expect(lastOfTheYear?.distanceM).toBe(3560)
    expect(lastOfTheYear?.elapsedTimeS).toBe(1800)
    expect(lastOfTheYear?.movingTimeS).toBe(1740)

    for (const persona of PERSONAS_IN_SEASON_ORDER) {
      const { activities } = readActivities(generatePersonaCsv(persona))
      for (const activity of activities) {
        expect(activity.movingTimeS).toBeLessThanOrEqual(activity.elapsedTimeS)
      }
    }
  })

  it('is deterministic: reading the same text twice yields deep-equal output', () => {
    const csvText = generatePersonaCsv('runner-es')
    expect(readActivities(csvText)).toEqual(readActivities(csvText))
  })

  it('reports coherent stats for every persona', () => {
    for (const persona of PERSONAS_IN_SEASON_ORDER) {
      const { activities, stats } = readActivities(generatePersonaCsv(persona))
      expect(stats.inSeason).toBe(activities.length)
      expect(stats.totalRows).toBe(stats.inSeason + stats.discardedOtherYear + stats.corruptRows)
    }
  })
})
