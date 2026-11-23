import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { formatNumber } from '../src/shared/format'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FIXTURES = path.join(ROOT, 'fixtures', 'generated')

/** Local file header of any zip archive, the bytes a renamed export still carries. */
const ZIP_HEADER = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x0a, 0x00, 0x00, 0x00])

const OVERSIZE_BYTES = 50 * 1024 * 1024 + 1

/**
 * The oversized probe must be a real file: `setInputFiles` refuses buffers
 * larger than 50 MB. It lives in a system temp directory that this spec removes.
 */
let oversizePath: string | null = null

function csvFixture(name: string): string {
  return path.join(FIXTURES, `${name}.csv`)
}

function oversizeFile(): string {
  if (oversizePath === null) {
    throw new Error('the oversized fixture was not created')
  }
  return oversizePath
}

test.beforeAll(async () => {
  if (!existsSync(path.join(FIXTURES, 'no-2026.csv'))) {
    execSync('pnpm fixtures', { cwd: ROOT, stdio: 'inherit' })
  }
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dorsal-e2e-'))
  oversizePath = path.join(dir, 'activities.csv')
  await writeFile(oversizePath, Buffer.alloc(OVERSIZE_BYTES, 0x61))
})

test.afterAll(async () => {
  if (oversizePath !== null) {
    await rm(path.dirname(oversizePath), { recursive: true, force: true })
    oversizePath = null
  }
})

/** Removes the APIs the flow needs so the unsupported state renders instead of the picker. */
async function hideBrowserApis(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const globals = window as Partial<Record<'Worker' | 'File' | 'FileReader', unknown>>
    globals.Worker = undefined
    globals.File = undefined
    globals.FileReader = undefined
  })
}

test('refuses a .zip by name before the worker sees it', async ({ page }) => {
  await page.goto('/subir')
  await page
    .getByTestId('upload-input')
    .setInputFiles({ name: 'export.zip', mimeType: 'application/zip', buffer: ZIP_HEADER })

  await expect(page.getByTestId('upload-error-extension')).toBeVisible()

  const picker = page.getByTestId('upload-input')
  await picker.setInputFiles(csvFixture('runner-es'))
  await expect(page.getByTestId('result-root')).toBeVisible()
})

test('refuses the zip even when it is renamed to .csv', async ({ page }) => {
  await page.goto('/subir')
  await page.getByTestId('upload-input').setInputFiles({
    name: 'activities.csv',
    mimeType: 'text/csv',
    buffer: ZIP_HEADER,
  })

  await expect(page.getByTestId('upload-error-zip')).toBeVisible()
})

test('refuses a CSV that is not a Strava export', async ({ page }) => {
  await page.goto('/subir')
  await page.getByTestId('upload-input').setInputFiles({
    name: 'activities.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,count\nLucía,3\nPaco,7'),
  })

  await expect(page.getByTestId('upload-error-not-strava')).toBeVisible()
})

test('refuses a file over the size limit', async ({ page }) => {
  await page.goto('/subir')
  await page.getByTestId('upload-input').setInputFiles(oversizeFile())

  await expect(page.getByTestId('upload-error-size')).toBeVisible()
})

test('refuses to open the wrapped with the real counts when no activity is from 2026', async ({
  page,
}) => {
  await page.goto('/subir')
  await page.getByTestId('upload-input').setInputFiles(csvFixture('no-2026'))

  await expect(page.getByTestId('upload-error-no-2026')).toBeVisible()
  await expect(page.getByTestId('upload-error-no-2026')).toContainText('192')
  await expect(page.getByTestId('result-root')).toHaveCount(0)
})

test('warns about corrupt rows next to the season numbers', async ({ page }) => {
  await page.goto('/subir')
  await page.getByTestId('upload-input').setInputFiles(csvFixture('broken-rows'))

  await expect(page.getByTestId('result-root')).toBeVisible()
  await expect(page.getByTestId('upload-warning-corrupt')).toContainText(formatNumber(2))
  await expect(page.getByTestId('result-total-distance')).toBeVisible()
  await expect(page.getByTestId('result-total-activities')).toBeVisible()
})

test('explains the missing browser APIs before rendering the picker', async ({ page }) => {
  await hideBrowserApis(page)
  await page.goto('/subir')

  await expect(page.getByTestId('upload-error-unsupported')).toBeVisible()
  await expect(page.getByTestId('upload-input')).toHaveCount(0)
})

test('has no serious or critical accessibility violations on any new state', async ({ page }) => {
  const states: { name: string; testId: string; arrive: () => Promise<void> }[] = [
    {
      name: 'extension',
      testId: 'upload-error-extension',
      arrive: async () => {
        await page
          .getByTestId('upload-input')
          .setInputFiles({ name: 'export.zip', mimeType: 'application/zip', buffer: ZIP_HEADER })
      },
    },
    {
      name: 'size',
      testId: 'upload-error-size',
      arrive: async () => {
        await page.getByTestId('upload-input').setInputFiles(oversizeFile())
      },
    },
    {
      name: 'zip',
      testId: 'upload-error-zip',
      arrive: async () => {
        await page.getByTestId('upload-input').setInputFiles({
          name: 'activities.csv',
          mimeType: 'text/csv',
          buffer: ZIP_HEADER,
        })
      },
    },
    {
      name: 'not-strava',
      testId: 'upload-error-not-strava',
      arrive: async () => {
        await page.getByTestId('upload-input').setInputFiles({
          name: 'activities.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('name,count\nLucía,3\nPaco,7'),
        })
      },
    },
    {
      name: 'no-2026',
      testId: 'upload-error-no-2026',
      arrive: async () => {
        await page.getByTestId('upload-input').setInputFiles(csvFixture('no-2026'))
      },
    },
    {
      name: 'corrupt',
      testId: 'upload-warning-corrupt',
      arrive: async () => {
        await page.getByTestId('upload-input').setInputFiles(csvFixture('broken-rows'))
      },
    },
    {
      /** Last: its init script hides the APIs for every navigation after it. */
      name: 'unsupported',
      testId: 'upload-error-unsupported',
      arrive: async () => {
        await hideBrowserApis(page)
        await page.reload()
      },
    },
  ]

  for (const state of states) {
    await page.goto('/subir')
    await state.arrive()
    await expect(page.getByTestId(state.testId)).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(
      blocking.map((violation) => `${state.name}: ${violation.id}: ${violation.nodes.length}`),
    ).toEqual([])
  }
})
