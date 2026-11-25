import type { YearSummary } from '../../../core/model/year-summary'
import type { t } from '../../../shared/i18n'

/**
 * Reading budget (ms) of the automatic advance of BRIEF §7: one per story,
 * because what the reader has to read differs a lot between screens. The
 * portada stays on the 7000 ms base that `e2e/player.spec.ts` pins: its hold
 * and `prefers-reduced-motion` tests measure the elapsed time of story 01.
 */
export const AUTO_ADVANCE_BASE_MS = 7000

const PORTADA_AUTO_ADVANCE_MS = AUTO_ADVANCE_BASE_MS
/** Hero number, laps paragraph, two stats, elevation, three or four sport rows. */
const NUMEROS_AUTO_ADVANCE_MS = 13000
/** Profile chart with an intro and a twelve-month axis. */
const PERFIL_AUTO_ADVANCE_MS = 9000
/** Twelve-month heatmap, a legend and two supporting panels. */
const CONSTANCIA_AUTO_ADVANCE_MS = 11000
/** Radial clock with hour labels, a caption and two archetype chips. */
const ARQUETIPO_AUTO_ADVANCE_MS = 10000
/** Star gear plus the three-row ranked list. */
const MATERIAL_AUTO_ADVANCE_MS = 9000
/** Hero number, decorative line and three reading blocks. */
const LATIDOS_AUTO_ADVANCE_MS = 10000
/** The card stays; the last story never auto-advances, so the budget is nominal. */
const DORSAL_AUTO_ADVANCE_MS = 10000

/**
 * One entry of the story registry (BRIEF §6). The player knows nothing about
 * any specific story: it renders whatever `availableStories` keeps, one
 * progress bar per kept story. Adding a story is one registry line, so an
 * omitted story adjusts the bars by construction.
 */
export interface StoryDefinition {
  id: string
  titleKey: keyof typeof t.stories
  isAvailable: (summary: YearSummary) => boolean
  /** Reading budget of the automatic advance; omitted stories use the base. */
  autoAdvanceMs?: number
}

/** The stories the player can show for this summary, in registry order. */
export function availableStories(
  stories: readonly StoryDefinition[],
  summary: YearSummary,
): StoryDefinition[] {
  return stories.filter((story) => story.isAvailable(summary))
}

export const STORIES: readonly StoryDefinition[] = [
  {
    id: '01-portada',
    titleKey: '01-portada',
    isAvailable: () => true,
    autoAdvanceMs: PORTADA_AUTO_ADVANCE_MS,
  },
  // 02, 04 and 08 are never omitted; 03, 05, 06 and 07 follow their BRIEF §6 thresholds.
  // Each omitted story is one missing line, so the bars adjust by construction
  // (odd/tasks/h07-story-player.md, decision 1).
  {
    id: '02-numeros',
    titleKey: '02-numeros',
    isAvailable: () => true,
    autoAdvanceMs: NUMEROS_AUTO_ADVANCE_MS,
  },
  {
    id: '03-perfil',
    titleKey: '03-perfil',
    isAvailable: (summary) => summary.availability.monthlyProfile,
    autoAdvanceMs: PERFIL_AUTO_ADVANCE_MS,
  },
  {
    id: '04-constancia',
    titleKey: '04-constancia',
    isAvailable: () => true,
    autoAdvanceMs: CONSTANCIA_AUTO_ADVANCE_MS,
  },
  {
    id: '05-arquetipo',
    titleKey: '05-arquetipo',
    isAvailable: (summary) => summary.availability.archetype,
    autoAdvanceMs: ARQUETIPO_AUTO_ADVANCE_MS,
  },
  {
    id: '06-material',
    titleKey: '06-material',
    isAvailable: (summary) => summary.availability.gear,
    autoAdvanceMs: MATERIAL_AUTO_ADVANCE_MS,
  },
  {
    id: '07-latidos',
    titleKey: '07-latidos',
    isAvailable: (summary) => summary.availability.heartbeats,
    autoAdvanceMs: LATIDOS_AUTO_ADVANCE_MS,
  },
  {
    id: '08-dorsal',
    titleKey: '08-dorsal',
    isAvailable: () => true,
    autoAdvanceMs: DORSAL_AUTO_ADVANCE_MS,
  },
]
