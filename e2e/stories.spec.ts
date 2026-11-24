import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readActivities } from '../src/core/export-reader'
import { buildYearSummary } from '../src/core/metrics/build-year-summary'
import { formatDuration, formatKilometres, formatNumber } from '../src/shared/format'
import { archetypePeakSentence, heartbeatCoverageSentence, t } from '../src/shared/i18n'
import { availableStories, STORIES } from '../src/features/wrapped/stories/registry'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function fixture(name: string): string {
  return path.join(ROOT, 'fixtures', 'generated', `${name}.csv`)
}

const NUMBERS_FIXTURE = 'runner-es'
const SKIPPED_PROFILE_FIXTURE = 'few-activities'
const GEAR_FIXTURE = 'shoe-retired'
const BIKES_FIXTURE = 'cyclist'
const SKIPPED_GEAR_FIXTURE = 'no-gear'
const ARCHETYPE_FIXTURE = 'multisport'
const SKIPPED_ARCHETYPE_FIXTURE = 'few-activities'
const HEARTBEATS_FIXTURE = 'cyclist'
const PEAKLESS_HEARTBEATS_FIXTURE = 'long-distance'
const SKIPPED_HEARTBEATS_FIXTURE = 'no-pulse'

test.beforeAll(() => {
  for (const name of [
    NUMBERS_FIXTURE,
    SKIPPED_PROFILE_FIXTURE,
    GEAR_FIXTURE,
    BIKES_FIXTURE,
    SKIPPED_GEAR_FIXTURE,
    ARCHETYPE_FIXTURE,
    SKIPPED_ARCHETYPE_FIXTURE,
    HEARTBEATS_FIXTURE,
    PEAKLESS_HEARTBEATS_FIXTURE,
    SKIPPED_HEARTBEATS_FIXTURE,
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

  const expected = availableStories(STORIES, summary).map((story) => story.id)
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

  // Stories run in registry order 01 → 02 → 04 (03 omitted) → 05 → 06 for this
  // fixture; the 06 position is read from the registry, not hardcoded.
  await openStory(page, storyPosition(summary, '06-material'))
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
  const summary = await openPlayerOn(page, GEAR_FIXTURE)
  await openStory(page, storyPosition(summary, '06-material'))
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

  // Stories run in registry order 01 → 02 → 04 → 06 for this fixture; the 06
  // position is read from the registry, not hardcoded.
  await openStory(page, storyPosition(summary, '06-material'))
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

  await expect(page.locator('[data-testid^="player-progress-bar-"]')).toHaveCount(
    availableStories(STORIES, summary).length,
  )
  await expect(page.getByTestId('player-progress-bar-06-material')).toHaveCount(0)
  await expect(page.getByTestId('player-story-06-material')).toHaveCount(0)

  // Walking through every available story never lands on the omitted one.
  for (let step = 0; step < 3; step += 1) {
    await page.getByTestId('player-zone-next').click()
  }
  await expect(page.getByTestId('player-story-04-constancia')).toBeVisible()
})

test('story 06 has no serious or critical axe violations', async ({ page }) => {
  const summary = await openPlayerOn(page, GEAR_FIXTURE)
  await openStory(page, storyPosition(summary, '06-material'))
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

/** Position of a story in the available list, which is what the player plays. */
function storyPosition(summary: ReturnType<typeof buildYearSummary>, id: string): number {
  const position = availableStories(STORIES, summary).findIndex((story) => story.id === id)
  if (position === -1) {
    throw new Error(`story ${id} is not available for this fixture summary`)
  }
  return position
}

test('story 05 names the archetype and labels the peak hour of the clock', async ({ page }) => {
  const summary = await openPlayerOn(page, ARCHETYPE_FIXTURE)
  const archetype = summary.archetype
  if (archetype === null) {
    throw new Error('multisport must produce an archetype')
  }
  const copy = t.stories['05-arquetipo']

  await openStory(page, storyPosition(summary, '05-arquetipo'))
  await expect(page.getByTestId('player-story-05-arquetipo')).toBeVisible()

  await expect(page.getByTestId('arquetipo-name')).toHaveText(
    copy.archetypeNames[archetype.primary],
  )
  await expect(page.getByTestId('arquetipo-secondary')).toContainText(
    copy.archetypeNames[archetype.secondary],
  )
  await expect(page.getByTestId('arquetipo-clock')).toBeVisible()

  const totalStarts = archetype.startHours.reduce((sum, count) => sum + count, 0)
  const peakCount = Math.max(...archetype.startHours)
  const peakHour = archetype.startHours.indexOf(peakCount)
  await expect(page.getByTestId('arquetipo-peak-hour')).toHaveText(
    archetypePeakSentence(Math.round((peakCount / totalStarts) * 100), `${peakHour}:00`),
  )
})

test('story 05 is skipped below ten activities and leaves no gap in the bars', async ({ page }) => {
  const summary = await openPlayerOn(page, SKIPPED_ARCHETYPE_FIXTURE)
  expect(summary.archetype).toBeNull()
  expect(summary.availability.archetype).toBe(false)

  const availableIds = availableStories(STORIES, summary).map((story) => story.id)
  await expect(page.locator('[data-testid^="player-progress-bar-"]')).toHaveCount(
    availableIds.length,
  )
  await expect(page.getByTestId('player-progress-bar-05-arquetipo')).toHaveCount(0)
  await expect(page.getByTestId('player-story-05-arquetipo')).toHaveCount(0)

  // Walking through every available story never lands on the omitted one.
  for (let step = 0; step < availableIds.length - 1; step += 1) {
    await page.getByTestId('player-zone-next').click()
  }
  const lastId = availableIds[availableIds.length - 1]
  if (lastId === undefined) {
    throw new Error('a summary always keeps at least one story')
  }
  await expect(page.getByTestId(`player-story-${lastId}`)).toBeVisible()
  await expect(page.getByTestId('player-root')).toHaveAttribute(
    'data-index',
    String(availableIds.length - 1),
  )
})

test('story 07 leads with the beats, the resting-days equivalence, the peak and the coverage', async ({
  page,
}) => {
  const summary = await openPlayerOn(page, HEARTBEATS_FIXTURE)
  const heartbeats = summary.heartbeats
  if (heartbeats === null) {
    throw new Error('cyclist must have season heartbeats')
  }
  if (heartbeats.peak === null) {
    throw new Error('cyclist must have a season peak')
  }
  const copy = t.stories['07-latidos']
  const twoDecimals = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  await openStory(page, storyPosition(summary, '07-latidos'))
  await expect(page.getByTestId('player-story-07-latidos')).toBeVisible()

  const hero =
    heartbeats.beats >= 1_000_000
      ? { text: twoDecimals.format(heartbeats.beats / 1_000_000), unit: copy.millionsUnit }
      : { text: formatNumber(Math.round(heartbeats.beats)), unit: copy.beatsUnit }
  await expect(page.getByTestId('latidos-beats')).toHaveText(hero.text)
  await expect(page.locator('[data-testid="latidos-beats"] ~ span').last()).toHaveText(hero.unit)

  const restingDays = Math.round(heartbeats.restingDays)
  await expect(page.getByTestId('latidos-resting-days')).toHaveText(
    `${formatNumber(restingDays)} ${restingDays === 1 ? copy.restingUnitSingular : copy.restingUnit}`,
  )

  const peak = heartbeats.peak
  await expect(page.getByTestId('latidos-peak')).toContainText(`${formatNumber(peak.bpm)} ppm`)
  await expect(page.getByTestId('latidos-peak')).toContainText(copy.peakLead)
  const peakMonth = t.months[peak.month - 1]
  if (peakMonth === undefined) {
    throw new Error('the peak month must name a real month')
  }
  await expect(page.getByTestId('latidos-peak')).toContainText(
    `el ${formatNumber(peak.day)} de ${peakMonth}`,
  )

  await expect(page.getByTestId('latidos-coverage')).toHaveText(
    heartbeatCoverageSentence(Math.round(heartbeats.coverage * 100)),
  )
})

test('story 07 renders without the peak block when no activity carries a maximum', async ({
  page,
}) => {
  const summary = await openPlayerOn(page, PEAKLESS_HEARTBEATS_FIXTURE)
  const heartbeats = summary.heartbeats
  if (heartbeats === null) {
    throw new Error('long-distance carries an average heart rate, so the story must render')
  }
  expect(heartbeats.peak).toBeNull()
  expect(heartbeats.beats).toBeGreaterThan(0)

  await openStory(page, storyPosition(summary, '07-latidos'))
  await expect(page.getByTestId('player-story-07-latidos')).toBeVisible()
  await expect(page.getByTestId('latidos-peak')).toHaveCount(0)
  await expect(page.getByTestId('latidos-beats')).toHaveText(
    formatNumber(Math.round(heartbeats.beats)),
  )
})

test('story 07 is omitted without heart rate data and leaves no gap in the bars', async ({
  page,
}) => {
  const summary = await openPlayerOn(page, SKIPPED_HEARTBEATS_FIXTURE)
  expect(summary.heartbeats).toBeNull()
  expect(summary.availability.heartbeats).toBe(false)

  const availableIds = availableStories(STORIES, summary).map((story) => story.id)
  await expect(page.locator('[data-testid^="player-progress-bar-"]')).toHaveCount(
    availableIds.length,
  )
  await expect(page.getByTestId('player-progress-bar-07-latidos')).toHaveCount(0)
  await expect(page.getByTestId('player-story-07-latidos')).toHaveCount(0)

  for (let step = 0; step < availableIds.length - 1; step += 1) {
    await page.getByTestId('player-zone-next').click()
  }
  const lastId = availableIds[availableIds.length - 1]
  if (lastId === undefined) {
    throw new Error('a summary always keeps at least one story')
  }
  await expect(page.getByTestId(`player-story-${lastId}`)).toBeVisible()
})

test('stories 05 and 07 have no serious or critical axe violations', async ({ page }) => {
  for (const [fixtureName, storyId] of [
    [ARCHETYPE_FIXTURE, '05-arquetipo'],
    [HEARTBEATS_FIXTURE, '07-latidos'],
  ] as const) {
    const summary = await openPlayerOn(page, fixtureName)
    await openStory(page, storyPosition(summary, storyId))
    const story = page.getByTestId(`player-story-${storyId}`)
    await expect(story).toBeVisible()

    // The capture must wait for the enter animation's final state: axe reads
    // blended colours while the story is still fading in.
    await expect.poll(() => story.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')

    const results = await new AxeBuilder({ page })
      .include(`[data-testid="player-story-${storyId}"]`)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const blocking = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(
      blocking.map((violation) => `${violation.id}: ${violation.nodes.length} node(s)`),
    ).toEqual([])
  }
})
