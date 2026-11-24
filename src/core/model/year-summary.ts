import { z } from 'zod'

const SPORT_KINDS = ['run', 'ride', 'swim', 'walk', 'hike', 'other'] as const
const ARCHETYPE_IDS = [
  'earlyBird',
  'nightOwl',
  'weekendWarrior',
  'methodical',
  'multisport',
  'longDistance',
  'steady',
] as const

const monthSchema = z.number().int().min(1).max(12)
const daySchema = z.number().int().min(1).max(31)
const monthDaySchema = z.strictObject({ month: monthSchema, day: daySchema })
const monthDistanceSchema = z.strictObject({ month: monthSchema, distanceM: z.number().min(0) })
const weekNumberSchema = z.number().int().min(1).max(53)
const shareSchema = z.number().min(0).max(1)
const monthlyPowerWindowSchema = z.strictObject({
  month: monthSchema,
  bestWeightedAvgPowerW: z.number().min(0).nullable(),
  bestMaxPowerW: z.number().min(0).nullable(),
  activityCount: z.number().int().min(1),
  sessionsWithPower: z.number().int().min(0),
  coverage: shareSchema,
})

/**
 * The worker-to-UI contract of the whole season: **only 2026 aggregates**
 * travel through it (AGENTS.md §5.1), never per-activity rows and never data
 * from another year. Every section is `null` exactly when its own threshold in
 * `odd/tasks/h03-metrics.md` is not met, and `availability` carries that
 * mapping so the story player of H-07 never re-derives thresholds.
 *
 * Every object is a `strictObject`, so an object carrying a per-activity array
 * under any key is rejected at parse time; tests prove this. `shortVersion` is
 * true below the five-activity season threshold.
 */
export const YearSummary = z.strictObject({
  totals: z.strictObject({
    distanceM: z.number().min(0),
    movingTimeS: z.number().min(0),
    activityCount: z.number().int().min(0),
    activeDays: z.number().int().min(0),
    elevationGainM: z.number().min(0),
    bySport: z.array(
      z.strictObject({
        sport: z.enum(SPORT_KINDS),
        movingTimeS: z.number().min(0),
        share: z.number().min(0).max(1),
      }),
    ),
    trackLaps: z.number().min(0),
    everests: z.number().min(0),
  }),
  monthlyProfile: z
    .strictObject({
      months: z.array(monthDistanceSchema).length(12),
      peak: monthDistanceSchema,
      valley: monthDistanceSchema,
      comeback: z.number().min(0).nullable(),
    })
    .nullable(),
  consistency: z
    .strictObject({
      heatmap: z.array(
        z.strictObject({
          month: monthSchema,
          day: daySchema,
          movingTimeS: z.number().min(0),
          level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        }),
      ),
      longestStreak: z.strictObject({
        days: z.number().int().min(0),
        from: monthDaySchema.nullable(),
        to: monthDaySchema.nullable(),
      }),
      favoriteWeekday: z.strictObject({
        weekday: z.number().int().min(0).max(6),
        weeks: z.number().int().min(0),
      }),
    })
    .nullable(),
  archetype: z
    .strictObject({
      primary: z.enum(ARCHETYPE_IDS),
      secondary: z.enum(ARCHETYPE_IDS),
      startHours: z.array(z.number().int().min(0)).length(24),
    })
    .nullable(),
  gear: z
    .strictObject({
      items: z.array(
        z.strictObject({
          name: z.string(),
          distanceM: z.number().min(0),
          movingTimeS: z.number().min(0),
          activityCount: z.number().int().min(0),
          needsRetiring: z.boolean(),
        }),
      ),
      star: z.string().nullable(),
      showsBikes: z.boolean(),
    })
    .nullable(),
  heartbeats: z
    .strictObject({
      beats: z.number().min(0),
      restingDays: z.number().min(0),
      peak: z
        .strictObject({ bpm: z.number().min(0), month: monthSchema, day: daySchema })
        .nullable(),
      coverage: z.number().min(0).max(1),
    })
    .nullable(),
  bibCard: z.strictObject({
    number: z.number().int().min(0),
    distanceKm: z.number().min(0),
    monthlyDistanceM: z.array(z.number().min(0)).length(12),
  }),
  /** Season-card sections of H-11b; each is `null` exactly when the season shows nothing for it. */
  sportBreakdown: z
    .strictObject({
      /** One entry per sport present, ordered by `movingTimeS` descending (S8). */
      sports: z.array(
        z.strictObject({
          sport: z.enum(SPORT_KINDS),
          activityCount: z.number().int().min(1),
          distanceM: z.number().min(0),
          movingTimeS: z.number().min(0),
          elevationGainM: z.number().min(0),
          share: shareSchema,
        }),
      ),
    })
    .nullable(),
  weeklyLoad: z
    .strictObject({
      /** ISO weeks with at least one activity, ordered ascending by `(isoYear, isoWeek)`. */
      weeks: z.array(
        z.strictObject({
          isoYear: z.number().int(),
          isoWeek: weekNumberSchema,
          monday: monthDaySchema,
          activityCount: z.number().int().min(1),
          distanceM: z.number().min(0),
        }),
      ),
      best: z
        .strictObject({
          isoYear: z.number().int(),
          isoWeek: weekNumberSchema,
          monday: monthDaySchema,
          activityCount: z.number().int().min(1),
          distanceM: z.number().min(0),
        })
        .nullable(),
      longestFulfilledStreak: z.number().int().min(0),
    })
    .nullable(),
  seasonBests: z
    .strictObject({
      longestSessionByDistance: z
        .strictObject({ distanceM: z.number().min(0), month: monthSchema, day: daySchema })
        .nullable(),
      biggestElevationDay: z
        .strictObject({ elevationGainM: z.number().min(0), month: monthSchema, day: daySchema })
        .nullable(),
      bestWeek: z
        .strictObject({
          distanceM: z.number().min(0),
          isoWeek: weekNumberSchema,
          monday: monthDaySchema,
        })
        .nullable(),
    })
    .nullable(),
  powerProfile: z
    .strictObject({
      /** Months with at least one activity, ordered ascending. */
      months: z.array(monthlyPowerWindowSchema).min(1),
      totals: z.strictObject({
        bestWeightedAvgPowerW: z.number().min(0).nullable(),
        bestMaxPowerW: z.number().min(0).nullable(),
        activityCount: z.number().int().min(1),
        sessionsWithPower: z.number().int().min(0),
        coverage: shareSchema,
      }),
    })
    .nullable(),
  availability: z.strictObject({
    monthlyProfile: z.boolean(),
    archetype: z.boolean(),
    gear: z.boolean(),
    heartbeats: z.boolean(),
    /** The season card (carnet de temporada) can show its panels. */
    seasonCards: z.boolean(),
    /** At least one 2026 activity carries any watt, so the power panel exists. */
    powerProfile: z.boolean(),
    shortVersion: z.boolean(),
  }),
})

export type YearSummary = z.infer<typeof YearSummary>
