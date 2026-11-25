import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatDuration, formatKilometres, formatNumber } from '../format'
import { bootstrapLocale, getLocale, setLocale, subscribeToLocale } from './locale'

/**
 * The locale store is a singleton module, so every test pins the state it
 * needs before acting: storage stubbed when the test asserts persistence,
 * `navigator` stubbed when the test asserts detection, and `document`
 * stubbed when the test asserts the `<html lang>` application. In a plain
 * Node environment nothing is stubbed and the store keeps its Spanish
 * default, which is also what every other unit test sees.
 */

interface MinimalDocument {
  documentElement: { lang: string }
}

function stubBrowserStorage(): { data: Map<string, string>; touched: string[] } {
  const data = new Map<string, string>()
  const touched: string[] = []
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      touched.push(key)
      data.set(key, value)
    },
    removeItem: (key: string) => {
      touched.push(key)
      data.delete(key)
    },
  })
  return { data, touched }
}

function stubNavigator(language: string): void {
  vi.stubGlobal('navigator', { language })
}

function stubDocument(): MinimalDocument {
  const documentStub: MinimalDocument = {
    documentElement: { lang: 'es' },
  }
  vi.stubGlobal('document', documentStub)
  return documentStub
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('locale store', () => {
  it('starts in Spanish before the app bootstraps', () => {
    expect(getLocale()).toBe('es')
  })

  it('detects English from an English browser on first visit', () => {
    stubNavigator('en-US')
    stubBrowserStorage()

    bootstrapLocale()

    expect(getLocale()).toBe('en')
  })

  it('detects Spanish for any non-English browser on first visit', () => {
    stubNavigator('es-ES')
    stubBrowserStorage()

    bootstrapLocale()

    expect(getLocale()).toBe('es')
  })

  it('never persists the detected language', () => {
    stubNavigator('en-US')
    const storage = stubBrowserStorage()

    bootstrapLocale()
    setLocale('es')

    expect(storage.touched).toEqual(['dorsal.lang'])
    expect(storage.data.get('dorsal.lang')).toBe('es')
  })

  it('prefers the stored language over the browser language', () => {
    stubNavigator('en-US')
    stubBrowserStorage().data.set('dorsal.lang', 'es')

    bootstrapLocale()

    expect(getLocale()).toBe('es')
  })

  it('falls back to the browser language when the stored value is not offered', () => {
    stubNavigator('en-GB')
    stubBrowserStorage().data.set('dorsal.lang', 'fr')

    bootstrapLocale()

    expect(getLocale()).toBe('en')
  })

  it('persists an explicit choice, even when it repeats the detected language', () => {
    stubNavigator('en-US')
    const storage = stubBrowserStorage()

    bootstrapLocale()
    setLocale('en')

    expect(storage.touched).toEqual(['dorsal.lang'])
    expect(storage.data.get('dorsal.lang')).toBe('en')
  })

  it('never writes a key other than the language preference', () => {
    const storage = stubBrowserStorage()

    setLocale('es')
    setLocale('en')

    expect(new Set(storage.touched)).toEqual(new Set(['dorsal.lang']))
  })

  it('notifies subscribers when the locale changes', () => {
    const notified: string[] = []
    const unsubscribe = subscribeToLocale(() => {
      notified.push(getLocale())
    })

    setLocale('en')
    unsubscribe()
    setLocale('es')

    expect(notified).toEqual(['en'])
  })

  it('applies the choice to the document language', () => {
    stubNavigator('en-US')
    stubBrowserStorage()
    const documentStub = stubDocument()

    bootstrapLocale()
    setLocale('es')

    expect(documentStub.documentElement.lang).toBe('es')
  })
})

describe('formatting follows the locale store', () => {
  beforeEach(() => {
    setLocale('es')
  })

  it('formats whole numbers with both locales, keeping the function names', () => {
    expect(formatNumber(30666)).toBe('30.666')
    setLocale('en')
    expect(formatNumber(30666)).toBe('30,666')
  })

  it('formats kilometres with one decimal in both locales', () => {
    expect(formatKilometres(14514000)).toBe('14.514,0')
    setLocale('en')
    expect(formatKilometres(14514000)).toBe('14,514.0')
  })

  it('keeps the h/min duration shape in English', () => {
    setLocale('en')
    expect(formatDuration(81 * 3600 + 36 * 60)).toBe('81 h 36 min')
    expect(formatDuration(1229 * 3600)).toBe('1,229 h')
  })
})
