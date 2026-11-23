import { useState } from 'react'
import { useNavigate } from 'react-router'
import { t } from '../../shared/i18n'
import type { YearSummary } from '../../core/model/year-summary'
import { ProcessingScreen, handOffSeasonSummary } from '../processing'

export function UploadScreen() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)

  if (file !== null) {
    return (
      <ProcessingScreen
        file={file}
        onComplete={(summary: YearSummary) => {
          handOffSeasonSummary(summary)
          void navigate('/resultado')
        }}
        onCancel={() => setFile(null)}
      />
    )
  }

  return (
    <section
      data-testid="upload-root"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-10 sm:px-8"
    >
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
      <div>
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
            setFile(event.target.files?.[0] ?? null)
          }}
        />
      </div>
      <p className="text-sm text-fg-subtle" data-testid="upload-provisional">
        {t.upload.provisional}
      </p>
    </section>
  )
}
