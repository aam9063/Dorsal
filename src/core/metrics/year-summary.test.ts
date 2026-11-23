import { describe, expect, it } from 'vitest'
import { YearSummary } from '../model/year-summary'
import type { Activity, PlainDateTime } from '../model'
import { buildYearSummary } from './build-year-summary'

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

function withMonths(activities: Activity[], monthFor: (index: number) => number): Activity[] {
  return activities.map((activity, index) => ({
    ...activity,
    startLocal: { ...activity.startLocal, month: monthFor(index) },
  }))
}

describe('buildYearSummary and the YearSummary schema', () => {
  it('assembles every section with all thresholds met and marks nothing short', () => {
    const summary = buildYearSummary(richActivities())

    expect(summary.availability).toEqual({
      monthlyProfile: true,
      archetype: true,
      gear: true,
      heartbeats: true,
      shortVersion: false,
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
