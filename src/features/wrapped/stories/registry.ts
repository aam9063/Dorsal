import type { YearSummary } from '../../../core/model/year-summary'
import type { t } from '../../../shared/i18n'

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
}

/** The stories the player can show for this summary, in registry order. */
export function availableStories(
  stories: readonly StoryDefinition[],
  summary: YearSummary,
): StoryDefinition[] {
  return stories.filter((story) => story.isAvailable(summary))
}

export const STORIES: readonly StoryDefinition[] = [
  { id: '01-portada', titleKey: '01-portada', isAvailable: () => true },
  // 02 and 04 are never omitted; 03, 05, 06 and 07 follow their BRIEF §6 thresholds.
  // 08 plugs in here, one line (odd/tasks/h07-story-player.md, decision 1).
  { id: '02-numeros', titleKey: '02-numeros', isAvailable: () => true },
  {
    id: '03-perfil',
    titleKey: '03-perfil',
    isAvailable: (summary) => summary.availability.monthlyProfile,
  },
  { id: '04-constancia', titleKey: '04-constancia', isAvailable: () => true },
  {
    id: '05-arquetipo',
    titleKey: '05-arquetipo',
    isAvailable: (summary) => summary.availability.archetype,
  },
  {
    id: '06-material',
    titleKey: '06-material',
    isAvailable: (summary) => summary.availability.gear,
  },
  {
    id: '07-latidos',
    titleKey: '07-latidos',
    isAvailable: (summary) => summary.availability.heartbeats,
  },
]
