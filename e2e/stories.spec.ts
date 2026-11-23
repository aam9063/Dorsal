import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { readActivities } from '../src/core/export-reader'
import { buildYearSummary } from '../src/core/metrics/build-year-summary'
import { formatDuration, formatKilometres, formatNumber } from '../src/shared/format'
import { t } from '../src/shared/i18n'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function fixture(name: string): string {
  return path.join(ROOT, 'fixtures', 'generated', `${name}.csv`)
}

const NUMBERS_FIXTURE = 'runner-es'
const SKIPPED_PROFILE_FIXTURE = 'few-activities'

test.beforeAll(() => {
  for (const name of [NUMBERS_FIXTURE, SKIPPED_PROFILE_FIXTURE]) {
    if (!existsSync(fixture(name))) {
      execSync('pnpm fixtures', { cwd: ROOT, stdio: 'inherit' })
      break
    }
  }
})

/**
 * Opens the player on a fixture and pauses the automatic advance, so story
 * navigation in the assertions is deterministic.
 */
async function openPlayerOn(page: Page, name: string) {
  const { activities } = readActivities(readFileSync(fixture(name), 'utf8'))
  const summary = buildYearSummary(activities)

  await page.goto('/subir')
  await page.getByTestId('upload-input').setInputFiles(fixture(name))
  await expect(page.getByTestId('result-root')).toBeVisible()
  await page.getByTestId('result-open-player').click()
  await expect(page.getByTestId('player-root')).toBeVisible()

  await page.keyboard.press('Space')
  await expect(page.getByTestId('player-root')).toHaveAttribute('data-paused', 'true')

  return summary
}

test('story 02 shows the same totals the summary computes', async ({ page }) => {
  const summary = await openPlayerOn(page, NUMBERS_FIXTURE)
  const { totals } = summary
  const copy = t.stories['02-numeros']

  await page.getByTestId('player-zone-next').click()
  await expect(page.getByTestId('player-story-02-numeros')).toBeVisible()

  await expect(page.getByTestId('numeros-distance')).toHaveText(formatKilometres(totals.distanceM))
  await expect(page.getByTestId('numeros-laps')).toHaveText(
    formatNumber(Math.round(totals.trackLaps)),
  )
  await expect(page.getByTestId('numeros-moving-time')).toHaveText(
    formatDuration(totals.movingTimeS),
  )
  await expect(page.getByTestId('numeros-activities')).toHaveText(
    formatNumber(totals.activityCount),
  )
  await expect(page.getByTestId('numeros-active-days')).toHaveText(formatNumber(totals.activeDays))
  await expect(page.getByTestId('numeros-elevation')).toHaveText(
    formatNumber(totals.elevationGainM),
  )
  await expect(page.getByTestId('numeros-everests')).toHaveText(
    formatNumber(Math.round(totals.everests * 10) / 10),
  )

  const splitSentence = [
    copy.sportSplitAriaLead,
    ...totals.bySport.map(
      (row) => `${t.sports[row.sport]} ${formatNumber(Math.round(row.share * 100))} %`,
    ),
  ].join(' ')
  await expect(page.getByTestId('numeros-sport-split')).toHaveAttribute('aria-label', splitSentence)
})

test('story 03 is skipped and leaves no gap for a season with fewer than three active months', async ({
  page,
}) => {
  const summary = await openPlayerOn(page, SKIPPED_PROFILE_FIXTURE)
  expect(summary.monthlyProfile).toBeNull()
  expect(summary.consistency).not.toBeNull()

  const expected = ['01-portada', '02-numeros', '04-constancia']
  await expect(page.locator('[data-testid^="player-progress-bar-"]')).toHaveCount(expected.length)
  for (const id of expected) {
    await expect(page.getByTestId(`player-progress-bar-${id}`)).toBeAttached()
  }
  await expect(page.getByTestId('player-progress-bar-03-perfil')).toHaveCount(0)
  await expect(page.getByTestId('player-story-03-perfil')).toHaveCount(0)

  // Walking forward skips the omitted story without leaving a gap in the order.
  await page.getByTestId('player-zone-next').click()
  await expect(page.getByTestId('player-story-02-numeros')).toBeVisible()
  await page.getByTestId('player-zone-next').click()
  await expect(page.getByTestId('player-root')).toHaveAttribute('data-index', '2')
  await expect(page.getByTestId('player-story-04-constancia')).toBeVisible()
})

test('story 04 renders one cell per day with activity', async ({ page }) => {
  const summary = await openPlayerOn(page, NUMBERS_FIXTURE)
  if (summary.consistency === null) {
    throw new Error('runner-es must have active days for the heatmap')
  }

  // Stories run in registry order: 01 → 02 → 03 → 04 for this fixture.
  for (let step = 0; step < 3; step += 1) {
    await page.getByTestId('player-zone-next').click()
  }
  await expect(page.getByTestId('player-story-04-constancia')).toBeVisible()

  await expect(page.getByTestId('constancia-heatmap')).toBeVisible()
  await expect(page.locator('[data-testid^="constancia-cell-"]')).toHaveCount(
    summary.consistency.heatmap.length,
  )
})

test('the name field on the portada can be tapped and typed without changing story', async ({
  page,
}) => {
  await openPlayerOn(page, 'runner-es')

  const root = page.getByTestId('player-root')
  await expect(root).toHaveAttribute('data-index', '0')

  const field = page.getByTestId('portada-name-input')
  await field.click()
  await expect(field).toBeFocused()
  await field.fill('Lucía')

  await expect(field).toHaveValue('Lucía')
  await expect(root).toHaveAttribute('data-index', '0')
})
