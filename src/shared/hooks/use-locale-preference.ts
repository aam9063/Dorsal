import { useSyncExternalStore } from 'react'
import { getLocale, subscribeToLocale } from '../i18n/locale'
import { messages } from '../i18n'
import type { Locale } from '../i18n'
import type { Messages } from '../i18n/es'

/** The chosen language, reactive like the theme preference. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribeToLocale, getLocale, getLocale)
}

/**
 * The copy accessor (odd/tasks/i18n-english.md, decision 1): a component
 * reads its language through this hook, never by importing a locale object.
 * It subscribes to the locale store, so a change from the selector re-renders
 * every screen that reads it — the language is not baked into the component.
 */
export function useT(): Messages {
  useLocale()
  return messages[getLocale()]
}
