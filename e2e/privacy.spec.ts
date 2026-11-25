import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import { expect, test, type Page } from '@playwright/test'
import { readActivities } from '../src/core/export-reader'
import { buildYearSummary } from '../src/core/metrics/build-year-summary'
import type { YearSummary } from '../src/core/model/year-summary'
import { availableStories, STORIES } from '../src/features/wrapped/stories/registry'

/**
 * The `@privacy` enforcement of AGENTS.md 5.1, proven against the running app
 * (odd/tasks/h12-launch-hardening.md decisions 1 and 2; storage list amended
 * by odd/tasks/i18n-english.md, decision 4): after the file is
 * chosen, no request leaves the origin, the only worker and websocket traffic
 * is same-origin, nothing is written to browser storage except the two
 * interface preferences — the theme and the chosen language — and the export
 * never comes back out in any request. The test
 * observes behaviour, not the lint config, so a refactor that adds a `fetch`
 * fails here even if the ESLint rules are relaxed.
 *
 * `indexedDB.databases()` is not implemented in every browser engine; where it
 * is missing the test records a notice instead of asserting an empty list.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FIXTURE = path.join(ROOT, 'fixtures', 'generated', 'runner-es.csv')

const THEME_KEY = 'dorsal.theme'
const LANGUAGE_KEY = 'dorsal.lang'

test.beforeAll(() => {
  if (!existsSync(FIXTURE)) {
    execSync('pnpm fixtures', { cwd: ROOT, stdio: 'inherit' })
  }
})

/** The reader drops the activity name, so the marker comes from the raw rows. */
function firstActivityMarkers(): { name: string; id: string } {
  const parsed = Papa.parse<string[]>(readFileSync(FIXTURE, 'utf8'), { skipEmptyLines: true })
  const rows = parsed.data
  if (rows.length < 2) {
    throw new Error('runner-es.csv has no data row to take the privacy marker from')
  }
  const [header, firstRow] = rows
  if (header === undefined || firstRow === undefined) {
    throw new Error('runner-es.csv has no header row to locate the activity name column')
  }
  const nameColumn = header.indexOf('Nombre de la actividad')
  const name = nameColumn === -1 ? undefined : firstRow.at(nameColumn)
  if (name === undefined || name.trim() === '') {
    throw new Error('runner-es.csv has no usable activity name for the privacy marker')
  }
  const id = firstRow.at(0)
  if (id === undefined || id.trim() === '') {
    throw new Error('runner-es.csv has no usable activity id for the privacy marker')
  }
  return { name: name.trim(), id: id.trim() }
}

/** The app origin the whole flow is asserted against, from the e2e config. */
function expectedOrigin(): string {
  const baseURL = test.info().project.use.baseURL
  if (baseURL === undefined || baseURL === '') {
    throw new Error('the playwright config must set a baseURL for the privacy spec')
  }
  return new URL(baseURL).origin
}

interface RecordedRequest {
  method: string
  url: string
  body: Buffer | null
}

interface RecordedTraffic {
  requests: RecordedRequest[]
  workerUrls: string[]
  websocketUrls: string[]
}

/**
 * Records every request the context sees — the page, its scripts and any
 * dedicated worker share the same network context — plus the URLs of every
 * worker and websocket, from before the first navigation on.
 */
function startTrafficRecorder(page: Page): RecordedTraffic {
  const requests: RecordedRequest[] = []
  page.context().on('request', (request) => {
    requests.push({
      method: request.method(),
      url: request.url(),
      body: request.postDataBuffer() ?? null,
    })
  })
  const workerUrls: string[] = []
  page.on('worker', (worker) => {
    workerUrls.push(worker.url())
  })
  const websocketUrls: string[] = []
  page.on('websocket', (websocket) => {
    websocketUrls.push(websocket.url())
  })
  return { requests, workerUrls, websocketUrls }
}

/**
 * A URL violates the privacy boundary when it points at another origin.
 * `blob:` keeps the origin of the document that created it, `data:` and
 * `about:` never leave the machine, and websockets carry the same rules with
 * their own scheme. Everything else — any http(s) or ws(s) host the page does
 * not live on — is a leak.
 */
function crossesOrigin(url: string, origin: string): boolean {
  try {
    const parsed = new URL(url)
    switch (parsed.protocol) {
      case 'http:':
      case 'https:':
        return parsed.origin !== origin
      case 'ws:':
      case 'wss:':
        return parsed.origin !== origin.replace(/^http/, 'ws')
      case 'blob:':
        return crossesOrigin(parsed.pathname, origin)
      case 'data:':
      case 'about:':
        return false
      default:
        return true
    }
  } catch {
    return true
  }
}

function crossOriginEntries(records: { method: string; url: string }[], origin: string): string[] {
  return records
    .filter((record) => crossesOrigin(record.url, origin))
    .map((record) => `${record.method} ${record.url}`)
}

/**
 * The one documented allowance in this spec, for a connection the app does not
 * make. Albert's editor injects its console instrumentation into every local
 * dev page (the CDP initiator was an anonymous eval script, and the listener
 * process was VS Code's Console Ninja extension), which opens a bare
 * `ws://127.0.0.1:<port>/` back to its own server. It exists only in local
 * development: it is not in `src/`, it is not in any bundle, and it never runs
 * on CI or in production. The signature is kept as narrow as the observed
 * behaviour: loopback host, no query, no path. Anything else on loopback, and
 * every non-loopback host, still fails the websocket assertion above.
 */
function editorInstrumentationWebsocket(url: string): boolean {
  return /^ws:\/\/127\.0\.0\.1:\d+\/$/.test(url)
}

interface BrowserStorage {
  localStorage: Record<string, string>
  sessionStorage: Record<string, string>
  cookies: string
  databases: { name: string | null; version: number }[] | null
}

/** Reads every persistence surface on the tested page, right now. */
async function readBrowserStorage(page: Page): Promise<BrowserStorage> {
  return page.evaluate(async () => {
    const readStorage = (storage: Storage): Record<string, string> => {
      const entries: Record<string, string> = {}
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index)
        if (key !== null) {
          entries[key] = storage.getItem(key) ?? ''
        }
      }
      return entries
    }
    return {
      localStorage: readStorage(window.localStorage),
      sessionStorage: readStorage(window.sessionStorage),
      cookies: document.cookie,
      databases:
        typeof indexedDB.databases === 'function'
          ? await indexedDB.databases().then((list) =>
              list.map((database) => ({
                name: database.name ?? null,
                version: database.version ?? 0,
              })),
            )
          : null,
    }
  })
}

/** Walks the whole user journey: landing, upload, processing, stories and card export. */
async function runFullFlow(page: Page, summary: YearSummary): Promise<void> {
  await page.goto('/')
  await page.goto('/subir')

  await page.getByTestId('upload-input').setInputFiles(FIXTURE)
  await expect(page.getByTestId('result-root')).toBeVisible()

  await page.getByTestId('result-open-player').click()
  await expect(page.getByTestId('player-root')).toBeVisible()
  await page.keyboard.press('Space')
  await expect(page.getByTestId('player-root')).toHaveAttribute('data-paused', 'true')

  const storyCount = availableStories(STORIES, summary).length
  for (let position = 1; position < storyCount; position += 1) {
    await page.getByTestId('player-zone-next').click()
    await expect(page.getByTestId('player-root')).toHaveAttribute('data-index', String(position))
  }

  const download = page.waitForEvent('download')
  await page.getByTestId('share-download').click()
  await download
}

function seasonSummary(): YearSummary {
  const { activities } = readActivities(readFileSync(FIXTURE, 'utf8'))
  return buildYearSummary(activities)
}

test('no request leaves the origin during the whole wrapped flow, and the only methods are GETs @privacy', async ({
  page,
}) => {
  const origin = expectedOrigin()
  const traffic = startTrafficRecorder(page)
  await runFullFlow(page, seasonSummary())

  const violations = crossOriginEntries(traffic.requests, origin)
  expect(violations).toEqual([])

  const nonGetRequests = traffic.requests.filter((request) => request.method !== 'GET')
  expect(nonGetRequests.map((request) => `${request.method} ${request.url}`)).toEqual([])

  // The recorder must have seen real traffic, otherwise the empty violation
  // list above proves nothing about the app.
  expect(traffic.requests.length).toBeGreaterThan(0)
})

test('the analysis worker and every websocket stay on the same origin @privacy', async ({
  page,
}) => {
  const origin = expectedOrigin()
  const traffic = startTrafficRecorder(page)
  await runFullFlow(page, seasonSummary())

  const workerViolations = traffic.workerUrls.filter((url) => crossesOrigin(url, origin))
  expect(workerViolations).toEqual([])

  // The analysis worker must really have been observed, or the empty list
  // proves nothing about the worker the app spawns for the file.
  expect(traffic.workerUrls.length).toBeGreaterThan(0)

  const websocketViolations = traffic.websocketUrls.filter(
    (url) => crossesOrigin(url, origin) && !editorInstrumentationWebsocket(url),
  )
  expect(websocketViolations).toEqual([])
})

test('the export file never travels back inside any request @privacy', async ({ page }) => {
  const traffic = startTrafficRecorder(page)
  const { name, id } = firstActivityMarkers()
  await runFullFlow(page, seasonSummary())

  const encodedName = encodeURIComponent(name)
  const leaks = traffic.requests
    .map((request) => JSON.stringify({ method: request.method, url: request.url }))
    .filter((description) => description.includes(name) || description.includes(id))
    .concat(
      traffic.requests
        .filter(
          (request) =>
            request.body !== null &&
            (request.body.includes(name) ||
              request.body.includes(id) ||
              request.body.includes(encodedName)),
        )
        .map(
          (request) =>
            `${request.method} ${request.url} carried a body containing the export content`,
        ),
    )

  // The origin violations are reported on their own test; a leak of the file
  // contents is its own way of breaking the promise, so it fails here alone.
  expect(leaks).toEqual([])
})

test('the full wrapped flow writes nothing to browser storage @privacy', async ({ page }) => {
  await runFullFlow(page, seasonSummary())

  const storage = await readBrowserStorage(page)
  expect(storage.localStorage).toEqual({})
  expect(storage.sessionStorage).toEqual({})
  expect(storage.cookies).toBe('')

  if (storage.databases === null) {
    test.info().annotations.push({
      type: 'notice',
      description: 'this browser does not implement indexedDB.databases(); the list was not read',
    })
  } else {
    expect(storage.databases).toEqual([])
  }
})

test('changing the theme and the language writes exactly the two preferences, and nothing else @privacy', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('theme-option-dark').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByTestId('lang-option-en').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  const storage = await readBrowserStorage(page)
  expect(storage.localStorage).toEqual({
    [THEME_KEY]: 'dark',
    [LANGUAGE_KEY]: 'en',
  })
  expect(storage.sessionStorage).toEqual({})
  expect(storage.cookies).toBe('')

  if (storage.databases === null) {
    test.info().annotations.push({
      type: 'notice',
      description: 'this browser does not implement indexedDB.databases(); the list was not read',
    })
  } else {
    expect(storage.databases).toEqual([])
  }
})
