import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { readActivities } from '../src/core/export-reader'
import { buildYearSummary } from '../src/core/metrics/build-year-summary'
import type { YearSummary } from '../src/core/model/year-summary'
import { t } from '../src/shared/i18n'
import { availableStories, STORIES } from '../src/features/wrapped/stories/registry'
import { BIB_CARD_FILE_NAME } from '../src/features/share/bib-card-io'

/** The PNG header members the download is asserted against (BRIEF §2, H-11). */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const

function fixture(name: string): string {
  return `fixtures/generated/${name}.csv`
}

async function openPlayerOn(page: Page, name: string): Promise<YearSummary> {
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

/** Advances the paused player one story per click, staying on the last one. */
function storyPosition(summary: YearSummary, id: string): number {
  const position = availableStories(STORIES, summary).findIndex((story) => story.id === id)
  if (position === -1) {
    throw new Error(`story ${id} is not available for this fixture summary`)
  }
  return position
}

async function openStory(page: Page, position: number): Promise<void> {
  for (let step = 0; step < position; step += 1) {
    await page.getByTestId('player-zone-next').click()
  }
}

/** True when this browser can really share the card as a file. */
function supportsShareFiles(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
      return false
    }
    try {
      return navigator.canShare({ files: [] })
    } catch {
      return false
    }
  })
}

declare global {
  interface Window {
    __dorsalShared?: { name: string; size: number; type: string } | null
    __readActivities?: never
  }
}

/**
 * Stubbing `navigator.share`/`canShare` fakes only the OS share sheet: the
 * label decision, the file construction and the call with the PNG stay real
 * (H-11 acceptance: the share path is exercised where the browser supports it).
 */
async function stubShare(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => true })
    Object.defineProperty(navigator, 'share', {
      value: (data: ShareData) => {
        const file = data.files?.[0]
        window.__dorsalShared =
          file === undefined ? null : { name: file.name, size: file.size, type: file.type }
        return Promise.resolve()
      },
    })
  })
}

test('story 08 renders the card preview with the season numbers and draws nothing', async ({
  page,
}) => {
  const summary = await openPlayerOn(page, 'runner-es')
  await openStory(page, storyPosition(summary, '08-dorsal'))

  await expect(page.getByTestId('player-story-08-dorsal')).toBeVisible()
  await expect(page.getByTestId('dorsal-preview')).toBeVisible()
  await expect(page.getByTestId('dorsal-number')).toHaveText(String(summary.bibCard.number))

  // The preview is DOM only: opening the story must not paint the canvas (h11 decision 6).
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('the action label states what will happen in this browser', async ({ page }) => {
  const summary = await openPlayerOn(page, 'runner-es')
  await openStory(page, storyPosition(summary, '08-dorsal'))

  const expected = (await supportsShareFiles(page))
    ? t.stories['08-dorsal'].shareLabel
    : t.stories['08-dorsal'].downloadLabel
  await expect(page.getByTestId('share-download')).toHaveText(expected)
})

test('the download path produces a 1080×1920 PNG, identical between runs', async ({ page }) => {
  const summary = await openPlayerOn(page, 'runner-es')
  await openStory(page, storyPosition(summary, '08-dorsal'))

  const first = await downloadBibCard(page)
  const second = await downloadBibCard(page)

  // Byte-for-byte determinism is the acceptance criterion (BRIEF §9, H-11).
  expect(second).toEqual(first)
  assertPng(first)
})

test('the share path hands the PNG file to navigator.share where supported', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'exercised on the mobile chromium project')
  await stubShare(page)

  const summary = await openPlayerOn(page, 'runner-es')
  await openStory(page, storyPosition(summary, '08-dorsal'))

  await expect(page.getByTestId('share-download')).toHaveText(t.stories['08-dorsal'].shareLabel)
  await page.getByTestId('share-download').click()
  await expect
    .poll(() => page.evaluate(() => window.__dorsalShared ?? null))
    .toEqual({ name: BIB_CARD_FILE_NAME, type: 'image/png', size: expect.any(Number) })
  const shared = await page.evaluate(() => window.__dorsalShared)
  expect(shared?.size ?? 0).toBeGreaterThan(10_000)
})

/** Presses the card's action and returns the downloaded file's bytes. */
async function downloadBibCard(page: Page): Promise<Buffer> {
  const download = page.waitForEvent('download')
  await page.getByTestId('share-download').click()
  const event = await download
  const downloadPath = await event.path()
  return readFile(downloadPath)
}

/** The PNG magic bytes and the IHDR width/height, big-endian at fixed offsets. */
function assertPng(bytes: Buffer): void {
  expect(Array.from(bytes.slice(0, 8))).toEqual([...PNG_SIGNATURE])
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  expect(view.getUint32(16)).toBe(1080)
  expect(view.getUint32(20)).toBe(1920)
  // Not blank: a card for the runner persona carries photo-like glyph data,
  // so the encoded PNG is far larger than a flat 1080×1920 rectangle would be.
  expect(bytes.byteLength).toBeGreaterThan(20_000)
}
