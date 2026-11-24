import type { Activity } from '../model'
import type { YearSummary } from '../model/year-summary'
import { archetype } from './archetype'
import { bibCard } from './bib-card'
import { consistency } from './consistency'
import { gearOfTheYear } from './gear-of-the-year'
import { heartbeats } from './heartbeats'
import { monthlyProfile } from './monthly-profile'
import { powerProfile } from './power-profile'
import { seasonBests } from './season-bests'
import { sportBreakdown } from './sport-breakdown'
import { totals } from './totals'
import { weeklyLoad } from './weekly-load'

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
  const sportBreakdownSection = sportBreakdown(activities)
  const weeklyLoadSection = weeklyLoad(activities)
  const seasonBestsSection = seasonBests(activities)
  const powerProfileSection = powerProfile(activities)

  return {
    totals: totalsSection,
    monthlyProfile: monthlyProfileSection,
    consistency: consistencySection,
    archetype: archetypeSection,
    gear: gearSection,
    heartbeats: heartbeatsSection,
    bibCard: bibCard(activities),
    sportBreakdown: sportBreakdownSection.length === 0 ? null : { sports: sportBreakdownSection },
    weeklyLoad: weeklyLoadSection,
    seasonBests: seasonBestsSection,
    powerProfile: powerProfileSection,
    availability: {
      monthlyProfile: monthlyProfileSection !== null,
      archetype: archetypeSection !== null,
      gear: gearSection !== null,
      heartbeats: heartbeatsSection !== null,
      seasonCards: weeklyLoadSection !== null,
      powerProfile: powerProfileSection !== null,
      shortVersion: totalsSection.activityCount < 5,
    },
  }
}
