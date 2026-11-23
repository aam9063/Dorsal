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
const monthDistanceSchema = z.strictObject({ month: monthSchema, distanceM: z.number() })

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
    distanceM: z.number(),
    movingTimeS: z.number(),
    activityCount: z.number().int().min(0),
    activeDays: z.number().int().min(0),
    elevationGainM: z.number(),
    bySport: z.array(
      z.strictObject({
        sport: z.enum(SPORT_KINDS),
        movingTimeS: z.number(),
        share: z.number(),
      }),
    ),
    trackLaps: z.number(),
    everests: z.number(),
  }),
  monthlyProfile: z
    .strictObject({
      months: z.array(monthDistanceSchema).length(12),
      peak: monthDistanceSchema,
      valley: monthDistanceSchema,
      comeback: z.number().nullable(),
    })
    .nullable(),
  consistency: z
    .strictObject({
      heatmap: z.array(
        z.strictObject({
          month: monthSchema,
          day: daySchema,
          movingTimeS: z.number(),
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
          distanceM: z.number(),
          movingTimeS: z.number(),
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
      beats: z.number(),
      restingDays: z.number(),
      peak: z.strictObject({ bpm: z.number(), month: monthSchema, day: daySchema }).nullable(),
      coverage: z.number(),
    })
    .nullable(),
  bibCard: z.strictObject({
    number: z.number().int(),
    distanceKm: z.number(),
    monthlyDistanceM: z.array(z.number()).length(12),
  }),
  availability: z.strictObject({
    monthlyProfile: z.boolean(),
    archetype: z.boolean(),
    gear: z.boolean(),
    heartbeats: z.boolean(),
    shortVersion: z.boolean(),
  }),
})

export type YearSummary = z.infer<typeof YearSummary>
