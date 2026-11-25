import * as enSentences from './en'
import * as esSentences from './es'
import { en } from './en'
import { es, type Messages } from './es'
import { getLocale, type Locale } from './locale'

export const messages = { es, en } satisfies Record<Locale, Messages>

export type { Locale } from './locale'
export type { Messages } from './es'

export { bootstrapLocale, getLocale, setLocale, subscribeToLocale } from './locale'

/**
 * A component must never import a locale object (`messages.es`, `messages.en`)
 * directly: only this accessor or the `useT()` hook in `src/shared/hooks/` may
 * read the copy. The static `t` below is a transitional live delegate — it
 * resolves against the active locale on every property access, so the screens
 * that still read it keep rendering the right language on their next render.
 * The English version converts them screen by screen (odd/tasks/
 * i18n-english.md, decisions 1 and 2); once every screen reads `useT()`, this
 * export goes away.
 */
export const t: typeof es = new Proxy({} as typeof es, {
  get: (_target, property) => {
    if (typeof property !== 'string') {
      return undefined
    }
    return messages[getLocale()][property as keyof Messages]
  },
})

/**
 * The copy sentences hand the locale-explicit builders a reactive face: the
 * caller keeps the same import and its language follows the selector on the
 * next render. The share cards take the locale explicitly from the same
 * builders so their determinism tests can run in both languages.
 */
export function uploadNoSeasonMessage(totalRows: number): string {
  return (getLocale() === 'en' ? enSentences : esSentences).uploadNoSeasonMessage(totalRows)
}

export function archetypePeakSentence(sharePct: number, hourText: string): string {
  return (getLocale() === 'en' ? enSentences : esSentences).archetypePeakSentence(
    sharePct,
    hourText,
  )
}

export function heartbeatPeakDate(day: number, month: string): string {
  return (getLocale() === 'en' ? enSentences : esSentences).heartbeatPeakDate(day, month)
}

export function heartbeatCoverageSentence(coveragePct: number): string {
  return (getLocale() === 'en' ? enSentences : esSentences).heartbeatCoverageSentence(coveragePct)
}

export function joinAnd(items: readonly string[]): string {
  return (getLocale() === 'en' ? enSentences : esSentences).joinAnd(items)
}

export function uploadUnsupportedMessage(missing: readonly string[]): string {
  return (getLocale() === 'en' ? enSentences : esSentences).uploadUnsupportedMessage(missing)
}

export function resultCorruptWarning(corruptRows: number): string {
  return (getLocale() === 'en' ? enSentences : esSentences).resultCorruptWarning(corruptRows)
}

export function fulfilledWeeksSentence(sessionsPerWeek: number): string {
  return (getLocale() === 'en' ? enSentences : esSentences).fulfilledWeeksSentence(sessionsPerWeek)
}

export function powerCoverageSentence(sessionsWithPower: number, totalSessions: number): string {
  return (getLocale() === 'en' ? enSentences : esSentences).powerCoverageSentence(
    sessionsWithPower,
    totalSessions,
  )
}

/**
 * The card builders (odd/tasks/i18n-english.md, decision 5): the season card
 * receives its locale explicitly, so these read exactly the language the card
 * is drawn in — never the actives — and call sites stay deterministic.
 */
export function fulfilledWeeksSentenceFor(locale: Locale, sessionsPerWeek: number): string {
  return locale === 'en'
    ? enSentences.fulfilledWeeksSentence(sessionsPerWeek)
    : esSentences.fulfilledWeeksSentence(sessionsPerWeek, locale)
}

export function powerCoverageSentenceFor(
  locale: Locale,
  sessionsWithPower: number,
  totalSessions: number,
): string {
  return locale === 'en'
    ? enSentences.powerCoverageSentence(sessionsWithPower, totalSessions)
    : esSentences.powerCoverageSentence(sessionsWithPower, totalSessions, locale)
}
