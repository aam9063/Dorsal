import { describe, expect, it } from 'vitest'
import { clampIndex, initialPlayerState, reducePlayer } from './player-machine'

const FOUR_STORIES = 4

describe('player machine', () => {
  it('starts on the first story, playing and not closed', () => {
    expect(initialPlayerState(FOUR_STORIES)).toEqual({ index: 0, paused: false, closed: false })
  })

  it('advances with next while stories remain', () => {
    let state = initialPlayerState(FOUR_STORIES)
    state = reducePlayer(state, 'next', FOUR_STORIES)
    expect(state.index).toBe(1)
    state = reducePlayer(state, 'next', FOUR_STORIES)
    state = reducePlayer(state, 'next', FOUR_STORIES)
    expect(state.index).toBe(3)
  })

  it('never returns an index outside 0 .. count - 1 for any input sequence', () => {
    let state = initialPlayerState(FOUR_STORIES)
    for (let step = 0; step < 10; step += 1) {
      state = reducePlayer(state, 'next', FOUR_STORIES)
      expect(state.index).toBeLessThanOrEqual(FOUR_STORIES - 1)
      expect(state.index).toBeGreaterThanOrEqual(0)
    }
    expect(state.index).toBe(FOUR_STORIES - 1)
    for (let step = 0; step < 10; step += 1) {
      state = reducePlayer(state, 'previous', FOUR_STORIES)
      expect(state.index).toBeLessThanOrEqual(FOUR_STORIES - 1)
      expect(state.index).toBeGreaterThanOrEqual(0)
    }
    expect(state.index).toBe(0)
  })

  it('does not wrap or advance past the last story', () => {
    const last = { index: 3, paused: false, closed: false }
    expect(reducePlayer(last, 'next', FOUR_STORIES)).toEqual(last)
  })

  it('stays at the first story when going back', () => {
    const first = initialPlayerState(FOUR_STORIES)
    expect(reducePlayer(first, 'previous', FOUR_STORIES)).toEqual(first)
  })

  it('pause and resume only change paused', () => {
    const playing = initialPlayerState(FOUR_STORIES)
    const paused = reducePlayer(playing, 'pause', FOUR_STORIES)
    expect(paused).toEqual({ index: 0, paused: true, closed: false })
    expect(reducePlayer(paused, 'resume', FOUR_STORIES)).toEqual(playing)
    expect(reducePlayer(paused, 'pause', FOUR_STORIES)).toEqual(paused)
  })

  it('navigation keeps the paused flag untouched', () => {
    const paused = reducePlayer(initialPlayerState(FOUR_STORIES), 'pause', FOUR_STORIES)
    const advanced = reducePlayer(paused, 'next', FOUR_STORIES)
    expect(advanced).toEqual({ index: 1, paused: true, closed: false })
  })

  it('close marks the player closed and keeps the position', () => {
    const playing = { index: 2, paused: false, closed: false }
    expect(reducePlayer(playing, 'close', FOUR_STORIES)).toEqual({
      index: 2,
      paused: false,
      closed: true,
    })
  })

  it('is safe on a player without stories', () => {
    let state = initialPlayerState(0)
    expect(state.index).toBe(0)
    state = reducePlayer(state, 'next', 0)
    state = reducePlayer(state, 'previous', 0)
    state = reducePlayer(state, 'pause', 0)
    expect(state).toEqual({ index: 0, paused: true, closed: false })
  })

  it('does not close when opening an empty player and closing it', () => {
    const state = reducePlayer(initialPlayerState(0), 'close', 0)
    expect(state.closed).toBe(true)
  })

  describe('render-time clamp', () => {
    it('clamps an index past the end of the available list to the last story', () => {
      expect(clampIndex(7, 3)).toBe(2)
      expect(clampIndex(3, 3)).toBe(2)
    })

    it('keeps a valid index untouched so the clamp cannot change navigation', () => {
      expect(clampIndex(1, 3)).toBe(1)
      expect(clampIndex(0, 1)).toBe(0)
    })

    it('resolves to the last available story rather than nothing when the count shrinks', () => {
      // The state index survives a shrinking available list after mount; the
      // render must index the list with the clamped value, never past its end.
      const shrunkenCount = 2
      expect(clampIndex(3, shrunkenCount)).toBe(shrunkenCount - 1)
    })
  })
})
