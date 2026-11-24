import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
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
const GEAR_FIXTURE = 'shoe-retired'
const BIKES_FIXTURE = 'cyclist'
const SKIPPED_GEAR_FIXTURE = 'no-gear'

test.beforeAll(() => {
  for (const name of [
    NUMBERS_FIXTURE,
    SKIPPED_PROFILE_FIXTURE,
    GEAR_FIXTURE,
    BIKES_FIXTURE,
    SKIPPED_GEAR_FIXTURE,
  ]) {
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

  const expected = ['01-portada', '02-numeros', '04-constancia', '06-material']
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

/** Advances the paused player one story per click, staying on the last one. */
async function openStory(page: Page, position: number) {
  for (let step = 0; step < position; step += 1) {
    await page.getByTestId('player-zone-next').click()
  }
}

test('story 06 shows the star gear with its hours and its kilometres', async ({ page }) => {
  const summary = await openPlayerOn(page, GEAR_FIXTURE)
  const gear = summary.gear
  if (gear === null || gear.star === null) {
    throw new Error('shoe-retired must have assigned gear with a star')
  }
  const starItem = gear.items.find((item) => item.name === gear.star)
  if (starItem === undefined) {
    throw new Error('the star gear must appear in the ranked list')
  }
  // The persona guarantees shoes over 800 km in 2026, so they are flagged.
  expect(starItem.needsRetiring).toBe(true)
  expect(starItem.distanceM).toBeGreaterThan(800_000)
  expect(gear.items).toHaveLength(3)

  // Stories run in registry order 01 → 02 → 03 → 04 → 06 for this fixture.
  await openStory(page, 4)
  await expect(page.getByTestId('player-story-06-material')).toBeVisible()

  const copy = t.stories['06-material']
  await expect(page.getByTestId('material-star-lead')).toHaveText(copy.starLead.shoes)
  await expect(page.getByTestId('material-star-name')).toHaveText(gear.star)
  await expect(page.getByTestId('material-star-hours')).toHaveText(
    formatDuration(starItem.movingTimeS),
  )
  await expect(page.getByTestId('material-star-km')).toHaveText(
    `${formatKilometres(starItem.distanceM)} km`,
  )
  await expect(page.locator('[data-testid^="material-row-"]')).toHaveCount(gear.items.length)
})

test('story 06 puts the retirement badge only on the flagged item', async ({ page }) => {
  await openPlayerOn(page, GEAR_FIXTURE)
  await openStory(page, 4)
  await expect(page.getByTestId('player-story-06-material')).toBeVisible()

  const flagged = page.getByTestId('material-row-0')
  await expect(flagged.getByTestId('material-retired-badge')).toBeVisible()
  await expect(
    page.getByTestId('material-row-1').getByTestId('material-retired-badge'),
  ).toHaveCount(0)
  await expect(
    page.getByTestId('material-row-2').getByTestId('material-retired-badge'),
  ).toHaveCount(0)
})

test('story 06 speaks of bikes when the dominant sport is the bike', async ({ page }) => {
  const summary = await openPlayerOn(page, BIKES_FIXTURE)
  expect(summary.gear?.showsBikes).toBe(true)

  // Stories run in registry order 01 → 02 → 03 → 04 → 06 for this fixture.
  await openStory(page, 4)
  await expect(page.getByTestId('player-story-06-material')).toBeVisible()

  await expect(page.getByTestId('material-star-lead')).toHaveText(
    t.stories['06-material'].starLead.bikes,
  )
})

test('story 06 is omitted without gear and leaves no gap in the progress bars', async ({
  page,
}) => {
  const summary = await openPlayerOn(page, SKIPPED_GEAR_FIXTURE)
  expect(summary.gear).toBeNull()

  await expect(page.locator('[data-testid^="player-progress-bar-"]')).toHaveCount(4)
  await expect(page.getByTestId('player-progress-bar-06-material')).toHaveCount(0)
  await expect(page.getByTestId('player-story-06-material')).toHaveCount(0)

  // Walking through every available story never lands on the omitted one.
  for (let step = 0; step < 3; step += 1) {
    await page.getByTestId('player-zone-next').click()
  }
  await expect(page.getByTestId('player-story-04-constancia')).toBeVisible()
})

test('story 06 has no serious or critical axe violations', async ({ page }) => {
  await openPlayerOn(page, GEAR_FIXTURE)
  await openStory(page, 4)
  await expect(page.getByTestId('player-story-06-material')).toBeVisible()

  // The capture must wait for the enter animation's final state: axe reads
  // blended colours while the story is still fading in.
  await expect
    .poll(() =>
      page.getByTestId('player-story-06-material').evaluate((el) => getComputedStyle(el).opacity),
    )
    .toBe('1')

  const results = await new AxeBuilder({ page })
    .include('[data-testid="player-story-06-material"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(blocking.map((violation) => `${violation.id}: ${violation.nodes.length} node(s)`)).toEqual(
    [],
  )
})
