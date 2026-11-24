import { describe, expect, it } from 'vitest'
import type { Activity, PlainDateTime } from '../model'
import { archetype } from './archetype'

function at(month: number, day: number, hour = 10): PlainDateTime {
  return { year: 2026, month, day, hour, minute: 0, second: 0 }
}

function activity(
  values: Partial<Omit<Activity, 'startLocal'>> & { startLocal: PlainDateTime },
): Activity {
  return {
    id: 'a',
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
    ...values,
  }
}

/** Weekday triples: three days in each of three Monday-based weeks of January. */
const THREE_PER_WEEK_DAYS = [
  at(1, 5),
  at(1, 6),
  at(1, 7),
  at(1, 12),
  at(1, 13),
  at(1, 14),
  at(1, 19),
  at(1, 20),
  at(1, 21),
  at(1, 22),
]

const WEEKEND_DAYS = [
  at(1, 3),
  at(1, 4),
  at(1, 10),
  at(1, 11),
  at(1, 17),
  at(1, 18),
  at(1, 24),
  at(1, 25),
  at(1, 31),
  at(2, 1),
]

describe('archetype', () => {
  it('picks earlyBird at exactly the 0.50 early-start share and keeps steady as secondary', () => {
    const season = THREE_PER_WEEK_DAYS.map((startLocal, index) =>
      activity({
        id: `a${index}`,
        startLocal: index < 5 ? at(startLocal.month, startLocal.day, 6) : startLocal,
      }),
    )

    const result = archetype(season)

    expect(result).not.toBeNull()
    expect(result?.primary).toBe('earlyBird')
    expect(result?.secondary).toBe('steady')
    expect(result?.startHours).toHaveLength(24)
    expect(result?.startHours[6]).toBe(5)
    expect(result?.startHours[10]).toBe(5)
    expect(result?.startHours.filter((count) => count > 0)).toHaveLength(2)
  })

  it('picks weekendWarrior when weekend moving time reaches 0.60 and early starts stay below 0.50', () => {
    const season = WEEKEND_DAYS.map((startLocal, index) =>
      activity({
        id: `a${index}`,
        startLocal:
          index < 4
            ? at(startLocal.month, startLocal.day, 6)
            : at(startLocal.month, startLocal.day, 9),
        movingTimeS: 1800,
      }),
    )

    const result = archetype(season)

    expect(result?.primary).toBe('weekendWarrior')
    expect(result?.secondary).toBe('steady')
  })

  it('picks nightOwl when at least 0.40 of starts are after 20:00', () => {
    const season = THREE_PER_WEEK_DAYS.map((startLocal, index) =>
      activity({
        id: `a${index}`,
        startLocal:
          index < 4
            ? at(startLocal.month, startLocal.day, 21)
            : at(startLocal.month, startLocal.day, 9),
      }),
    )

    const result = archetype(season)

    expect(result?.primary).toBe('nightOwl')
    expect(result?.secondary).toBe('steady')
  })

  it('picks methodical when every week with activity has at least four active days', () => {
    const season = [
      at(1, 5),
      at(1, 6),
      at(1, 7),
      at(1, 8),
      at(1, 9),
      at(1, 12),
      at(1, 13),
      at(1, 14),
      at(1, 15),
      at(1, 16),
    ].map((startLocal, index) => activity({ id: `a${index}`, startLocal }))

    const result = archetype(season)

    expect(result?.primary).toBe('methodical')
    expect(result?.secondary).toBe('steady')
  })

  it('picks multisport when four sports each carry at least 0.10 of moving time', () => {
    const sports = ['run', 'ride', 'swim', 'walk'] as const
    const season = THREE_PER_WEEK_DAYS.map((startLocal, index) =>
      activity({ id: `a${index}`, startLocal, sport: sports[index % 4]! }),
    )

    const result = archetype(season)

    expect(result?.primary).toBe('multisport')
    expect(result?.secondary).toBe('steady')
  })

  it('picks longDistance when the median moving time reaches 75 minutes', () => {
    const season = THREE_PER_WEEK_DAYS.map((startLocal, index) =>
      activity({ id: `a${index}`, startLocal, movingTimeS: 4800 }),
    )

    const result = archetype(season)

    expect(result?.primary).toBe('longDistance')
    expect(result?.secondary).toBe('steady')
  })

  it('falls back to steady when only the fallback matches, using the odd median', () => {
    // Eleven activities: ten short ones and one outlier. With eleven values the
    // median is the middle value (1800), not the average of the middle two.
    const season = [...THREE_PER_WEEK_DAYS, at(1, 23)].map((startLocal, index) =>
      activity({ id: `a${index}`, startLocal, movingTimeS: index === 10 ? 4800 : 1800 }),
    )

    const result = archetype(season)

    expect(result?.primary).toBe('steady')
    expect(result?.secondary).toBe('steady')
  })

  it('uses the next matching rule as the secondary trait instead of steady', () => {
    const season = THREE_PER_WEEK_DAYS.map((startLocal, index) =>
      activity({
        id: `a${index}`,
        startLocal: index < 6 ? at(startLocal.month, startLocal.day, 6) : startLocal,
        movingTimeS: 4800,
      }),
    )

    const result = archetype(season)

    expect(result?.primary).toBe('earlyBird')
    expect(result?.secondary).toBe('longDistance')
  })

  it('returns null with fewer than ten activities', () => {
    const season = THREE_PER_WEEK_DAYS.slice(1).map((startLocal, index) =>
      activity({ id: `a${index}`, startLocal }),
    )

    expect(season).toHaveLength(9)
    expect(archetype(season)).toBeNull()
  })
})

describe('archetype boundaries', () => {
  const atTime = (day: number, hour: number, minute: number, second: number): PlainDateTime => ({
    year: 2026,
    month: 6,
    day,
    hour,
    minute,
    second,
  })

  const seasonOf = (special: readonly PlainDateTime[]): Activity[] =>
    Array.from({ length: 10 }, (_, index) =>
      activity({
        id: `b${String(index)}`,
        startLocal: special[index] ?? atTime(index + 1, 12, 0, 0),
      }),
    )

  it('does not call a start exactly at 20:00:00 "after 20:00", and does call 20:00:01', () => {
    const exactlyTwenty = seasonOf([1, 2, 3, 4].map((day) => atTime(day, 20, 0, 0)))
    expect(archetype(exactlyTwenty)?.primary).not.toBe('nightOwl')

    const oneSecondLater = seasonOf([1, 2, 3, 4].map((day) => atTime(day, 20, 0, 1)))
    expect(archetype(oneSecondLater)?.primary).toBe('nightOwl')
  })

  it('does not call a start exactly at 08:00:00 "before 08:00", and does call 07:59:59', () => {
    const exactlyEight = seasonOf([1, 2, 3, 4, 5].map((day) => atTime(day, 8, 0, 0)))
    expect(archetype(exactlyEight)?.primary).not.toBe('earlyBird')

    const justBefore = seasonOf([1, 2, 3, 4, 5].map((day) => atTime(day, 7, 59, 59)))
    expect(archetype(justBefore)?.primary).toBe('earlyBird')
  })
})
