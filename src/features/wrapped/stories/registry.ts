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
  // 02 to 08 plug in here, one line each (BRIEF §6; odd/tasks/h07-story-player.md, decision 1).
  { id: '01-portada', titleKey: '01-portada', isAvailable: () => true },
]
