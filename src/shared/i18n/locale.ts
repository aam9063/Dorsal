import {
  readLanguagePreference,
  writeLanguagePreference,
  type LanguagePreference,
} from '../theme/storage'

export type Locale = LanguagePreference

const DEFAULT_LOCALE: Locale = 'es'

const listeners = new Set<() => void>()

let current: Locale = DEFAULT_LOCALE

/**
 * Localized copy is shared state, not a constant: a component that needs copy
 * reads it through the `useT()` accessor in `src/shared/hooks/`, never by
 * importing `messages.es` or the static `t` delegate. The reason is
 * reactivity plus one closed key set: the accessor subscribes to this store,
 * so a language change re-renders every subscribed screen, while an imported
 * locale object freezes one language into the component and silently splits
 * the app when the selector switches.
 */

function detectedLocale(): Locale {
  const language = typeof navigator === 'undefined' ? '' : navigator.language
  return language.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LOCALE
}

function applyToDocument(locale: Locale): void {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.lang = locale
}

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function getLocale(): Locale {
  return current
}

export function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * The app calls this once, before the first render (currently at the top of
 * `src/app/app.tsx`). It does two things in order: a stored explicit choice
 * wins, otherwise the browser's own language decides the first visit
 * (odd/tasks/i18n-english.md, S2). The detected language is deliberately not
 * persisted: only an explicit choice may write to storage, so a visitor whose
 * browser is misconfigured still gets the other language by selecting it
 * without the wrong language being remembered forever.
 */
export function bootstrapLocale(): void {
  const stored = readLanguagePreference()
  current = stored ?? detectedLocale()
  applyToDocument(current)
}

/** An explicit choice from the selector: it persists and re-renders. */
export function setLocale(locale: Locale): void {
  current = locale
  writeLanguagePreference(locale)
  applyToDocument(locale)
  notify()
}
