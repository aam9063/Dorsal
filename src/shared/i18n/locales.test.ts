import { describe, expect, it } from 'vitest'
import {
  en,
  archetypePeakSentence,
  fulfilledWeeksSentence,
  heartbeatCoverageSentence,
  heartbeatPeakDate,
  resultCorruptWarning,
  uploadNoSeasonMessage,
  uploadUnsupportedMessage,
} from './en'
import { es } from './es'

interface CollectedString {
  path: string
  text: string
}

function collectStrings(value: unknown, path: string[] = []): CollectedString[] {
  if (typeof value === 'string') {
    return [{ path: path.join('.'), text: value }]
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, [...path, String(index)]))
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, child]) => collectStrings(child, [...path, key]))
  }
  return []
}

/**
 * The one en key the Spanish-shaped sentence pieces cannot fill: the streak
 * range is assembled by a fixed Spanish grammar (`from to of month`), so the
 * English connector is intentionally empty and the pieces read
 * "from 12 January to 3 February" once the double spaces collapse in HTML.
 * The English stories restructure these pieces in their own task.
 */
const EMPTY_ALLOWED = new Set(['stories.04-constancia.streakDe'])

/**
 * The key set is closed (odd/tasks/i18n-english.md, decision 2): `es.ts` is
 * the source of truth for the shape and `en.ts` must expose exactly the same
 * keys. The `Messages` type makes a missing or extra key a compile error;
 * this test proves the same contract regardless of how the type reaches the
 * module.
 */
describe('locale parity', () => {
  it('exposes exactly the same key set as the Spanish copy', () => {
    expect(collectStrings(en).map((entry) => entry.path)).toEqual(
      collectStrings(es).map((entry) => entry.path),
    )
  })

  it('has at least one hundred strings, so the parity test really covers the copy', () => {
    expect(collectStrings(en).length).toBeGreaterThan(100)
  })

  it('has no empty message beyond the one connector the fixed Spanish grammar leaves unused', () => {
    const empty = collectStrings(en)
      .filter((entry) => entry.text.trim().length === 0)
      .filter((entry) => !EMPTY_ALLOWED.has(entry.path))
      .map((entry) => entry.path)

    expect(empty).toEqual([])
  })
})

describe('english copy', () => {
  it('names activities.csv as the only file the user has to pick', () => {
    expect(en.upload.subtitle).toContain('activities.csv')
    expect(en.landing.cta).toContain('activities.csv')
    expect(en.landing.subtitle).toContain('activities.csv')
    expect(en.landing.steps.items[1]?.body).toContain('activities.csv')
  })

  it('explains taking the CSV out of the zip instead of uploading the zip', () => {
    const unzipAnswer = en.landing.faq.items.find((item) => item.answer.includes('.zip'))
    expect(unzipAnswer).toBeDefined()
    expect(unzipAnswer?.answer).toContain('activities.csv')
    expect(en.upload.errors.zipBody.toLowerCase()).toContain('unzip')
  })

  it('keeps the Strava disclaimer wording accurate on the footer and the FAQ', () => {
    expect(en.footer.disclaimer).toContain('not affiliated with Strava')
    const officialAnswer = en.landing.faq.items.find((item) =>
      item.question.toLowerCase().includes('official'),
    )
    expect(officialAnswer?.answer).toContain('independent project')
  })

  it('keeps the editorial spine bands and the numbered-band metadata', () => {
    expect(en.landing.spineLabel).toContain('·')
    expect(en.landing.previews.stageTag).not.toMatch(/\d/)
  })

  it('copies numbers exactly like the English formats', () => {
    expect(uploadNoSeasonMessage(913)).toBe('We read 913 activities and none is from 2026.')
    expect(uploadNoSeasonMessage(12345)).toContain('12,345')
    expect(resultCorruptWarning(2)).toContain('2')
  })

  it('joins the missing browser APIs with the English connector', () => {
    const message = uploadUnsupportedMessage(['Worker', 'FileReader'])
    expect(message).toContain('Worker and FileReader')
    expect(message).not.toContain(' y ')
  })

  it('builds the story sentences in English, with English percent spacing', () => {
    expect(archetypePeakSentence(72, '7:00')).toBe('72% of your starts were at 7:00.')
    expect(heartbeatCoverageSentence(85)).toBe(
      'You recorded heart rate during 85% of your moving time.',
    )
    expect(heartbeatPeakDate(24, 'October')).toBe('on 24 October')
  })

  it('prints the card sentences with the English wording and numbers', () => {
    expect(fulfilledWeeksSentence(3)).toBe('3 or more sessions per week')
  })
})
