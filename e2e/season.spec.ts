import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { readActivities } from '../src/core/export-reader'
import { buildYearSummary } from '../src/core/metrics/build-year-summary'
import { formatDuration, formatKilometres, formatNumber } from '../src/shared/format'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FIXTURE = path.join(ROOT, 'fixtures', 'generated', 'runner-es.csv')

test.beforeAll(() => {
  if (!existsSync(FIXTURE)) {
    execSync('pnpm fixtures', { cwd: ROOT, stdio: 'inherit' })
  }
})

test('shows the 2026 season numbers after the worker reads the export', async ({ page }) => {
  const { activities } = readActivities(readFileSync(FIXTURE, 'utf8'))
  const summary = buildYearSummary(activities)
  expect(summary.totals.activityCount).toBeGreaterThan(0)

  await page.goto('/subir')
  await page.getByTestId('upload-input').setInputFiles(FIXTURE)

  await expect(page.getByTestId('result-root')).toBeVisible()
  await expect(page.getByTestId('result-total-distance')).toHaveText(
    formatKilometres(summary.totals.distanceM),
  )
  await expect(page.getByTestId('result-total-moving-time')).toHaveText(
    formatDuration(summary.totals.movingTimeS),
  )
  await expect(page.getByTestId('result-total-activities')).toHaveText(
    formatNumber(summary.totals.activityCount),
  )
  await expect(page.getByTestId('result-total-active-days')).toHaveText(
    formatNumber(summary.totals.activeDays),
  )
  await expect(page.getByTestId('result-total-elevation')).toHaveText(
    formatNumber(summary.totals.elevationGainM),
  )
})

test('has no serious or critical accessibility violations with the season numbers', async ({
  page,
}) => {
  await page.goto('/subir')
  await page.getByTestId('upload-input').setInputFiles(FIXTURE)

  await expect(page.getByTestId('result-root')).toBeVisible()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(blocking.map((violation) => `${violation.id}: ${violation.nodes.length} node(s)`)).toEqual(
    [],
  )
})
