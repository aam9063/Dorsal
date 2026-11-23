import { Link } from 'react-router'
import { t } from '../../shared/i18n'
import { ScrollRow } from '../../shared/ui'

const NAV_ITEMS = [
  { href: '#como', label: t.landing.navHow },
  { href: '#privacidad', label: t.landing.navPrivacy },
  { href: '#faq', label: t.landing.navFaq },
] as const

const SECTION_WIDTH = 'mx-auto flex w-full max-w-[1200px] flex-col px-5 sm:px-8'
const HEADING_SIZE = 'font-display text-[clamp(44px,5vw,68px)] uppercase leading-none'

function BrandChip() {
  return (
    <span className="inline-flex h-[26px] w-[34px] items-center justify-center rounded-[4px] bg-accent font-display text-[15px] text-ink">
      {t.brand.chip}
    </span>
  )
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function LandingHeader() {
  return (
    <header
      className={`${SECTION_WIDTH} flex-row flex-wrap items-center justify-between gap-6 py-6`}
    >
      <Link
        to="/"
        className="inline-flex min-h-11 items-center gap-2.5 font-display text-[26px] tracking-[0.05em] text-fg"
      >
        <BrandChip />
        {t.brand.name}
      </Link>
      <nav aria-label={t.landing.navAriaLabel} className="flex flex-wrap items-center gap-2">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="inline-flex min-h-11 items-center px-2 text-[15px] text-fg-muted hover:text-fg"
          >
            {item.label}
          </a>
        ))}
        <Link
          to="/subir"
          className="inline-flex min-h-11 items-center rounded-pill bg-accent px-5 font-semibold text-ink"
        >
          {t.landing.headerCta}
        </Link>
      </nav>
    </header>
  )
}

function ExampleBibCard() {
  return (
    <div className="hidden flex-col items-center gap-6 lg:flex lg:min-w-[320px] lg:flex-[1_1_420px]">
      <div aria-hidden="true" className="relative my-14 w-full max-w-[390px]">
        <div className="relative w-full -rotate-4 rounded-panel bg-bone px-6 pb-6 pt-5 text-ink shadow-[0_30px_70px_rgba(15,16,13,0.35)]">
          <span className="absolute left-3.5 top-3.5 size-3 rounded-full bg-bg" />
          <span className="absolute right-3.5 top-3.5 size-3 rounded-full bg-bg" />
          <span className="absolute bottom-3.5 left-3.5 size-3 rounded-full bg-bg" />
          <span className="absolute bottom-3.5 right-3.5 size-3 rounded-full bg-bg" />

          <div className="mx-4 flex items-center justify-between rounded-[4px] bg-accent px-2.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em]">
            <span>{t.landing.card.seasonLabel}</span>
            <span>{t.landing.card.kmLabel}</span>
          </div>

          <p className="text-center font-display text-[156px] leading-[1.02]">
            {t.landing.card.km}
          </p>
          <p className="text-center text-lg font-bold uppercase tracking-[0.24em]">
            {t.landing.card.name}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 border-t-2 border-dashed border-ink pt-3 text-center">
            {t.landing.card.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <span className="font-display text-2xl">{stat.value}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute -left-2 top-2 flex rotate-3 items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg">
          <span className="font-display text-lg text-accent-text">
            {t.landing.card.everestValue}
          </span>
          {t.landing.card.everestLabel}
        </div>
        <div className="absolute -right-2 -bottom-2 flex -rotate-2 items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg">
          {t.landing.card.streakLabel}
          <span className="font-display text-lg text-accent-text">
            {t.landing.card.streakValue}
          </span>
        </div>
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
        {t.landing.exampleLabel}
      </p>
    </div>
  )
}

function LandingHero() {
  return (
    <section
      id="top"
      className={`${SECTION_WIDTH} flex-row flex-wrap items-center gap-16 pb-28 pt-16`}
    >
      <div className="flex min-w-0 flex-1 basis-[500px] flex-col gap-7">
        <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-accent-text">
          {t.landing.eyebrow}
        </p>
        <h1 className="font-display text-[clamp(60px,8vw,116px)] uppercase leading-[0.94]">
          {t.landing.title}
        </h1>
        <p className="max-w-[540px] text-[19px] leading-relaxed text-fg-muted">
          {t.landing.subtitle}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/subir"
            data-testid="landing-cta"
            className="inline-flex min-h-14 items-center gap-3 rounded-pill bg-accent px-7 text-[17px] font-bold text-ink"
          >
            <UploadIcon />
            {t.landing.cta}
          </Link>
          <a
            href="#como"
            className="inline-flex min-h-14 items-center rounded-pill border border-line px-6 text-[17px] font-medium text-fg"
          >
            {t.landing.secondary}
          </a>
        </div>
        <p className="flex items-center gap-2.5 text-sm text-fg-subtle">
          <LockIcon />
          {t.landing.privacyNote}
        </p>
      </div>
      <ExampleBibCard />
    </section>
  )
}

function LandingSteps() {
  return (
    <section id="como" aria-labelledby="como-title" className="w-full scroll-mt-6 bg-bone text-ink">
      <div className={`${SECTION_WIDTH} gap-[52px] py-24 sm:py-26`}>
        <div className="flex max-w-[720px] flex-col gap-4">
          <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-label-ink">
            {t.landing.steps.eyebrow}
          </p>
          <h2 id="como-title" className={HEADING_SIZE}>
            {t.landing.steps.title}
          </h2>
          <p className="text-lg leading-relaxed text-body-ink">{t.landing.steps.description}</p>
        </div>
        <div className="flex flex-wrap gap-6">
          {t.landing.steps.items.map((item, index) => (
            <article
              key={item.title}
              className={`flex min-w-0 flex-1 basis-[300px] flex-col gap-4 rounded-card p-[30px] ${
                index === 2 ? 'bg-accent' : 'border-2 border-ink'
              }`}
            >
              <span className="self-start rounded-[6px] bg-ink px-3 py-1 font-display text-[28px] text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-2xl font-bold">{item.title}</h3>
              <p
                className={`text-base leading-relaxed ${
                  index === 2 ? 'text-ink' : 'text-body-ink'
                }`}
              >
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const HEAT_PATTERN = [
  [3, 1, 4, 2, 1, 3, 4],
  [4, 2, 3, 1, 3, 1, 4],
  [2, 4, 1, 3, 4, 2, 3],
] as const

const HEAT_CLASSES = ['bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4'] as const

const CARD_VARIANTS = [
  'raised',
  'bone',
  'bone',
  'raised',
  'accent',
  'bone',
  'bone',
  'accent',
] as const

function StoryArt({ index }: { index: number }) {
  if (index === 0) {
    return (
      <p className="font-display text-[56px] leading-none text-fg" aria-hidden="true">
        {t.landing.previews.yearArt}
      </p>
    )
  }
  if (index === 1) {
    return (
      <p className="font-display text-[64px] leading-none text-accent-text" aria-hidden="true">
        {t.landing.card.km}
      </p>
    )
  }
  if (index === 2) {
    return (
      <svg viewBox="0 0 140 70" width="140" height="70" aria-hidden="true">
        <path
          d="M0,70 L0,40 L13,34 L25,26 L38,20 L51,8 L64,22 L76,46 L89,62 L102,32 L115,18 L127,24 L140,33 L140,70 Z"
          className="fill-ink"
        />
      </svg>
    )
  }
  if (index === 3) {
    return (
      <div aria-hidden="true" className="grid max-w-[140px] grid-cols-7 gap-1">
        {HEAT_PATTERN.flatMap((row, rowIndex) =>
          row.map((level, columnIndex) => (
            <span
              key={`${rowIndex}-${columnIndex}`}
              className={`h-3.5 rounded-[2px] ${HEAT_CLASSES[level - 1]}`}
            />
          )),
        )}
      </div>
    )
  }
  if (index === 4) {
    return (
      <p
        className="max-w-[120px] font-display text-[40px] uppercase leading-[0.95] text-ink"
        aria-hidden="true"
      >
        {t.landing.previews.archetypeArt}
      </p>
    )
  }
  if (index === 5) {
    return (
      <p className="font-display text-[44px] leading-none text-ink" aria-hidden="true">
        {t.landing.previews.materialArt}
      </p>
    )
  }
  if (index === 6) {
    return (
      <svg
        viewBox="0 0 140 50"
        width="140"
        height="50"
        aria-hidden="true"
        fill="none"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="stroke-ink"
      >
        <path d="M0 30 H40 L48 12 L58 44 L66 6 L74 30 H140" />
      </svg>
    )
  }
  return (
    <span
      aria-hidden="true"
      className="mx-auto flex h-[90px] w-[120px] -rotate-4 items-center justify-center rounded-lg bg-bone font-display text-[40px] text-ink"
    >
      {t.landing.card.km}
    </span>
  )
}

function LandingPreviews() {
  return (
    <section
      id="historias"
      aria-labelledby="historias-title"
      className={`${SECTION_WIDTH} gap-10 py-24 sm:py-26`}
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[640px] flex-col gap-4">
          <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-accent-text">
            {t.landing.previews.eyebrow}
          </p>
          <h2 id="historias-title" className={HEADING_SIZE}>
            {t.landing.previews.title}
          </h2>
        </div>
        <p className="max-w-[340px] text-base leading-relaxed text-fg-subtle">
          {t.landing.previews.description}
        </p>
      </div>
      <ScrollRow
        testId="landing-stories"
        label={t.landing.previews.listAriaLabel}
        className="-mx-5 px-5 pb-3 sm:-mx-8 sm:px-8"
      >
        <ul className="flex w-max gap-5">
          {t.landing.previews.items.map((item, index) => {
            const variant = CARD_VARIANTS[index]
            return (
              <li
                key={item.number}
                className={`flex h-[320px] w-[180px] shrink-0 flex-col justify-between gap-6 rounded-card p-5 ${
                  variant === 'raised'
                    ? 'border border-line bg-surface text-fg'
                    : variant === 'bone'
                      ? 'bg-bone text-ink'
                      : 'bg-accent text-ink'
                }`}
              >
                <span
                  className={`font-mono text-xs ${
                    variant === 'raised'
                      ? 'text-fg-subtle'
                      : variant === 'bone'
                        ? 'text-label-ink'
                        : 'text-ink'
                  }`}
                >
                  {item.number}
                </span>
                <StoryArt index={index} />
                <span className="flex flex-col gap-1.5">
                  <span className="font-display text-[26px] uppercase leading-[1.05]">
                    {item.title}
                  </span>
                  <span
                    className={`text-[13px] leading-snug ${
                      variant === 'raised'
                        ? 'text-fg-muted'
                        : variant === 'bone'
                          ? 'text-body-ink'
                          : 'text-ink'
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </ScrollRow>
    </section>
  )
}

function LandingPrivacyStrip() {
  return (
    <section
      id="privacidad"
      aria-labelledby="privacidad-title"
      className="w-full scroll-mt-6 bg-accent text-ink"
    >
      <div className={`${SECTION_WIDTH} gap-12 py-24 sm:py-26`}>
        <h2
          id="privacidad-title"
          className="max-w-[900px] font-display text-[clamp(48px,6vw,88px)] uppercase leading-[0.96]"
        >
          {t.landing.privacyStrip.title}
        </h2>
        <div className="flex flex-wrap gap-8">
          {t.landing.privacyStrip.items.map((item) => (
            <div
              key={item.title}
              className="flex min-w-0 flex-1 basis-[260px] flex-col gap-2.5 border-t-2 border-ink pt-5"
            >
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-base leading-relaxed text-ink">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function LandingFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className={`${SECTION_WIDTH} flex-row flex-wrap gap-12 py-24 sm:py-26`}
    >
      <div className="flex min-w-0 flex-1 basis-[320px] flex-col gap-4">
        <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-accent-text">
          {t.landing.faq.eyebrow}
        </p>
        <h2
          id="faq-title"
          className="font-display text-[clamp(44px,5vw,64px)] uppercase leading-none"
        >
          {t.landing.faq.title}
        </h2>
      </div>
      <div className="flex min-w-0 flex-[999_1_560px] flex-col">
        {t.landing.faq.items.map((item) => (
          <details key={item.question} className="group border-b border-line py-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 text-xl font-semibold [&::-webkit-details-marker]:hidden">
              {item.question}
              <span aria-hidden="true" className="font-mono text-fg-subtle group-open:hidden">
                +
              </span>
              <span
                aria-hidden="true"
                className="hidden font-mono text-fg-subtle group-open:inline"
              >
                −
              </span>
            </summary>
            <p className="mt-3 max-w-prose text-base leading-relaxed text-fg-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}

function LandingFooter() {
  const links = [
    { href: '#como', label: t.landing.footer.howLink },
    { href: '#faq', label: t.landing.navFaq },
    { href: '/subir', label: t.landing.footer.ctaLink },
  ] as const satisfies readonly { href: string; label: string }[]

  return (
    <footer className="border-t border-line">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-fg-subtle sm:px-8">
        <p className="flex items-center gap-2.5">
          <BrandChip />
          <span className="font-display text-lg uppercase tracking-[0.05em] text-fg">
            {t.brand.name}
          </span>
        </p>
        <p>{t.landing.footer.madeWith}</p>
        <nav aria-label={t.landing.footer.navAriaLabel} className="flex flex-wrap gap-2">
          {links.map((link) =>
            link.href.startsWith('/') ? (
              <Link
                key={link.href}
                to={link.href}
                className="inline-flex min-h-11 items-center px-2 hover:text-fg"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center px-2 hover:text-fg"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>
      </div>
    </footer>
  )
}

export function LandingScreen() {
  return (
    <div data-testid="landing-root">
      <LandingHeader />
      <LandingHero />
      <LandingSteps />
      <LandingPreviews />
      <LandingPrivacyStrip />
      <LandingFaq />
      <LandingFooter />
    </div>
  )
}
