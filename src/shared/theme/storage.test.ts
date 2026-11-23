import { afterEach, describe, expect, it, vi } from 'vitest'
import { readThemePreference, writeThemePreference } from './storage'

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
