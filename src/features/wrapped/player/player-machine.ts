export interface PlayerState {
  /** Zero-based position in the list of available stories. */
  index: number
  paused: boolean
  closed: boolean
}

export type PlayerInput = 'next' | 'previous' | 'pause' | 'resume' | 'close'

/**
 * The single source of truth for the story player's inputs (BRIEF §7): tap
 * zones, keyboard and the automatic advance all send one of the five inputs
 * here instead of reimplementing the rules. The machine is told how many
 * stories are available on every transition so the index can never leave
 * `0 .. count - 1`: `next` at the last story does not wrap and `previous` at
 * the first stays at zero.
 */
export function initialPlayerState(count: number): PlayerState {
  return { index: clampIndex(0, count), paused: false, closed: false }
}

export function reducePlayer(state: PlayerState, input: PlayerInput, count: number): PlayerState {
  switch (input) {
    case 'next':
      return { ...state, index: clampIndex(state.index + 1, count) }
    case 'previous':
      return { ...state, index: clampIndex(state.index - 1, count) }
    case 'pause':
      return { ...state, paused: true }
    case 'resume':
      return { ...state, paused: false }
    case 'close':
      return { ...state, closed: true }
  }
}

function clampIndex(index: number, count: number): number {
  if (count <= 0) {
    return 0
  }
  return Math.min(Math.max(index, 0), count - 1)
}
