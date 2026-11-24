import type { ReactElement } from 'react'
import { setThemePreference } from '../theme'
import type { ThemePreference } from '../theme'
import { useThemePreference } from '../hooks'
import { t } from '../i18n'

interface ThemeOption {
  value: ThemePreference
  label: string
  icon: ReactElement
}

/**
 * The three preferences as icons rather than words: the control sits in a
 * narrow strip on a phone, and "Sistema / Claro / Oscuro" does not fit without
 * shrinking the touch targets below 44 px. Each icon keeps its name for
 * assistive technology through `aria-label`, which is the only label it has.
 */
const OPTIONS: readonly ThemeOption[] = [
  {
    value: 'system',
    label: t.theme.system,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M9 20h6M12 16v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'light',
    label: t.theme.light,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: t.theme.dark,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
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
          aria-label={option.label}
          aria-pressed={preference === option.value}
          title={option.label}
          data-testid={`theme-option-${option.value}`}
          onClick={() => {
            setThemePreference(option.value)
          }}
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill text-fg-muted aria-pressed:bg-accent aria-pressed:text-ink"
        >
          <span className="h-5 w-5">{option.icon}</span>
        </button>
      ))}
    </div>
  )
}
