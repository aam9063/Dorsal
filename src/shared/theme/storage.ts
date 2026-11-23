export type ThemePreference = 'system' | 'light' | 'dark'

const THEME_KEY = 'dorsal.theme'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = globalThis.localStorage.getItem(THEME_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') {
      globalThis.localStorage.removeItem(THEME_KEY)
      return
    }
    globalThis.localStorage.setItem(THEME_KEY, preference)
  } catch {
    return
  }
}
