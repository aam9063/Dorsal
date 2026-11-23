import { t } from '../../shared/i18n'

export function ResultScreen() {
  return (
    <section
      data-testid="result-root"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:px-8"
    >
      <h1 className="text-5xl">{t.result.title}</h1>
      <p className="text-base text-fg-muted">{t.result.subtitle}</p>
      <p className="text-sm text-fg-subtle" data-testid="result-provisional">
        {t.result.provisional}
      </p>
    </section>
  )
}
