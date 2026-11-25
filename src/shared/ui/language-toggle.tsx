import { setLocale, type Locale } from '../i18n'
import { useLocale, useT } from '../hooks'

const OPTIONS: readonly Locale[] = ['es', 'en']

/**
 * The language selector, beside the theme toggle: one button per language,
 * labelled with a short code so the header stays narrow, while its accessible
 * name carries the language's own name too: the visible text must be contained
 * in the label, or axe reports a mismatch and a screen reader hears something
 * different from what is on screen (odd/tasks/i18n-english.md, S2). Each button
 * carries its own `lang` so assistive technology pronounces the name right.
 * The two buttons keep the 44 px touch targets of the theme toggle and fit
 * the 390 px header beside it.
 */
/** Three-letter codes: locale-neutral, so they are not translated copy. */
const SHORT: Record<Locale, string> = { es: 'ESP', en: 'EN' }

export function LanguageToggle() {
  const copy = useT()
  const locale = useLocale()

  return (
    <div
      role="group"
      aria-label={copy.language.label}
      data-testid="language-toggle"
      className="inline-flex rounded-pill border border-line p-1"
    >
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          aria-pressed={locale === option}
          aria-label={`${SHORT[option]} — ${copy.language[option]}`}
          data-testid={`lang-option-${option}`}
          onClick={() => {
            setLocale(option)
          }}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill px-2 font-mono text-[11px] font-bold uppercase text-fg-muted aria-pressed:bg-accent aria-pressed:text-ink"
        >
          {SHORT[option]}
        </button>
      ))}
    </div>
  )
}
