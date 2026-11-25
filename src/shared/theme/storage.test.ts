import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  readLanguagePreference,
  readThemePreference,
  writeLanguagePreference,
  writeThemePreference,
} from './storage'

interface FakeStorage {
  touched: string[]
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function installFakeStorage(initial: Record<string, string> = {}): FakeStorage {
  const data = new Map(Object.entries(initial))
  const touched: string[] = []
  const fake: FakeStorage = {
    touched,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      touched.push(key)
      data.set(key, value)
    },
    removeItem: (key) => {
      touched.push(key)
      data.delete(key)
    },
  }
  vi.stubGlobal('localStorage', fake)
  return fake
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('theme storage', () => {
  it('falls back to the system preference when nothing is stored', () => {
    installFakeStorage()
    expect(readThemePreference()).toBe('system')
  })

  it('reads back the stored preference', () => {
    installFakeStorage({ 'dorsal.theme': 'dark' })
    expect(readThemePreference()).toBe('dark')
  })

  it('ignores a stored value that is not a preference', () => {
    installFakeStorage({ 'dorsal.theme': 'neon' })
    expect(readThemePreference()).toBe('system')
  })

  it('writes only the theme key', () => {
    const storage = installFakeStorage()
    writeThemePreference('light')

    expect(storage.touched).toEqual(['dorsal.theme'])
    expect(readThemePreference()).toBe('light')
  })

  it('clears the key instead of storing "system"', () => {
    const storage = installFakeStorage({ 'dorsal.theme': 'dark' })
    writeThemePreference('system')

    expect(storage.touched).toEqual(['dorsal.theme'])
    expect(readThemePreference()).toBe('system')
  })

  it('never touches a key other than the theme preference', () => {
    const storage = installFakeStorage()
    writeThemePreference('dark')
    writeThemePreference('light')
    writeThemePreference('system')
    readThemePreference()

    expect(new Set(storage.touched)).toEqual(new Set(['dorsal.theme']))
  })

  it('degrades to system when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    })

    expect(readThemePreference()).toBe('system')
    expect(() => {
      writeThemePreference('dark')
    }).not.toThrow()
  })
})

describe('language storage', () => {
  it('reports no stored language when nothing is stored', () => {
    installFakeStorage()

    expect(readLanguagePreference()).toBeNull()
  })

  it('reads back the stored language', () => {
    installFakeStorage({ 'dorsal.lang': 'en' })

    expect(readLanguagePreference()).toBe('en')
  })

  it('ignores a stored language that is not offered', () => {
    installFakeStorage({ 'dorsal.lang': 'fr' })

    expect(readLanguagePreference()).toBeNull()
  })

  it('writes only the language key', () => {
    const storage = installFakeStorage()
    writeLanguagePreference('en')

    expect(storage.touched).toEqual(['dorsal.lang'])
    expect(readLanguagePreference()).toBe('en')
  })

  it('never touches a key other than the two interface preferences', () => {
    const storage = installFakeStorage()
    writeThemePreference('dark')
    writeLanguagePreference('en')
    writeThemePreference('system')
    writeLanguagePreference('es')
    readThemePreference()
    readLanguagePreference()

    expect(new Set(storage.touched)).toEqual(new Set(['dorsal.theme', 'dorsal.lang']))
  })

  it('degrades when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    })

    expect(readLanguagePreference()).toBeNull()
    expect(() => {
      writeLanguagePreference('en')
    }).not.toThrow()
  })
})
