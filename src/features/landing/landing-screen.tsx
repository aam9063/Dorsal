import { Link } from 'react-router'
import { t } from '../../shared/i18n'

export function LandingScreen() {
  return (
    <section
      data-testid="landing-root"
      className="mx-auto flex w-full max-w-5xl flex-col justify-center gap-6 px-5 py-12 sm:px-8 sm:py-20"
    >
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent-text">
        {t.landing.eyebrow}
      </p>
      <h1 className="max-w-2xl text-6xl sm:text-8xl">{t.landing.title}</h1>
      <p className="max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
        {t.landing.subtitle}
      </p>
      <div>
        <Link
          to="/subir"
          data-testid="landing-cta"
          className="inline-flex min-h-14 items-center rounded-pill bg-accent px-8 font-semibold text-ink"
        >
          {t.landing.cta}
        </Link>
      </div>
      <p className="max-w-md text-sm text-fg-subtle" data-testid="landing-provisional">
        {t.landing.provisional}
      </p>
    </section>
  )
}
