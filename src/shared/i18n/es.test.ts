import { describe, expect, it } from 'vitest'
import { es } from './es'

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
