import { describe, expect, it } from 'vitest'
import { cycleCardSelection, type CardSelection } from './card-selection'

/**
 * The toggle of story 08 is a real radiogroup: the arrow keys move the
 * selection and the focus follows it, with wrap-around at both ends, which is
 * what the WAI-ARIA radio group pattern requires of a two-option group. The
 * transition itself lives in this pure helper so the keyboard contract is
 * pinned without a DOM.
 */
describe('card selection cycling', () => {
  it('moves forward to the carnet and wraps back to the dorsal', () => {
    expect(cycleCardSelection('dorsal', 'ArrowRight')).toBe('carnet')
    expect(cycleCardSelection('carnet', 'ArrowRight')).toBe('dorsal')
  })

  it('moves backward to the dorsal and wraps to the carnet', () => {
    expect(cycleCardSelection('carnet', 'ArrowLeft')).toBe('dorsal')
    expect(cycleCardSelection('dorsal', 'ArrowLeft')).toBe('carnet')
  })

  it('treats the vertical arrows like the horizontal ones', () => {
    expect(cycleCardSelection('dorsal', 'ArrowDown')).toBe('carnet')
    expect(cycleCardSelection('carnet', 'ArrowUp')).toBe('dorsal')
  })

  it('keeps any other key from changing the selection', () => {
    for (const key of ['Tab', 'Enter', ' ', 'Home']) {
      for (const current of ['dorsal', 'carnet'] as const satisfies readonly CardSelection[]) {
        expect(cycleCardSelection(current, key)).toBe(current)
      }
    }
  })
})
