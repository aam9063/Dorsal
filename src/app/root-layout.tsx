import { Outlet } from 'react-router'
import { t } from '../shared/i18n'
import { ThemeToggle } from '../shared/ui'

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:m-3 focus:inline-block focus:rounded-chip focus:bg-accent focus:px-4 focus:py-2 focus:text-ink"
      >
        {t.a11y.skipToContent}
      </a>
      <div className="flex justify-end px-5 pt-5 sm:px-8">
        <ThemeToggle />
      </div>
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-12 border-t border-line px-5 py-6 text-sm text-fg-subtle sm:px-8">
        <p>{t.privacy.banner}</p>
        <p className="mt-1">{t.footer.disclaimer}</p>
      </footer>
    </div>
  )
}
