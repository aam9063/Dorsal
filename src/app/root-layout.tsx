import { Link, Outlet, useLocation } from 'react-router'
import { t } from '../shared/i18n'
import { ThemeToggle } from '../shared/ui'

/**
 * Brand mark that is also the way home. The landing draws its own header, so
 * this one steps aside there to avoid two marks stacked; every other screen gets
 * it, because without it there is no way back to the start of the flow.
 */
function BrandHome() {
  return (
    <Link
      to="/"
      data-testid="brand-home"
      className="inline-flex min-h-11 items-center gap-2 rounded-chip"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-chip bg-accent font-display text-sm text-ink">
        {t.brand.chip}
      </span>
      <span className="font-display text-lg uppercase tracking-wide">{t.brand.name}</span>
      {/* The visible text is the accessible name; this only says where it goes. */}
      <span className="sr-only">{t.brand.home}</span>
    </Link>
  )
}

export function RootLayout() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:m-3 focus:inline-block focus:rounded-chip focus:bg-accent focus:px-4 focus:py-2 focus:text-ink"
      >
        {t.a11y.skipToContent}
      </a>
      <header className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-8">
        {isLanding ? <span aria-hidden="true" /> : <BrandHome />}
        <ThemeToggle />
      </header>
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
