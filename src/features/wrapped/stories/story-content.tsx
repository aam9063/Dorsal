import type { ReactElement } from 'react'
import type { YearSummary } from '../../../core/model/year-summary'
import type { StoryDefinition } from './registry'
import { PortadaStory } from './01-portada/portada-story'

/**
 * Maps a story id to its component. It lives here, not in the player, so the
 * player stays generic (odd/tasks/h07-story-player.md, decision 1) and adding
 * a story never touches the player.
 */
const CONTENT: Record<string, (summary: YearSummary) => ReactElement> = {
  '01-portada': (summary) => <PortadaStory summary={summary} />,
}

export function StoryContent({ story, summary }: { story: StoryDefinition; summary: YearSummary }) {
  const render = CONTENT[story.id]
  return render === undefined ? null : render(summary)
}
