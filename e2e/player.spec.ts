import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { readActivities } from '../src/core/export-reader'
import { buildYearSummary } from '../src/core/metrics/build-year-summary'
import { availableStories, STORIES } from '../src/features/wrapped/stories/registry'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FIXTURE = path.join(ROOT, 'fixtures', 'generated', 'runner-es.csv')

/** The automatic advance of BRIEF §7. */
const AUTO_ADVANCE_MS = 7000

test.beforeAll(() => {
  if (!existsSync(FIXTURE)) {
    execSync('pnpm fixtures', { cwd: ROOT, stdio: 'inherit' })
  }
})

async function openPlayer(page: Page) {
  const { activities } = readActivities(readFileSync(FIXTURE, 'utf8'))
  const summary = buildYearSummary(activities)
  const available = availableStories(STORIES, summary)

  await page.goto('/subir')
  await page.getByTestId('upload-input').setInputFiles(FIXTURE)
  await expect(page.getByTestId('result-root')).toBeVisible()
  await page.getByTestId('result-open-player').click()
  await expect(page.getByTestId('player-root')).toBeVisible()

  return available
}

test('opens from the season numbers and shows one bar per available story', async ({ page }) => {
  const available = await openPlayer(page)
  expect(available.length).toBeGreaterThan(1)

  await expect(page.locator('[data-testid^="player-progress-bar-"]')).toHaveCount(available.length)
  // The player mounts exactly one story at a time (AnimatePresence popLayout).
  await expect(page.getByTestId('player-story-01-portada')).toBeVisible()
})

test('the right zone advances and the left zone goes back', async ({ page }) => {
  const available = await openPlayer(page)
  // Story 02 is never omitted (BRIEF §6), so advance and back are proven with
  // at least two available stories; the single-story clamps are gone.
  expect(available.length).toBeGreaterThan(1)
  const root = page.getByTestId('player-root')
  await expect(root).toHaveAttribute('data-index', '0')

  await page.getByTestId('player-zone-next').click()
  await expect(root).toHaveAttribute('data-index', '1')
  await expect(page.getByTestId('player-story-02-numeros')).toBeVisible()

  await page.getByTestId('player-zone-previous').click()
  await expect(root).toHaveAttribute('data-index', '0')
})

test('ArrowRight advances and ArrowLeft goes back', async ({ page }) => {
  const available = await openPlayer(page)
  expect(available.length).toBeGreaterThan(1)
  const root = page.getByTestId('player-root')
  await expect(root).toHaveAttribute('data-index', '0')

  await page.keyboard.press('ArrowRight')
  await expect(root).toHaveAttribute('data-index', '1')
  await expect(page.getByTestId('player-story-02-numeros')).toBeVisible()

  await page.keyboard.press('ArrowLeft')
  await expect(root).toHaveAttribute('data-index', '0')
})

test('Space pauses and resumes', async ({ page }) => {
  await openPlayer(page)
  const root = page.getByTestId('player-root')

  await page.keyboard.press('Space')
  await expect(root).toHaveAttribute('data-paused', 'true')

  await page.keyboard.press('Space')
  await expect(root).toHaveAttribute('data-paused', 'false')
})

test('holding pauses, the story does not change while held, releasing resumes', async ({
  page,
}) => {
  const available = await openPlayer(page)
  expect(available.length).toBeGreaterThan(1)
  const root = page.getByTestId('player-root')
  const zone = page.getByTestId('player-zone-next')

  await zone.dispatchEvent('pointerdown')
  await expect(root).toHaveAttribute('data-paused', 'true')

  // The hold outlasts the automatic advance. Instead of a fixed sleep, poll
  // until real elapsed time passes the advance delay while the story stays put
  // (review of H-08: no unconditional waitForTimeout in a negative assertion).
  const startedAt = Date.now()
  const holdMs = AUTO_ADVANCE_MS + 1500
  await expect
    .poll(
      async () => {
        const index = await root.getAttribute('data-index')
        const paused = await root.getAttribute('data-paused')
        const elapsed = Date.now() - startedAt
        return elapsed >= holdMs && index === '0' && paused === 'true' ? 'held' : 'drifted'
      },
      { timeout: holdMs + 10_000, intervals: [250, 500] },
    )
    .toBe('held')

  await zone.dispatchEvent('pointerup')
  await expect(root).toHaveAttribute('data-paused', 'false')
})

test('Escape and the close button both return to the season numbers', async ({ page }) => {
  await openPlayer(page)
  const totals = page.getByTestId('result-totals')

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('player-root')).toHaveCount(0)
  await expect(totals).toBeVisible()

  await page.getByTestId('result-open-player').click()
  await expect(page.getByTestId('player-root')).toBeVisible()

  await page.getByTestId('player-close').click()
  await expect(page.getByTestId('player-root')).toHaveCount(0)
  await expect(totals).toBeVisible()
})

test.describe('with prefers-reduced-motion: reduce', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the story does not advance on its own', async ({ page }) => {
    await openPlayer(page)

    // Kept as a real elapsed-time measurement: under reduced motion there is
    // no event or state change to poll for — the absence of the advance IS the
    // assertion, so the wait must genuinely cover the advance delay.
    await page.waitForTimeout(AUTO_ADVANCE_MS + 1500)
    await expect(page.getByTestId('player-root')).toHaveAttribute('data-index', '0')
  })
})
