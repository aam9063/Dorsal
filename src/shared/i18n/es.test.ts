import { describe, expect, it } from 'vitest'
import {
  es,
  fulfilledWeeksSentence,
  joinAnd,
  powerCoverageSentence,
  resultCorruptWarning,
  uploadNoSeasonMessage,
  uploadUnsupportedMessage,
} from './es'

function collectStrings(value: unknown, path: string[] = []): { path: string; text: string }[] {
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

const strings = collectStrings(es)

const ZIP_AS_INPUT = /(sube|subir|elige|elegir)[^.]*\.zip|\.zip[^.]*(arrastra|sube)/i

describe('spanish copy', () => {
  it('has no empty message', () => {
    const empty = strings.filter((entry) => entry.text.trim().length === 0)
    expect(empty.map((entry) => entry.path)).toEqual([])
  })

  it('never asks the user to upload a zip', () => {
    const wrongPath = strings.filter((entry) => ZIP_AS_INPUT.test(entry.text))
    expect(wrongPath.map((entry) => entry.path)).toEqual([])
  })

  it('names activities.csv as the only file the user has to pick', () => {
    expect(es.upload.subtitle).toContain('activities.csv')
    expect(es.landing.cta).toContain('activities.csv')
  })

  it('names activities.csv where the landing explains the input', () => {
    expect(es.landing.subtitle).toContain('activities.csv')
    expect(es.landing.steps.items[1].body).toContain('activities.csv')
  })

  it('explains taking the CSV out of the zip instead of uploading the zip', () => {
    const unzipAnswer = es.landing.faq.items.find((item) => item.answer.includes('.zip'))
    expect(unzipAnswer).toBeDefined()
    expect(unzipAnswer?.answer).toContain('activities.csv')
  })
})

describe('season card copy', () => {
  it('prints the fulfilled week threshold so the rule is visible on the card', () => {
    expect(fulfilledWeeksSentence(3)).toBe('3 o más entrenos por semana')
  })

  it('states the power coverage so a partial year cannot read as a complete one', () => {
    expect(powerCoverageSentence(34, 60)).toBe('potencia en 34 de 60 salidas')
  })

  it('keeps the closed carnet blocks with their panels in order', () => {
    expect(Object.keys(es.stories['08-dorsal'].carnet)).toEqual([
      'title',
      'sportsTitle',
      'mostPracticedLabel',
      'bestWeekLabel',
      'consecutiveLead',
      'weeksUnit',
      'weeksUnitSingular',
      'marksTitle',
      'longestSessionLabel',
      'biggestElevationDayLabel',
      'bestWeekMarkLabel',
      'powerTitle',
      'weightedAvgPowerLabel',
      'maxPowerLabel',
      'powerEvolutionLabel',
    ])
  })
})

describe('upload error copy', () => {
  it('has one title and one body per documented state', () => {
    const { errors } = es.upload
    const states = [
      ['extension', errors.extensionTitle, errors.extensionBody],
      ['size', errors.sizeTitle, errors.sizeBody],
      ['zip', errors.zipTitle, errors.zipBody],
      ['notStrava', errors.notStravaTitle, errors.notStravaBody],
      ['noSeason', errors.noSeasonTitle, errors.noSeasonBody],
    ] as const
    for (const [key, title, body] of states) {
      expect(title.trim().length, key).toBeGreaterThan(0)
      expect(body.trim().length, key).toBeGreaterThan(0)
    }
    expect(errors.unsupportedTitle.trim().length).toBeGreaterThan(0)
  })

  it('explains how to take activities.csv out of the archive', () => {
    expect(es.upload.errors.zipBody).toContain('activities.csv')
    expect(es.upload.errors.zipBody.toLowerCase()).toContain('descompr')
  })

  it('quotes the season error with the counts the run observed', () => {
    expect(es.upload.errors.noSeasonTitle).toContain('2026')
    expect(uploadNoSeasonMessage(913)).toContain('913')
    expect(uploadNoSeasonMessage(913)).toContain('2026')
    expect(uploadNoSeasonMessage(0)).toContain('0')
  })

  it('names the browser APIs the flow needs when they are missing', () => {
    expect(joinAnd(['Worker', 'FileReader'])).toBe('Worker y FileReader')
    const message = uploadUnsupportedMessage(['Worker', 'FileReader'])
    expect(message).toContain('Worker')
    expect(message).toContain('FileReader')
  })

  it('counts the ignored corrupt rows next to the season numbers', () => {
    expect(resultCorruptWarning(2)).toContain('2')
  })
})
