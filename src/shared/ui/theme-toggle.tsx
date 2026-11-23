import { setThemePreference } from '../theme'
import type { ThemePreference } from '../theme'
import { useThemePreference } from '../hooks'
import { t } from '../i18n'

const OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: t.theme.system },
  { value: 'light', label: t.theme.light },
  { value: 'dark', label: t.theme.dark },
]

export function ThemeToggle() {
  const preference = useThemePreference()

  return (
    <div
      role="group"
      aria-label={t.theme.label}
      data-testid="theme-toggle"
      className="inline-flex rounded-pill border border-line p-1"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={preference === option.value}
          data-testid={`theme-option-${option.value}`}
          onClick={() => {
            setThemePreference(option.value)
          }}
          className="min-h-11 min-w-11 rounded-pill px-3 font-mono text-xs uppercase tracking-[0.08em] text-fg-muted aria-pressed:bg-accent aria-pressed:text-ink"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
