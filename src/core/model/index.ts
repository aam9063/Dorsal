import type { PlainDateTime } from '../time'

export type { PlainDateTime } from '../time'

/** Normalized sport of an activity; anything the map does not know is `other`. */
export type SportKind = 'run' | 'ride' | 'swim' | 'walk' | 'hike' | 'other'

/** One kept 2026 activity, already free of raw CSV strings it must not carry. */
export interface Activity {
  id: string
  startLocal: PlainDateTime
  sport: SportKind
  sportRaw: string
  distanceM: number | null
  movingTimeS: number
  elapsedTimeS: number
  elevationGainM: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  gear: string | null
}

/**
 * Spanish sport labels verified in `docs/export-format.md`, mapped to their
 * normalized kind. Any label absent here maps to `other` via
 * {@link sportForEsLabel}; it never throws and the raw label is preserved by
 * the reader in `sportRaw`.
 */
export const ES_SPORT_KINDS_BY_LABEL: Readonly<Record<string, SportKind>> = {
  Carrera: 'run',
  Bicicleta: 'ride',
  'Bicicleta virtual': 'ride',
  Caminata: 'walk',
  Senderismo: 'hike',
  Natación: 'swim',
}

export function sportForEsLabel(label: string): SportKind {
  return ES_SPORT_KINDS_BY_LABEL[label] ?? 'other'
}
