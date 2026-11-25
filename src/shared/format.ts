import { getLocale, type Locale } from './i18n/locale'

const LOCALE_TAGS: Record<Locale, string> = {
  es: 'es-ES',
  en: 'en',
}

/**
 * Number, kilometre and duration formatting follow the active locale
 * (odd/tasks/i18n-english.md, decision 3): Spanish grouping (`1.451,4`) or
 * English grouping (`1,451.4`) is decided by the locale store, and the
 * duration keeps the same compact `h`/`min` shape in both — the units are
 * unambiguous in English and the stories and cards size to them. A call may
 * pass a locale explicitly, which the share cards will do so a render is
 * deterministic in its own language.
 */
const wholeFormatters = new Map<Locale, Intl.NumberFormat>()
const oneDecimalFormatters = new Map<Locale, Intl.NumberFormat>()

function cachedFormatter(
  cache: Map<Locale, Intl.NumberFormat>,
  locale: Locale,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const cached = cache.get(locale)
  if (cached !== undefined) {
    return cached
  }
  const created = new Intl.NumberFormat(LOCALE_TAGS[locale], options)
  cache.set(locale, created)
  return created
}

/** Whole number with the locale's separators, e.g. Spanish `1234` → `1.234`. */
export function formatNumber(value: number, locale: Locale = getLocale()): string {
  return cachedFormatter(wholeFormatters, locale, {}).format(value)
}

/**
 * Metres as kilometres with one decimal, e.g. Spanish `1234567` → `1.234,6`,
 * English `1234567` → `1,234.6`.
 */
export function formatKilometres(metres: number, locale: Locale = getLocale()): string {
  return cachedFormatter(oneDecimalFormatters, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(metres / 1000)
}

/**
 * Seconds as `34 h 12 min`; below one hour only the minutes are shown, and a
 * whole number of hours drops the `0 min` that would only add noise.
 */
export function formatDuration(seconds: number, locale: Locale = getLocale()): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours === 0) {
    return `${formatNumber(minutes, locale)} min`
  }
  return minutes === 0
    ? `${formatNumber(hours, locale)} h`
    : `${formatNumber(hours, locale)} h ${formatNumber(minutes, locale)} min`
}

/**
 * The two halves of a duration for a hero number that renders the hours big and
 * the rest small: `minutes` is `null` when the duration is a whole number of
 * hours, so a screen never prints `81 h 0 min`.
 */
export function formatHourParts(
  seconds: number,
  locale: Locale = getLocale(),
): {
  hours: string
  minutes: string | null
} {
  const wholeHours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return {
    hours: formatNumber(wholeHours, locale),
    minutes: minutes === 0 ? null : formatNumber(minutes, locale),
  }
}
