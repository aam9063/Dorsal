import { describe, expect, it } from 'vitest'
import { YearSummary } from '../model/year-summary'
import type { Activity, PlainDateTime } from '../model'
import { buildYearSummary } from './build-year-summary'
import { MIN_SESSIONS_PER_WEEK } from './weekly-load'

function at(month: number, day: number, hour: number): PlainDateTime {
  return { year: 2026, month, day, hour, minute: 0, second: 0 }
}

/**
 * Ten activities crafted so every section clears its threshold: 0.6 early
 * starts (archetype), four months of activity (monthly profile), 0.4 of the
 * moving time with gear and 0.4 with heart rate. First four live in February.
 */
function richActivities(): Activity[] {
  const dates = [
    at(2, 2, 6),
    at(2, 3, 6),
    at(2, 4, 6),
    at(2, 5, 6),
    at(3, 2, 6),
    at(3, 3, 6),
    at(5, 2, 10),
    at(5, 3, 10),
    at(5, 4, 10),
    at(6, 2, 10),
  ]
  return dates.map((startLocal, index) => ({
    id: `a${index}`,
    startLocal,
    sport: 'run' as const,
    sportRaw: 'Carrera',
    distanceM: 100000,
    movingTimeS: 3600,
    elapsedTimeS: 3600,
    elevationGainM: 0,
    avgHeartRate: index < 4 ? 150 : null,
    maxHeartRate: index < 4 ? 190 : null,
    avgPowerW: null,
    maxPowerW: null,
    weightedAvgPowerW: null,
    gear: index < 4 ? 'Zapatillas asfalto' : null,
  }))
}

function withoutGear(activities: Activity[], keepGearAt: number[]): Activity[] {
  return activities.map((activity, index) =>
    keepGearAt.includes(index) ? activity : { ...activity, gear: null },
  )
}

function withoutHeartRate(activities: Activity[], keepAt: number[]): Activity[] {
  return activities.map((activity, index) =>
    keepAt.includes(index) ? activity : { ...activity, avgHeartRate: null, maxHeartRate: null },
  )
}

/** Ride with a full power reading, so the conditional power panel has data. */
function withPower(activities: Activity[]): Activity[] {
  return activities.map((activity, index) =>
    index % 2 === 0
      ? { ...activity, avgPowerW: 200, maxPowerW: 900, weightedAvgPowerW: 220.5 }
      : activity,
  )
}

function withMonths(activities: Activity[], monthFor: (index: number) => number): Activity[] {
  return activities.map((activity, index) => ({
    ...activity,
    startLocal: { ...activity.startLocal, month: monthFor(index) },
  }))
}

describe('buildYearSummary and the YearSummary schema', () => {
  it('assembles every section with all thresholds met and marks nothing short', () => {
    const summary = buildYearSummary(withPower(richActivities()))

    expect(summary.availability).toEqual({
      monthlyProfile: true,
      archetype: true,
      gear: true,
      heartbeats: true,
      shortVersion: false,
      seasonCards: true,
      powerProfile: true,
    })
    expect(summary.totals.activityCount).toBe(10)
    expect(summary.monthlyProfile).not.toBeNull()
    expect(summary.consistency).not.toBeNull()
    expect(summary.archetype?.primary).toBe('earlyBird')
    expect(summary.gear?.star).toBe('Zapatillas asfalto')
    expect(summary.heartbeats?.coverage).toBeCloseTo(0.4, 12)
    expect(summary.bibCard.number).toBe(1000)
  })

  it('drops each section exactly when that section threshold is not met', () => {
    const rich = richActivities()

    const twoMonths = buildYearSummary(withMonths(rich, (index) => (index < 6 ? 2 : 3)))
    expect(twoMonths.monthlyProfile).toBeNull()
    expect(twoMonths.availability.monthlyProfile).toBe(false)
    expect(twoMonths.availability.archetype).toBe(true)

    const nineActivities = buildYearSummary(rich.slice(0, 9))
    expect(nineActivities.archetype).toBeNull()
    expect(nineActivities.availability.archetype).toBe(false)
    expect(nineActivities.availability.monthlyProfile).toBe(true)

    const gearBelowThreshold = buildYearSummary(withoutGear(rich, [0, 1]))
    expect(gearBelowThreshold.gear).toBeNull()
    expect(gearBelowThreshold.availability.gear).toBe(false)
    expect(gearBelowThreshold.availability.heartbeats).toBe(true)

    const heartbeatsBelowThreshold = buildYearSummary(withoutHeartRate(rich, [0, 1]))
    expect(heartbeatsBelowThreshold.heartbeats).toBeNull()
    expect(heartbeatsBelowThreshold.availability.heartbeats).toBe(false)
    expect(heartbeatsBelowThreshold.availability.gear).toBe(true)
  })

  it('keeps every 0.30 share section exactly at its threshold', () => {
    const gearAtThreshold = buildYearSummary(withoutGear(richActivities(), [0, 1, 2]))
    expect(gearAtThreshold.gear).not.toBeNull()

    const heartbeatsAtThreshold = buildYearSummary(withoutHeartRate(richActivities(), [0, 1, 2]))
    expect(heartbeatsAtThreshold.heartbeats).not.toBeNull()
  })

  it('flags the short version with four activities and not with five', () => {
    const fourActivities = buildYearSummary(richActivities().slice(0, 4))
    expect(fourActivities.availability.shortVersion).toBe(true)

    const fiveActivities = buildYearSummary(richActivities().slice(0, 5))
    expect(fiveActivities.availability.shortVersion).toBe(false)
  })

  it('builds the four new season-card sections and flags the two new panels', () => {
    const summary = buildYearSummary(withPower(richActivities()))

    expect(summary.sportBreakdown?.sports[0]).toEqual({
      sport: 'run',
      activityCount: 10,
      distanceM: 1_000_000,
      movingTimeS: 36_000,
      elevationGainM: 0,
      share: 1,
    })
    expect(summary.weeklyLoad).not.toBeNull()
    expect(summary.seasonBests?.bestWeek).not.toBeNull()
    expect(summary.powerProfile?.totals.bestWeightedAvgPowerW).toBe(220.5)
    expect(summary.availability.seasonCards).toBe(true)
    expect(summary.availability.powerProfile).toBe(true)
  })

  it('drops the new sections for an empty season and degrades the power panel without watts', () => {
    const empty = buildYearSummary([])

    expect(empty.sportBreakdown).toBeNull()
    expect(empty.weeklyLoad).toBeNull()
    expect(empty.seasonBests).toBeNull()
    expect(empty.powerProfile).toBeNull()
    expect(empty.availability.seasonCards).toBe(false)
    expect(empty.availability.powerProfile).toBe(false)

    const withoutWatts = buildYearSummary(richActivities())
    expect(withoutWatts.powerProfile).toBeNull()
    expect(withoutWatts.availability.powerProfile).toBe(false)
    expect(withoutWatts.availability.seasonCards).toBe(true)
  })

  it('keeps the fulfilled-week threshold of the card in one exported constant', () => {
    expect(MIN_SESSIONS_PER_WEEK).toBe(3)
  })

  it('the schema validates the new sections and still rejects a per-activity array under any key', () => {
    const summary = buildYearSummary(withPower(richActivities()))
    expect(YearSummary.parse(summary)).toEqual(summary)

    const injected = (key: keyof YearSummary, value: unknown): unknown => ({
      ...summary,
      [key]: { ...(summary[key] as object), rows: value },
    })

    const sportRows = injected('sportBreakdown', [richActivities()[0]])
    expect(() => YearSummary.parse(sportRows)).toThrow()

    const weeklyRows = injected('weeklyLoad', [richActivities()[0]])
    expect(() => YearSummary.parse(weeklyRows)).toThrow()

    const powerRows = injected('powerProfile', [richActivities()[0]])
    expect(() => YearSummary.parse(powerRows)).toThrow()

    const bestsRows = injected('seasonBests', [richActivities()[0]])
    expect(() => YearSummary.parse(bestsRows)).toThrow()

    const summaryRows = injected('totals', [richActivities()[0]])
    expect(() => YearSummary.parse(summaryRows)).toThrow()
  })

  it('the schema validates its own output and rejects objects carrying a per-activity array', () => {
    const summary = buildYearSummary(richActivities())
    expect(YearSummary.parse(summary)).toEqual(summary)

    const topLevelActivities = { ...summary, activities: richActivities() }
    expect(() => YearSummary.parse(topLevelActivities)).toThrow()

    const totalsRows = {
      ...summary,
      totals: { ...summary.totals, rows: richActivities() },
    }
    expect(() => YearSummary.parse(totalsRows)).toThrow()
  })
})

describe('YearSummary bounds', () => {
  const activityIn = (month: number, day: number): Activity => ({
    id: `${String(month)}-${String(day)}`,
    startLocal: at(month, day, 9),
    sport: 'run',
    sportRaw: 'Carrera',
    distanceM: 1000,
    movingTimeS: 1800,
    elapsedTimeS: 1800,
    elevationGainM: 0,
    avgHeartRate: null,
    maxHeartRate: null,
    avgPowerW: null,
    maxPowerW: null,
    weightedAvgPowerW: null,
    gear: null,
  })

  const honest = buildYearSummary([activityIn(1, 5), activityIn(2, 6), activityIn(3, 7)])

  it('accepts the honest summary it builds', () => {
    expect(YearSummary.safeParse(honest).success).toBe(true)
  })

  it('rejects a negative total distance', () => {
    const tampered = { ...honest, totals: { ...honest.totals, distanceM: -1 } }

    expect(YearSummary.safeParse(tampered).success).toBe(false)
  })

  it('rejects a negative distance in a monthly entry', () => {
    const profile = honest.monthlyProfile
    expect(profile).not.toBeNull()
    if (profile === null) {
      return
    }
    const months = profile.months.map((entry, index) =>
      index === 0 ? { ...entry, distanceM: -5 } : entry,
    )

    const tampered = { ...honest, monthlyProfile: { ...profile, months } }

    expect(YearSummary.safeParse(tampered).success).toBe(false)
  })
})
