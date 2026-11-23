import { Link } from 'react-router'
import { t } from '../shared/i18n'

export function NotFoundScreen() {
  return (
    <section
      data-testid="not-found-root"
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-16 sm:px-8"
    >
      <h1 className="text-5xl">{t.notFound.title}</h1>
      <Link
        to="/"
        className="inline-flex min-h-14 w-fit items-center rounded-pill bg-accent px-8 font-semibold text-ink"
      >
        {t.notFound.cta}
      </Link>
    </section>
  )
}
