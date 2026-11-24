import type { ReactElement } from 'react'
import type { YearSummary } from '../../../core/model/year-summary'
import type { StoryDefinition } from './registry'
import { PortadaStory } from './01-portada/portada-story'
import { NumerosStory } from './02-numeros/numeros-story'
import { PerfilStory } from './03-perfil/perfil-story'
import { ConstanciaStory } from './04-constancia/constancia-story'
import { ArquetipoStory } from './05-arquetipo/arquetipo-story'
import { MaterialStory } from './06-material/material-story'
import { LatidosStory } from './07-latidos/latidos-story'

/**
 * Maps a story id to its component. It lives here, not in the player, so the
 * player stays generic (odd/tasks/h07-story-player.md, decision 1) and adding
 * a story never touches the player.
 */
const CONTENT: Record<string, (summary: YearSummary) => ReactElement> = {
  '01-portada': (summary) => <PortadaStory summary={summary} />,
  '02-numeros': (summary) => <NumerosStory summary={summary} />,
  '03-perfil': (summary) => <PerfilStory summary={summary} />,
  '04-constancia': (summary) => <ConstanciaStory summary={summary} />,
  '05-arquetipo': (summary) => <ArquetipoStory summary={summary} />,
  '06-material': (summary) => <MaterialStory summary={summary} />,
  '07-latidos': (summary) => <LatidosStory summary={summary} />,
}

export function StoryContent({ story, summary }: { story: StoryDefinition; summary: YearSummary }) {
  const render = CONTENT[story.id]
  return render === undefined ? null : render(summary)
}
