import { setLocale, type Locale } from '../i18n'
import { useLocale, useT } from '../hooks'

const OPTIONS: readonly Locale[] = ['es', 'en']

/**
 * The language selector, beside the theme toggle: one button per language,
 * labelled with the language's own name, which is also its whole accessible
 * name — a mismatch between visible text and label is an axe violation and a
 * dead end for screen readers (odd/tasks/i18n-english.md, S2). Each button
 * carries its own `lang` so assistive technology pronounces the name right.
 * The two buttons keep the 44 px touch targets of the theme toggle and fit
 * the 390 px header beside it.
 */
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
          data-testid={`lang-option-${option}`}
          onClick={() => {
            setLocale(option)
          }}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill px-2 font-mono text-[11px] font-bold uppercase text-fg-muted aria-pressed:bg-accent aria-pressed:text-ink"
        >
          {copy.language[option]}
        </button>
      ))}
    </div>
  )
}
