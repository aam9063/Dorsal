import { describe, expect, it } from 'vitest'
import { quickValidate } from './quick-validation'

describe('main-thread quick validation', () => {
  it('accepts a reasonable activities.csv by name and size', () => {
    expect(quickValidate({ name: 'activities.csv', size: 300_000 })).toEqual({ kind: 'ok' })
  })

  it('accepts an uppercase extension', () => {
    expect(quickValidate({ name: 'ACTIVITIES.CSV', size: 1 })).toEqual({ kind: 'ok' })
  })

  it('rejects the zip of the export instead of guessing', () => {
    expect(quickValidate({ name: 'export.zip', size: 1 })).toEqual({ kind: 'extension' })
    expect(quickValidate({ name: 'activities.csv.zip', size: 1 })).toEqual({ kind: 'extension' })
  })

  it('rejects a file without a .csv extension', () => {
    expect(quickValidate({ name: 'activities', size: 1 })).toEqual({ kind: 'extension' })
  })

  it('accepts the documented 50 MB limit exactly', () => {
    const limit = 50 * 1024 * 1024
    expect(quickValidate({ name: 'activities.csv', size: limit })).toEqual({ kind: 'ok' })
  })

  it('rejects a file above the limit and reports the size', () => {
    const limit = 50 * 1024 * 1024
    expect(quickValidate({ name: 'activities.csv', size: limit + 1 })).toEqual({
      kind: 'size',
      sizeBytes: limit + 1,
    })
  })
})
