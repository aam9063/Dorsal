/**
 * The two shareable cards of story 08 and how the segment toggle moves between
 * them (odd/tasks/h11b-season-cards.md, T8). The transition is a pure helper so
 * the radiogroup's arrow-key contract is pinned by a unit test without a DOM.
 */
export type CardSelection = 'dorsal' | 'carnet'

/** The cycle order of the toggle; the dorsal is the story's default. */
const ORDER: readonly CardSelection[] = ['dorsal', 'carnet']

/** The arrows a radio group honours, with their step through the cycle. */
const ARROW_STEPS: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

/**
 * The selection after the key: one step along the cycle for the four arrow
 * keys, wrap-around included, and no change for any other key.
 */
export function cycleCardSelection(current: CardSelection, key: string): CardSelection {
  const step = ARROW_STEPS[key] ?? 0
  if (step === 0) {
    return current
  }
  const index = ORDER.indexOf(current)
  return ORDER[(index + step + ORDER.length) % ORDER.length] ?? current
}
