import { useRef } from 'react'
import { Link } from 'react-router'
import { t } from '../../shared/i18n'
import { useGsapReveal } from '../../shared/hooks'
import { ScrollRow } from '../../shared/ui'

const NAV_ITEMS = [
  { href: '#como', label: t.landing.navHow },
  { href: '#privacidad', label: t.landing.navPrivacy },
  { href: '#faq', label: t.landing.navFaq },
] as const

const SECTION_WIDTH = 'mx-auto flex w-full max-w-[1200px] flex-col px-5 sm:px-8'
const HEADING_SIZE = 'font-display text-[clamp(44px,5vw,68px)] uppercase leading-none'
const PLATE = 'rounded-[4px] bg-bone text-ink shadow-[0_14px_30px_rgba(15,16,13,0.4)]'
const PLATE_TAG =
  'self-start rounded-pill border border-accent-on-bone px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink'
const PLATE_ROTATIONS = [
  '-rotate-[1.2deg]',
  'rotate-[0.8deg]',
  'rotate-[1.6deg]',
  '-rotate-[0.6deg]',
] as const

function BrandChip() {
  return (
    <span className="rounded-pill border border-line px-2 py-0.5 font-mono text-xs leading-none text-fg">
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

/**
 * The editorial spine's numbered header band: a display-face numeral and the
 * section's mono metadata on the same baseline, bounded by hairline rules
 * (odd/tasks/redesign-objeto-dorsal.md, S2).
 */
function SectionHeader({
  number,
  meta,
  onAccent = false,
}: {
  number: string
  meta: string
  onAccent?: boolean
}) {
  const bounds = onAccent ? 'border-ink' : 'border-line'
  const tone = onAccent ? 'text-ink' : 'text-accent-text'
  const label = onAccent ? 'text-ink' : 'text-fg-subtle'
  return (
    <header className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y ${bounds} py-2.5`}>
      <span
        aria-hidden="true"
        className={`font-display text-[clamp(34px,3vw,40px)] leading-[1.1] ${tone}`}
      >
        {number}
      </span>
      <span className={`font-mono text-xs uppercase tracking-[0.14em] ${label}`}>{meta}</span>
    </header>
  )
}

function LandingHeader() {
  return (
    <header
      className={`${SECTION_WIDTH} flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3 py-6`}
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
            className="inline-flex min-h-11 items-center px-2 text-[15px] text-fg underline decoration-line underline-offset-4 hover:decoration-accent"
          >
            {item.label}
          </a>
        ))}
        <Link
          to="/subir"
          data-anim-button
          className="inline-flex min-h-11 items-center rounded-pill bg-cta-bg px-5 font-semibold text-cta-fg"
        >
          {t.landing.headerCta}
        </Link>
      </nav>
      <p
        aria-hidden="true"
        className="order-last w-full text-center font-mono text-[11px] uppercase tracking-[0.3em] text-fg-subtle lg:hidden"
      >
        {t.landing.spineLabel}
      </p>
    </header>
  )
}

function ExampleBibCard() {
  return (
    <div aria-hidden="true" className="relative my-16 w-full max-w-[470px] lg:my-0">
      <div className="relative w-full -rotate-[2.5deg] rounded-[4px] bg-bone px-7 pb-7 pt-5 text-ink shadow-[0_34px_70px_rgba(15,16,13,0.55)]">
        <span className="absolute left-6 top-3 size-[18px] rounded-full bg-ink shadow-[inset_3px_3px_5px_rgba(252,82,0,0.45)]" />
        <span className="absolute right-6 top-3 size-[18px] rounded-full bg-ink shadow-[inset_3px_3px_5px_rgba(252,82,0,0.45)]" />

        <div className="border-b-2 border-ink pb-2.5 text-center font-mono text-[11px] uppercase tracking-[0.26em] text-label-ink">
          {t.landing.card.seasonLabel}
        </div>
        <p className="mt-3 text-center font-display text-[clamp(64px,6vw,92px)] leading-none text-accent-on-bone">
          <span data-anim-counter>{t.landing.card.km}</span>{' '}
          <span className="font-sans text-[22px] font-bold">{t.landing.card.kmLabel}</span>
        </p>
        <p className="text-center font-mono text-[13px] uppercase tracking-[0.22em]">
          {t.landing.card.name}
        </p>

        <div className="my-3.5 border-t-2 border-dashed border-bone-soft" />

        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ...t.landing.card.stats,
            { value: t.landing.card.streakValue, label: t.landing.card.streakLabel },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <span className="font-display text-[21px] leading-tight" data-anim-counter>
                {stat.value}
              </span>
              <span className="text-[11px] leading-tight text-label-ink">{stat.label}</span>
            </div>
          ))}
        </div>

        <span className="absolute -bottom-6 right-5 inline-flex rotate-[6deg] items-center gap-2 rounded-pill bg-accent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink shadow-[0_6px_14px_rgba(15,16,13,0.4)]">
          <span data-anim-counter>{t.landing.card.everestValue}</span>
          {t.landing.card.everestLabel}
        </span>
      </div>
    </div>
  )
}

function LandingHero() {
  return (
    <section id="top" className={`${SECTION_WIDTH} pb-24 pt-12 sm:pt-16`}>
      <div className="lg:grid lg:grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <div aria-hidden="true" className="hidden lg:block lg:border-r lg:border-line lg:pt-6">
          <span className="block rotate-180 whitespace-nowrap pr-3 text-right font-mono text-[11px] uppercase tracking-[0.3em] text-fg-subtle [writing-mode:vertical-rl]">
            {t.landing.spineLabel}
          </span>
        </div>

        <div className="flex min-w-0 flex-col">
          <SectionHeader number="01" meta={t.landing.heroMeta} />
          <h1
            className="mt-6 font-display text-[clamp(56px,6vw,88px)] uppercase leading-[0.94]"
            data-anim-hero
          >
            {t.landing.title}
          </h1>
          <p
            className="mt-5 max-w-[56ch] text-base leading-relaxed text-fg-muted [text-wrap:pretty]"
            data-anim-hero
          >
            {t.landing.subtitle}
          </p>
          <div
            className="mt-8 flex max-w-[56ch] flex-wrap items-center gap-4 lg:mt-auto lg:pt-8"
            data-anim-hero
          >
            <Link
              to="/subir"
              data-testid="landing-cta"
              data-anim-button
              data-impeccable-ignore="hard-offset-shadow"
              className="inline-flex min-h-14 items-center gap-2.5 rounded-chip bg-bone px-7 text-[17px] font-bold text-ink shadow-[4px_4px_0_var(--color-orange)] transition-shadow hover:shadow-[6px_6px_0_var(--color-orange)] active:shadow-[2px_2px_0_var(--color-orange)]"
            >
              <UploadIcon />
              {t.landing.cta}
            </Link>
            <a
              href="#como"
              className="inline-flex min-h-14 items-center text-[15px] font-semibold text-fg underline decoration-line underline-offset-4 hover:decoration-accent"
            >
              {t.landing.secondary}
            </a>
          </div>
          <p
            className="mt-5 max-w-[56ch] border-t border-dashed border-line pt-3 text-[13.5px] text-fg-muted [text-wrap:pretty]"
            data-anim-hero
          >
            {t.landing.privacyNote}
          </p>
        </div>

        <div className="mt-12 hidden lg:flex lg:flex-col lg:items-center lg:pt-16" data-anim-hero>
          <ExampleBibCard />
          <p className="mt-14 text-center font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
            {t.landing.exampleLabel}
          </p>
        </div>
      </div>
    </section>
  )
}

function LandingSteps() {
  return (
    <section id="como" aria-labelledby="como-title" className="w-full scroll-mt-6">
      <div className={`${SECTION_WIDTH} gap-8 py-24 sm:py-26`} data-anim-section>
        <SectionHeader number="02" meta={t.landing.stepsMeta} />
        <div className="flex max-w-[720px] flex-col gap-4 pt-2">
          <h2 id="como-title" className={HEADING_SIZE}>
            {t.landing.steps.title}
          </h2>
          <p className="text-lg leading-relaxed text-fg-muted [text-wrap:pretty]">
            {t.landing.steps.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-6 pt-4">
          {t.landing.steps.items.map((item, index) => (
            <article
              key={item.title}
              className={`${PLATE} ${PLATE_ROTATIONS[index]} flex min-w-0 flex-1 basis-[300px] flex-col gap-3 p-7`}
            >
              <span className="self-start font-display text-[28px] leading-none text-accent-on-bone">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-2xl font-bold">{item.title}</h3>
              <p className="text-base leading-relaxed text-body-ink [text-wrap:pretty]">
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

function StoryArt({ index }: { index: number }) {
  if (index === 0) {
    return (
      <p className="font-display text-[56px] leading-none text-ink" aria-hidden="true">
        {t.landing.previews.yearArt}
      </p>
    )
  }
  if (index === 1) {
    return (
      <p className="font-display text-[64px] leading-none text-accent-on-bone" aria-hidden="true">
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
      className="mx-auto flex h-[90px] w-[120px] -rotate-4 items-center justify-center rounded-[4px] bg-surface-strong font-display text-[40px] text-ink"
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
      className={`${SECTION_WIDTH} gap-8 py-24 sm:py-26`}
      data-anim-section
    >
      <SectionHeader number="03" meta={t.landing.previewsMeta} />
      <div className="flex flex-wrap items-end justify-between gap-6 pt-2">
        <h2 id="historias-title" className={`${HEADING_SIZE} max-w-[640px]`}>
          {t.landing.previews.title}
        </h2>
        <p className="max-w-[340px] text-base leading-relaxed text-fg-subtle [text-wrap:pretty]">
          {t.landing.previews.description}
        </p>
      </div>
      <ScrollRow
        testId="landing-stories"
        label={t.landing.previews.listAriaLabel}
        className="-mx-5 px-5 pb-3 sm:-mx-8 sm:px-8"
      >
        <ul className="flex w-max gap-5">
          {t.landing.previews.items.map((item, index) => (
            <li
              key={item.number}
              data-anim-card
              className={`${PLATE} ${PLATE_ROTATIONS[index % 4]} flex h-[320px] w-[190px] shrink-0 flex-col justify-between gap-5 p-5`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-label-ink">{item.number}</span>
                <span className={PLATE_TAG}>
                  {t.landing.previews.stageTag} {index + 1}
                </span>
              </div>
              <StoryArt index={index} />
              <span className="flex flex-col gap-1.5">
                <span className="font-display text-[22px] uppercase leading-[1.05]">
                  {item.title}
                </span>
                <span className="text-[13px] leading-snug text-body-ink">{item.description}</span>
              </span>
            </li>
          ))}
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
      <div className={`${SECTION_WIDTH} gap-8 py-24 sm:py-26`} data-anim-section>
        <SectionHeader number="04" meta={t.landing.privacyMeta} onAccent />
        <h2
          id="privacidad-title"
          className="max-w-[900px] font-display text-[clamp(48px,6vw,88px)] uppercase leading-[0.96]"
        >
          {t.landing.privacyStrip.title}
        </h2>
        <div className="flex flex-wrap gap-6 pt-2">
          {t.landing.privacyStrip.items.map((item, index) => (
            <div
              key={item.title}
              className={`${PLATE} ${PLATE_ROTATIONS[index]} flex min-w-0 flex-1 basis-[260px] flex-col gap-2.5 p-6`}
            >
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-base leading-relaxed text-body-ink [text-wrap:pretty]">
                {item.body}
              </p>
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
      className={`${SECTION_WIDTH} gap-10 py-24 sm:py-26`}
      data-anim-section
    >
      <SectionHeader number="05" meta={t.landing.faqMeta} />
      <div className="flex min-w-0 flex-col gap-4 pt-2 lg:flex-row lg:gap-12">
        <h2
          id="faq-title"
          className="font-display text-[clamp(44px,5vw,64px)] uppercase leading-none lg:min-w-0 lg:flex-[1_1_320px]"
        >
          {t.landing.faq.title}
        </h2>
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
              <p className="mt-3 max-w-prose text-base leading-relaxed text-fg-muted [text-wrap:pretty]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
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
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-fg-subtle sm:px-8">
        <p className="flex items-center gap-2.5">
          <BrandChip />
          <span className="font-display text-lg uppercase tracking-[0.05em] text-fg">
            {t.brand.name}
          </span>
        </p>
        <p className="text-[12px]">{t.footer.disclaimer}</p>
        <p className="text-[12px]">{t.landing.footer.madeWith}</p>
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
  const rootReference = useRef<HTMLDivElement>(null)
  useGsapReveal(rootReference)

  return (
    <div data-testid="landing-root" ref={rootReference}>
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
