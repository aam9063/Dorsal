import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { uploadNoSeasonMessage, uploadUnsupportedMessage } from '../../shared/i18n'
import { useT } from '../../shared/hooks'
import type { Messages } from '../../shared/i18n'
import type { AnalyzeReadStats, YearSummary } from '../../worker/client'
import { ProcessingScreen, handOffSeasonSummary } from '../processing'
import { quickValidate } from './quick-validation'

const PLATE = 'relative rounded-[4px] bg-bone text-ink shadow-[0_16px_34px_rgba(15,16,13,0.4)]'
const PIN =
  'absolute top-3 size-[18px] rounded-full bg-ink shadow-[inset_3px_3px_5px_rgba(252,82,0,0.45)]'

/**
 * The primary action of the screen: a bone sticker with an ink label and a hard
 * orange offset shadow, the single primary treatment of the product
 * (design notes of 03-objeto-dorsal, rule 1). Orange is never a fill here.
 */
const CTA_CHIP =
  'inline-flex min-h-11 items-center rounded-chip bg-bone px-6 py-3 font-mono text-[13px] font-bold uppercase tracking-[0.1em] text-ink shadow-[4px_4px_0_var(--color-orange)] transition-shadow hover:shadow-[6px_6px_0_var(--color-orange)] active:shadow-[2px_2px_0_var(--color-orange)]'

/**
 * The editorial spine's numbered header band: display numeral and mono metadata
 * on the same baseline between two hairlines (odd/tasks/redesign-objeto-dorsal.md, S2).
 */
function SectionHeader({
  number,
  meta,
  spineLabel,
}: {
  number: string
  meta: string
  /** Mono spine label trailing inside the band at narrow widths. */
  spineLabel?: string
}) {
  return (
    <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y border-line py-2.5">
      <span
        aria-hidden="true"
        className="font-display text-[clamp(34px,3vw,40px)] leading-[1.1] text-accent-text"
      >
        {number}
      </span>
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">{meta}</span>
      {spineLabel !== undefined && (
        <span
          aria-hidden="true"
          className="ml-auto hidden font-mono text-[11px] uppercase tracking-[0.3em] text-fg-subtle min-[480px]:inline lg:hidden"
        >
          {spineLabel}
        </span>
      )}
    </header>
  )
}

function SpineColumn() {
  const t = useT()

  return (
    <div aria-hidden="true" className="hidden lg:block lg:border-r lg:border-line lg:pt-6">
      <span className="block rotate-180 whitespace-nowrap pr-3 text-right font-mono text-[11px] uppercase tracking-[0.3em] text-fg-subtle [writing-mode:vertical-rl]">
        {t.landing.spineLabel}
      </span>
    </div>
  )
}

/**
 * Screen shell of the object language: rotated spine at desktop, in-band mono
 * label at narrow widths (odd/tasks/redesign-objeto-dorsal.md, decision 3).
 */
function ScreenField({
  number,
  meta,
  testId,
  children,
}: {
  number: string
  meta: string
  testId?: string
  children: ReactNode
}) {
  const t = useT()

  return (
    <div
      data-testid={testId}
      className="mx-auto flex w-full max-w-[720px] flex-col px-5 py-10 sm:px-8 sm:py-14 lg:grid lg:grid-cols-[44px_minmax(0,1fr)] lg:gap-8"
    >
      <SpineColumn />
      <div className="flex min-w-0 flex-col">
        <SectionHeader number={number} meta={meta} spineLabel={t.landing.spineLabel} />
        {children}
      </div>
    </div>
  )
}

type UploadProblem =
  | { kind: 'unsupported'; missing: readonly string[] }
  | { kind: 'extension' }
  | { kind: 'size' }
  | { kind: 'noSeason'; totalRows: number }

/** The APIs the flow needs, checked before the picker renders. */
function missingBrowserApis(): string[] {
  const missing: string[] = []
  if (typeof Worker === 'undefined') {
    missing.push('Worker')
  }
  if (typeof File === 'undefined') {
    missing.push('File')
  }
  if (typeof FileReader === 'undefined') {
    missing.push('FileReader')
  }
  return missing
}

function problemTestId(problem: UploadProblem): string {
  switch (problem.kind) {
    case 'unsupported':
      return 'upload-error-unsupported'
    case 'extension':
      return 'upload-error-extension'
    case 'size':
      return 'upload-error-size'
    case 'noSeason':
      return 'upload-error-no-2026'
  }
}

function problemTitle(problem: UploadProblem, t: Messages): string {
  switch (problem.kind) {
    case 'unsupported':
      return t.upload.errors.unsupportedTitle
    case 'extension':
      return t.upload.errors.extensionTitle
    case 'size':
      return t.upload.errors.sizeTitle
    case 'noSeason':
      return t.upload.errors.noSeasonTitle
  }
}

function problemBody(problem: UploadProblem, t: Messages): string {
  switch (problem.kind) {
    case 'unsupported':
      return uploadUnsupportedMessage(problem.missing)
    case 'extension':
      return t.upload.errors.extensionBody
    case 'size':
      return t.upload.errors.sizeBody
    case 'noSeason':
      return uploadNoSeasonMessage(problem.totalRows)
  }
}

/**
 * The whole area is the control: a bone plate with punched pins, whose dashed
 * inner zone opens the file explorer when clicked and reacts while a file is
 * dragged over it. The input stays `sr-only` inside the label, so the keyboard
 * finds it, the pointer lands anywhere in the zone, and there is only one
 * focusable thing.
 */
function FilePicker({ onChoose }: { onChoose: (file: File) => void }) {
  const t = useT()
  const [isDragging, setIsDragging] = useState(false)

  const choose = (file: File | null | undefined): void => {
    if (file !== null && file !== undefined) {
      onChoose(file)
    }
  }

  return (
    <label
      htmlFor="upload-file"
      data-testid="upload-dropzone"
      data-dragging={isDragging}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(event) => {
        // Moving over a child fires dragleave on the label; only a drag that
        // really left the zone should drop the highlight.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDragging(false)
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        choose(event.dataTransfer.files.item(0))
      }}
      className={`${PLATE} -rotate-[0.8deg] flex cursor-pointer p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent`}
    >
      <span aria-hidden="true" className={`${PIN} left-6`} />
      <span aria-hidden="true" className={`${PIN} right-6`} />
      <span
        className={`flex min-h-[240px] w-full flex-col items-center justify-center gap-5 rounded-card border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? 'border-accent bg-bone-muted' : 'border-bone-soft'
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex h-14 w-14 items-center justify-center rounded-pill border-2 border-dashed transition-colors ${
            isDragging ? 'border-accent text-accent-on-bone' : 'border-bone-soft text-body-ink'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <path d="M12 16V4m0 0L7 9m5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
          </svg>
        </span>
        <span data-impeccable-ignore="hard-offset-shadow" className={CTA_CHIP}>
          {t.upload.pickFile}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-label-ink">
          {t.upload.dropHere}
        </span>
        <input
          id="upload-file"
          data-testid="upload-input"
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            choose(file)
          }}
        />
      </span>
    </label>
  )
}

/** The "how do I get it" help, in the plate language, as a pinned card. */
function HowToPlate() {
  const t = useT()

  return (
    <details className={`${PLATE} -rotate-[0.6deg] group p-6 sm:p-7`}>
      <span aria-hidden="true" className={`${PIN} left-5`} />
      <span aria-hidden="true" className={`${PIN} right-5`} />
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 pr-4 font-display text-[22px] uppercase leading-tight [&::-webkit-details-marker]:hidden">
        {t.upload.howto.title}
        <span aria-hidden="true" className="font-mono text-fg-subtle group-open:hidden">
          +
        </span>
        <span aria-hidden="true" className="hidden font-mono text-fg-subtle group-open:inline">
          −
        </span>
      </summary>
      <ol className="mt-4 flex flex-col gap-3 border-t-2 border-dashed border-bone-soft pt-4">
        {t.upload.howto.steps.map((step, index) => (
          <li
            key={step}
            className="flex gap-3 text-[15px] leading-relaxed text-body-ink [text-wrap:pretty]"
          >
            <span aria-hidden="true" className="mt-0.5 font-mono text-xs text-label-ink">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </details>
  )
}

function ProblemSection({
  problem,
  onChoose,
}: {
  problem: UploadProblem
  onChoose: (file: File) => void
}) {
  const t = useT()

  return (
    <ScreenField number="02" meta={t.upload.errorMeta}>
      <section data-testid={problemTestId(problem)} className="flex flex-col">
        <h1 className="mt-6 font-display text-[clamp(40px,6vw,56px)] uppercase leading-[0.98]">
          {problemTitle(problem, t)}
        </h1>
        <p
          className="mt-4 max-w-[60ch] text-base leading-relaxed text-fg-muted [text-wrap:pretty]"
          role="alert"
        >
          {problemBody(problem, t)}
        </p>
        {problem.kind !== 'unsupported' && (
          <>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.14em] text-accent-text">
              {t.upload.retry}
            </p>
            <div className="mt-4">
              <FilePicker onChoose={onChoose} />
            </div>
          </>
        )}
      </section>
    </ScreenField>
  )
}

export function UploadScreen() {
  const navigate = useNavigate()
  const t = useT()
  const [file, setFile] = useState<File | null>(null)
  const [problem, setProblem] = useState<UploadProblem | null>(null)

  const unsupported = missingBrowserApis()

  function choose(next: File): void {
    const validation = quickValidate(next)
    if (validation.kind === 'extension') {
      setProblem({ kind: 'extension' })
      return
    }
    if (validation.kind === 'size') {
      setProblem({ kind: 'size' })
      return
    }
    setProblem(null)
    setFile(next)
  }

  function handleComplete(summary: YearSummary, stats: AnalyzeReadStats): void {
    setFile(null)
    if (stats.inSeason === 0) {
      setProblem({ kind: 'noSeason', totalRows: stats.totalRows })
      return
    }
    handOffSeasonSummary({ summary, stats })
    void navigate('/resultado')
  }

  function handleCancel(): void {
    setFile(null)
    setProblem(null)
  }

  if (unsupported.length > 0) {
    return (
      <ProblemSection problem={{ kind: 'unsupported', missing: unsupported }} onChoose={choose} />
    )
  }

  if (file !== null) {
    return <ProcessingScreen file={file} onComplete={handleComplete} onCancel={handleCancel} />
  }

  if (problem !== null) {
    return <ProblemSection problem={problem} onChoose={choose} />
  }

  return (
    <ScreenField number="01" meta={t.upload.meta} testId="upload-root">
      <h1 className="mt-6 font-display text-[clamp(44px,6vw,60px)] uppercase leading-[0.98]">
        {t.upload.title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-fg-muted [text-wrap:pretty]">
        {t.upload.subtitle}
      </p>
      <div className="mt-8">
        <FilePicker onChoose={choose} />
      </div>
      <p
        className="mt-5 border-t border-dashed border-line pt-3 text-sm text-fg-subtle [text-wrap:pretty]"
        data-testid="upload-hint"
      >
        {t.upload.hint}
      </p>
      <div className="mt-10">
        <HowToPlate />
      </div>
    </ScreenField>
  )
}
