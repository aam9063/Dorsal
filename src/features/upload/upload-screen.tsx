import { useState } from 'react'
import { useNavigate } from 'react-router'
import { t, uploadNoSeasonMessage, uploadUnsupportedMessage } from '../../shared/i18n'
import type { AnalyzeReadStats, YearSummary } from '../../worker/client'
import { ProcessingScreen, handOffSeasonSummary } from '../processing'
import { quickValidate } from './quick-validation'

const SECTION_CLASS = 'mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:px-8'

/**
 * Every state the upload screen renders itself. The two worker failures with
 * their own copy (`zipInsteadOfCsv`, `notStrava`) render on the processing
 * screen, still at `/subir` (odd/tasks/h06-upload-errors.md, T3).
 */
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

function problemTitle(problem: UploadProblem): string {
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

function problemBody(problem: UploadProblem): string {
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

function FilePicker({ onChoose }: { onChoose: (file: File) => void }) {
  return (
    <div
      data-testid="upload-dropzone"
      onDragOver={(event) => {
        event.preventDefault()
      }}
      onDrop={(event) => {
        event.preventDefault()
        const file = event.dataTransfer.files.item(0)
        if (file !== null) {
          onChoose(file)
        }
      }}
      className="rounded-panel border border-line bg-surface p-6"
    >
      <label
        htmlFor="upload-file"
        className="inline-flex min-h-11 cursor-pointer items-center rounded-pill bg-accent px-8 font-semibold text-ink"
      >
        {t.upload.pickFile}
      </label>
      <input
        id="upload-file"
        data-testid="upload-input"
        type="file"
        accept=".csv"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file !== undefined) {
            onChoose(file)
          }
        }}
      />
      <p className="mt-3 text-sm text-fg-subtle">{t.upload.dropHere}</p>
    </div>
  )
}

function ProblemSection({
  problem,
  onChoose,
}: {
  problem: UploadProblem
  onChoose: (file: File) => void
}) {
  return (
    <section data-testid={problemTestId(problem)} className={SECTION_CLASS}>
      <h1 className="text-5xl">{problemTitle(problem)}</h1>
      <p className="text-base text-fg-muted" role="alert">
        {problemBody(problem)}
      </p>
      {problem.kind !== 'unsupported' && (
        <>
          <p className="text-sm text-fg-subtle">{t.upload.retry}</p>
          <FilePicker onChoose={onChoose} />
        </>
      )}
    </section>
  )
}

export function UploadScreen() {
  const navigate = useNavigate()
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
    <section data-testid="upload-root" className={SECTION_CLASS}>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-subtle">
        {t.brand.tagline}
      </p>
      <h1 className="text-5xl">{t.upload.title}</h1>
      <p className="text-base text-fg-muted">{t.upload.subtitle}</p>
      <details className="rounded-panel border border-line bg-surface p-4">
        <summary className="cursor-pointer font-semibold">{t.upload.howto.title}</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-fg-muted">
          {t.upload.howto.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>
      <FilePicker onChoose={choose} />
      <p className="text-sm text-fg-subtle" data-testid="upload-hint">
        {t.upload.hint}
      </p>
    </section>
  )
}
