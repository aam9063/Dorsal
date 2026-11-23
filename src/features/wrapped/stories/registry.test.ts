import { describe, expect, it } from 'vitest'
import { buildYearSummary } from '../../../core/metrics/build-year-summary'
import type { YearSummary } from '../../../core/model/year-summary'
import { availableStories, type StoryDefinition, STORIES } from './registry'

function summaryWith(overrides: Partial<YearSummary['availability']>): YearSummary {
  const summary = buildYearSummary([])
  return { ...summary, availability: { ...summary.availability, ...overrides } }
}

describe('story registry', () => {
  it('offers stories 01, 02 and 04 for every summary, including an empty season', () => {
    const summary = buildYearSummary([])
    expect(availableStories(STORIES, summary).map((story) => story.id)).toEqual([
      '01-portada',
      '02-numeros',
      '04-constancia',
    ])
    expect(
      availableStories(STORIES, summaryWith({ archetype: false, gear: false })).map(
        (story) => story.id,
      ),
    ).toEqual(['01-portada', '02-numeros', '04-constancia'])
  })

  it('omits story 03 exactly when the monthly profile is unavailable', () => {
    const withoutProfile = availableStories(STORIES, summaryWith({ monthlyProfile: false }))
    expect(withoutProfile.map((story) => story.id)).toEqual([
      '01-portada',
      '02-numeros',
      '04-constancia',
    ])
    const withProfile = availableStories(STORIES, summaryWith({ monthlyProfile: true }))
    expect(withProfile.map((story) => story.id)).toEqual([
      '01-portada',
      '02-numeros',
      '03-perfil',
      '04-constancia',
    ])
  })

  it('skips an unavailable story so the bar count shrinks', () => {
    const stories: readonly StoryDefinition[] = [
      { id: 'a', titleKey: '01-portada', isAvailable: () => true },
      { id: 'b', titleKey: '01-portada', isAvailable: () => false },
      { id: 'c', titleKey: '01-portada', isAvailable: () => true },
    ]
    const summary = buildYearSummary([])

    const available = availableStories(stories, summary)

    expect(available.map((story) => story.id)).toEqual(['a', 'c'])
    expect(available).toHaveLength(2)
    expect(available.length).toBeLessThan(stories.length)
  })

  it('keeps the registry in story order', () => {
    expect(STORIES.map((story) => story.id)).toEqual([
      '01-portada',
      '02-numeros',
      '03-perfil',
      '04-constancia',
    ])
  })
})
