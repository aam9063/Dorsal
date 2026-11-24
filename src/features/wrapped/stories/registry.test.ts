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

  it('omits story 06 exactly when the gear is unavailable', () => {
    const withoutGear = availableStories(STORIES, summaryWith({ gear: false }))
    expect(withoutGear.map((story) => story.id)).toEqual([
      '01-portada',
      '02-numeros',
      '04-constancia',
    ])
    const withGear = availableStories(STORIES, summaryWith({ gear: true }))
    expect(withGear.map((story) => story.id)).toContain('06-material')
  })

  it('omits story 05 exactly when the archetype is unavailable', () => {
    const withoutArchetype = availableStories(STORIES, summaryWith({ archetype: false }))
    expect(withoutArchetype.map((story) => story.id)).not.toContain('05-arquetipo')
    const withArchetype = availableStories(STORIES, summaryWith({ archetype: true }))
    expect(withArchetype.map((story) => story.id)).toContain('05-arquetipo')
  })

  it('omits story 07 exactly when the heartbeats are unavailable', () => {
    const withoutHeartbeats = availableStories(STORIES, summaryWith({ heartbeats: false }))
    expect(withoutHeartbeats.map((story) => story.id)).not.toContain('07-latidos')
    const withHeartbeats = availableStories(STORIES, summaryWith({ heartbeats: true }))
    expect(withHeartbeats.map((story) => story.id)).toContain('07-latidos')
  })

  it('keeps the registry in story order', () => {
    expect(STORIES.map((story) => story.id)).toEqual([
      '01-portada',
      '02-numeros',
      '03-perfil',
      '04-constancia',
      '05-arquetipo',
      '06-material',
      '07-latidos',
    ])
  })
})
