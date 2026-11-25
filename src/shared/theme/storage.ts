/**
 * The only module that touches browser storage (AGENTS.md 5.1). It holds the
 * two interface preferences — the theme and the chosen language — and nothing
 * else; the same closed list is asserted at runtime by the `@privacy` e2e.
 *
 * Both readers return `null` (language) or the documented default (theme)
 * instead of throwing when storage is blocked, and a stored value that is not
 * an offered preference counts as nothing stored.
 */
export type ThemePreference = 'system' | 'light' | 'dark'

const THEME_KEY = 'dorsal.theme'

/** The two languages Dorsal ships; `en.ts` and `es.ts` carry their copy. */
export type LanguagePreference = 'es' | 'en'

const LANGUAGE_KEY = 'dorsal.lang'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === 'es' || value === 'en'
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

/** The language stored by an explicit choice, or `null` on a first visit. */
export function readLanguagePreference(): LanguagePreference | null {
  try {
    const stored = globalThis.localStorage.getItem(LANGUAGE_KEY)
    return isLanguagePreference(stored) ? stored : null
  } catch {
    return null
  }
}

export function writeLanguagePreference(preference: LanguagePreference): void {
  try {
    globalThis.localStorage.setItem(LANGUAGE_KEY, preference)
  } catch {
    return
  }
}
