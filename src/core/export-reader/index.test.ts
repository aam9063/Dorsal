import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { generatePersonaCsv, HEADER, PERSONAS, type PersonaName } from '../../../fixtures/generator'
import { createSeasonAccumulator, readActivities } from './index'

/** Turns sparse column overrides into full 104-field rows. */
function rowsOf(rows: readonly Record<number, string>[]): string[][] {
  return rows.map((overrides) => HEADER.map((_, index) => overrides[index] ?? ''))
}

/** Builds a real 104-column csv from sparse column overrides. */
function csvOf(rows: readonly Record<number, string>[]): string {
  return Papa.unparse([[...HEADER], ...rowsOf(rows)])
}

const NOVEMBER_ROW = '5 nov 2026, 18:32:11'

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
      avgPowerW: null,
      maxPowerW: null,
      weightedAvgPowerW: null,
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

describe('raw csv edge cases the fixtures do not cover', () => {
  it('rejects a comma-decimal metre value instead of reading it as ten times the distance', () => {
    const oneActivity = (metres: string): string =>
      csvOf([{ 0: '1', 1: NOVEMBER_ROW, 3: 'Carrera', 5: '3600', 16: '3600.0', 17: metres }])

    const commaDecimal = readActivities(oneActivity('1234,6'))
    expect(commaDecimal.activities).toEqual([])
    expect(commaDecimal.stats.corruptRows).toBe(1)

    const mixedSeparators = readActivities(oneActivity('1.234,6'))
    expect(mixedSeparators.activities).toEqual([])
    expect(mixedSeparators.stats.corruptRows).toBe(1)

    const validThousands = readActivities(oneActivity('1,234.6'))
    expect(validThousands.stats.corruptRows).toBe(0)
    expect(validThousands.activities[0]?.distanceM).toBe(1234.6)
  })

  it('reads the metre column, not the kilometre column, when the two disagree', () => {
    const result = readActivities(
      csvOf([
        {
          0: '7',
          1: NOVEMBER_ROW,
          3: 'Carrera',
          5: '3600',
          6: '99,00',
          16: '3600.0',
          17: '1234.6',
        },
      ]),
    )

    expect(result.activities[0]?.distanceM).toBe(1234.6)
  })

  it('rejects a negative time or elevation instead of keeping it', () => {
    const negativeTime = readActivities(
      csvOf([{ 0: '2', 1: NOVEMBER_ROW, 3: 'Carrera', 5: '-3600', 16: '3600.0', 17: '5000.0' }]),
    )
    expect(negativeTime.activities).toEqual([])
    expect(negativeTime.stats.corruptRows).toBe(1)

    const negativeElevation = readActivities(
      csvOf([
        {
          0: '3',
          1: NOVEMBER_ROW,
          3: 'Carrera',
          5: '3600',
          16: '3600.0',
          17: '5000.0',
          20: '-5',
        },
      ]),
    )
    expect(negativeElevation.activities).toEqual([])
    expect(negativeElevation.stats.corruptRows).toBe(1)
  })

  it('does not eat the first row of a file without a header', () => {
    const headerless = Papa.unparse(
      rowsOf([
        { 0: '10', 1: NOVEMBER_ROW, 3: 'Carrera', 5: '3600', 16: '3600.0', 17: '5000.0' },
        { 0: '11', 1: NOVEMBER_ROW, 3: 'Carrera', 5: '3600', 16: '3600.0', 17: '5000.0' },
      ]),
    )

    const result = readActivities(headerless)

    expect(result.stats.totalRows).toBe(2)
    expect(result.activities).toHaveLength(2)
  })
})

describe('incremental accumulator', () => {
  it('produces exactly what readActivities produces, one row at a time', () => {
    for (const persona of PERSONAS_IN_SEASON_ORDER) {
      const csv = generatePersonaCsv(persona)
      const rows = Papa.parse<string[]>(csv, { skipEmptyLines: 'greedy' }).data
      const accumulator = createSeasonAccumulator()

      for (const row of rows) {
        accumulator.addRow(row)
      }

      expect(accumulator.finish()).toEqual(readActivities(csv))
    }
  })

  it('reports progress while rows arrive instead of waiting for the end', () => {
    const rows = Papa.parse<string[]>(generatePersonaCsv('runner-es'), {
      skipEmptyLines: 'greedy',
    }).data
    const accumulator = createSeasonAccumulator()

    accumulator.addRow(rows[0] ?? [])
    expect(accumulator.seenRows).toBe(0)

    accumulator.addRow(rows[1] ?? [])
    expect(accumulator.seenRows).toBe(1)
    expect(accumulator.keptRows + 1).toBeGreaterThanOrEqual(1)
  })
})

describe('numbers the export writes with a decimal tail', () => {
  it('reads heart rate and elevation written as 150.0 instead of marking the row corrupt', () => {
    const csv = csvOf([
      {
        0: '42',
        1: '22 nov 2026, 7:28:41',
        3: 'Bicicleta',
        5: '14389',
        7: '150.0',
        16: '11971.0',
        17: '61730.0',
        20: '243.0',
        31: '132.0',
      },
    ])

    const { activities, stats } = readActivities(csv)

    expect(stats.corruptRows).toBe(0)
    expect(activities).toHaveLength(1)
    expect(activities[0]?.maxHeartRate).toBe(150)
    expect(activities[0]?.avgHeartRate).toBe(132)
    expect(activities[0]?.elevationGainM).toBe(243)
    expect(activities[0]?.distanceM).toBe(61730)
  })
})

describe('power columns 32, 33 and 46', () => {
  const rideWithPower = (overrides: Record<number, string>): string =>
    csvOf([
      {
        0: '9',
        1: NOVEMBER_ROW,
        3: 'Bicicleta',
        5: '7200',
        16: '6900.0',
        17: '40200.0',
        ...overrides,
      },
    ])

  it('keeps the maximum and average watts of a powered ride', () => {
    const result = readActivities(rideWithPower({ 32: '876', 33: '243' }))

    expect(result.stats.corruptRows).toBe(0)
    expect(result.activities[0]?.maxPowerW).toBe(876)
    expect(result.activities[0]?.avgPowerW).toBe(243)
  })

  it('reads Spanish-locale watts: the dot groups thousands and the comma is the decimal point', () => {
    const result = readActivities(rideWithPower({ 32: '1.234,5', 33: '245,75' }))

    expect(result.activities[0]?.maxPowerW).toBe(1234.5)
    expect(result.activities[0]?.avgPowerW).toBe(245.75)
  })

  it('reads a comma-decimal watt value without grouping and an English-locale grouped value', () => {
    const commaDecimal = readActivities(rideWithPower({ 32: '1234,5' }))
    expect(commaDecimal.activities[0]?.maxPowerW).toBe(1234.5)

    const englishGrouped = readActivities(rideWithPower({ 33: '1,234.5' }))
    expect(englishGrouped.activities[0]?.avgPowerW).toBe(1234.5)
  })

  it('degrades to null for an absent or empty cell, never zero', () => {
    const result = readActivities(rideWithPower({}))

    expect(result.activities[0]?.avgPowerW).toBeNull()
    expect(result.activities[0]?.maxPowerW).toBeNull()
  })

  it('degrades to null for a garbage value and keeps the row itself valid', () => {
    const garbageInBoth = readActivities(rideWithPower({ 32: 'n/a', 33: 'potencia' }))
    expect(garbageInBoth.stats.corruptRows).toBe(0)
    expect(garbageInBoth.activities).toHaveLength(1)
    expect(garbageInBoth.activities[0]?.avgPowerW).toBeNull()
    expect(garbageInBoth.activities[0]?.maxPowerW).toBeNull()

    const garbageAfterGoodRows = readActivities(
      csvOf([
        {
          0: '9',
          1: NOVEMBER_ROW,
          3: 'Bicicleta',
          5: '7200',
          16: '6900.0',
          17: '40200.0',
          32: '900',
          33: '250',
        },
        {
          0: '10',
          1: NOVEMBER_ROW,
          3: 'Bicicleta',
          5: '7200',
          16: '6900.0',
          17: '40200.0',
          32: 'x',
          33: '',
        },
      ]),
    )
    expect(garbageAfterGoodRows.stats.corruptRows).toBe(0)
    expect(garbageAfterGoodRows.activities).toHaveLength(2)
    expect(garbageAfterGoodRows.activities[1]?.avgPowerW).toBeNull()
    expect(garbageAfterGoodRows.activities[1]?.maxPowerW).toBeNull()
  })

  it('reads the two columns independently when only one of them is filled', () => {
    const avgOnly = readActivities(rideWithPower({ 33: '250' }))
    expect(avgOnly.activities[0]?.avgPowerW).toBe(250)
    expect(avgOnly.activities[0]?.maxPowerW).toBeNull()

    const maxOnly = readActivities(rideWithPower({ 32: '900' }))
    expect(maxOnly.activities[0]?.maxPowerW).toBe(900)
    expect(maxOnly.activities[0]?.avgPowerW).toBeNull()
  })

  it('reads the weighted average power of column 46, the one column confirmed in a real export', () => {
    const weighted = readActivities(rideWithPower({ 46: '218.6' }))

    expect(weighted.stats.corruptRows).toBe(0)
    expect(weighted.activities[0]?.weightedAvgPowerW).toBe(218.6)
    expect(weighted.activities[0]?.avgPowerW).toBeNull()
    expect(weighted.activities[0]?.maxPowerW).toBeNull()
  })

  it('reads all three power columns independently, so a file with only column 46 still proves its intensity', () => {
    const onlyWeighted = readActivities(rideWithPower({ 46: '1.234,5' }))
    expect(onlyWeighted.activities[0]?.weightedAvgPowerW).toBe(1234.5)
    expect(onlyWeighted.activities[0]?.avgPowerW).toBeNull()
    expect(onlyWeighted.activities[0]?.maxPowerW).toBeNull()

    const allThree = readActivities(rideWithPower({ 32: '876', 33: '243', 46: '218.6' }))
    expect(allThree.activities[0]?.maxPowerW).toBe(876)
    expect(allThree.activities[0]?.avgPowerW).toBe(243)
    expect(allThree.activities[0]?.weightedAvgPowerW).toBe(218.6)

    const garbageWeighted = readActivities(rideWithPower({ 32: '900', 33: '250', 46: 'no' }))
    expect(garbageWeighted.activities[0]?.maxPowerW).toBe(900)
    expect(garbageWeighted.activities[0]?.avgPowerW).toBe(250)
    expect(garbageWeighted.activities[0]?.weightedAvgPowerW).toBeNull()
  })

  it('keeps each persona without watts watt-free', () => {
    for (const persona of PERSONAS_IN_SEASON_ORDER) {
      const { activities } = readActivities(generatePersonaCsv(persona))
      for (const activity of activities) {
        expect(activity.avgPowerW).toBeNull()
        expect(activity.maxPowerW).toBeNull()
        expect(activity.weightedAvgPowerW).toBeNull()
      }
    }
  })

  it('gives the cyclist-power persona watts on almost every ride and nobody else any watt', () => {
    for (const persona of PERSONAS) {
      const { activities } = readActivities(generatePersonaCsv(persona))
      const carryingPower = activities.filter(
        (activity) =>
          activity.avgPowerW !== null ||
          activity.maxPowerW !== null ||
          activity.weightedAvgPowerW !== null,
      )
      if (persona === 'cyclist-power') {
        expect(carryingPower.length).toBe(activities.length - 2)
        expect(carryingPower.length).toBeGreaterThan(20)
        for (const activity of carryingPower) {
          expect(activity.avgPowerW === null && activity.maxPowerW === null).toBe(false)
        }
      } else {
        expect(carryingPower).toEqual([])
      }
    }
  })
})
