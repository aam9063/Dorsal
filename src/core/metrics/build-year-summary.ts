import type { Activity } from '../model'
import type { YearSummary } from '../model/year-summary'
import { archetype } from './archetype'
import { bibCard } from './bib-card'
import { consistency } from './consistency'
import { gearOfTheYear } from './gear-of-the-year'
import { heartbeats } from './heartbeats'
import { monthlyProfile } from './monthly-profile'
import { totals } from './totals'

/**
 * Assembles the whole `YearSummary` the worker returns: one call per metric
 * plus the availability map the story player consumes. Every availability
 * flag is `section !== null` and `shortVersion` is true below five activities
 * (BRIEF §6). The worker boundary validates the result with the Zod schema in
 * `src/core/model/year-summary.ts`.
 */
export function buildYearSummary(activities: readonly Activity[]): YearSummary {
  const totalsSection = totals(activities)
  const monthlyProfileSection = monthlyProfile(activities)
  const consistencySection = consistency(activities)
  const archetypeSection = archetype(activities)
  const gearSection = gearOfTheYear(activities)
  const heartbeatsSection = heartbeats(activities)

  return {
    totals: totalsSection,
    monthlyProfile: monthlyProfileSection,
    consistency: consistencySection,
    archetype: archetypeSection,
    gear: gearSection,
    heartbeats: heartbeatsSection,
    bibCard: bibCard(activities),
    availability: {
      monthlyProfile: monthlyProfileSection !== null,
      archetype: archetypeSection !== null,
      gear: gearSection !== null,
      heartbeats: heartbeatsSection !== null,
      shortVersion: totalsSection.activityCount < 5,
    },
  }
}
