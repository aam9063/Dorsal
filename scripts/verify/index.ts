import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium, type Browser, type ConsoleMessage, type Page } from '@playwright/test'
import { createServer, type ViteDevServer } from 'vite'

const HOST = '127.0.0.1'
const PORT = 5173
const BASE_URL = `http://${HOST}:${PORT}`

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
} as const satisfies Record<string, { width: number; height: number }>

type ViewportName = keyof typeof VIEWPORTS

const ROUTES = [
  { path: '/', name: 'landing', root: '[data-testid="landing-root"]' },
  { path: '/subir', name: 'upload', root: '[data-testid="upload-root"]' },
  { path: '/resultado', name: 'result', root: '[data-testid="result-root"]' },
] as const

const NOT_IMPLEMENTED = ['--trace', '--heap'] as const

/** A main thread blocked longer than this stops being fluid (BRIEF §9, H-05). */
const LONG_TASK_BUDGET_MS = 50

declare global {
  interface Window {
    __dorsalLongTasks?: { name: string; startTime: number; duration: number }[]
  }
}

interface Options {
  viewport: ViewportName | 'both'
  theme: 'light' | 'dark' | 'both'
  fixture: string | null
  perf: boolean
}

interface VerificationFailure {
  screen: string
  message: string
}

interface ConsoleEntry {
  screen: string
  type: string
  text: string
}

interface NetworkEntry {
  screen: string
  url: string
  resourceType: string
}

function parseOptions(argv: readonly string[]): Options {
  const valueOf = (flag: string): string | undefined => {
    const index = argv.indexOf(flag)
    return index === -1 ? undefined : argv[index + 1]
  }

  const viewport = valueOf('--viewport') ?? 'both'
  const theme = valueOf('--theme') ?? 'both'

  const isViewport = (value: string): value is Options['viewport'] =>
    value === 'mobile' || value === 'desktop' || value === 'both'
  const isTheme = (value: string): value is Options['theme'] =>
    value === 'light' || value === 'dark' || value === 'both'

  if (!isViewport(viewport)) {
    throw new Error(`--viewport expects mobile, desktop or both, received "${viewport}"`)
  }
  if (!isTheme(theme)) {
    throw new Error(`--theme expects light, dark or both, received "${theme}"`)
  }

  for (const flag of NOT_IMPLEMENTED) {
    if (argv.includes(flag)) {
      throw new Error(
        `${flag} is not available yet: the upload flow it drives lands in H-06 and the trace, perf and heap capture land with H-12.`,
      )
    }
  }

  const fixture = valueOf('--fixture') ?? null
  if (fixture !== null && !existsSync(path.join('fixtures', 'generated', `${fixture}.csv`))) {
    throw new Error(
      `--fixture expects a generated fixture, "${fixture}" is missing: run pnpm fixtures first`,
    )
  }

  return { viewport, theme, fixture, perf: argv.includes('--perf') }
}

function selectedViewports(option: Options['viewport']): ViewportName[] {
  return option === 'both' ? ['mobile', 'desktop'] : [option]
}

function selectedThemes(option: Options['theme']): ('light' | 'dark')[] {
  return option === 'both' ? ['light', 'dark'] : [option]
}

function timestamp(): string {
  return new Date().toISOString().replaceAll(':', '-').replace(/\..+$/, '')
}

async function isServerUp(): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(1_000) })
    return response.ok
  } catch {
    return false
  }
}

async function ensureServer(): Promise<ViteDevServer | null> {
  if (await isServerUp()) {
    return null
  }
  const server = await createServer({
    server: { host: HOST, port: PORT, strictPort: true },
  })
  await server.listen()
  return server
}

function attachCollectors(
  page: Page,
  currentScreen: () => string,
  consoleLog: ConsoleEntry[],
  network: NetworkEntry[],
): void {
  page.on('console', (message: ConsoleMessage) => {
    consoleLog.push({ screen: currentScreen(), type: message.type(), text: message.text() })
  })
  page.on('pageerror', (error: Error) => {
    consoleLog.push({
      screen: currentScreen(),
      type: 'pageerror',
      text: `${error.name}: ${error.message}`,
    })
  })
  page.on('request', (request) => {
    network.push({
      screen: currentScreen(),
      url: request.url(),
      resourceType: request.resourceType(),
    })
  })
}

/**
 * Measures main-thread responsiveness. `PerformanceObserver` was tried first and
 * rejected on evidence: `longtask` never fired for a blocked page and
 * `long-animation-frame` reported inconsistently, both checked by blocking the
 * thread on purpose. A 10 ms interval whose ticks arrive late is what a blocked
 * thread actually looks like, and it caught a deliberate 220 ms block as 213 ms
 * of drift.
 */
const RESPONSIVENESS_TICK_MS = 10

interface ResponsivenessEntry {
  screen: string
  worstDriftMs: number
}

declare global {
  interface Window {
    __dorsalDrift?: number[]
  }
}

async function watchResponsiveness(page: Page): Promise<void> {
  await page.addInitScript((tick: number) => {
    window.__dorsalDrift = []
    let previous = performance.now()
    setInterval(() => {
      const now = performance.now()
      window.__dorsalDrift?.push(now - previous - tick)
      previous = now
    }, tick)
  }, RESPONSIVENESS_TICK_MS)
}

async function readWorstDrift(page: Page, screen: string): Promise<ResponsivenessEntry> {
  const worstDriftMs = await page.evaluate(() => {
    const samples = window.__dorsalDrift ?? []
    window.__dorsalDrift = []
    return samples.reduce((max, value) => Math.max(max, value), 0)
  })
  return { screen, worstDriftMs }
}

/**
 * Walks the wrapped with the player's own controls and saves one screenshot per
 * story. The walk stops when the index stops changing, so it never needs to know
 * how many stories a fixture produces.
 */
async function captureStories(
  page: Page,
  screensDir: string,
  viewport: ViewportName,
  theme: 'light' | 'dark',
): Promise<string[]> {
  const openButton = page.locator('[data-testid="result-open-player"]')
  if ((await openButton.count()) === 0) {
    return []
  }
  await openButton.click()
  await page.waitForSelector('[data-testid="player-root"]', { state: 'visible' })

  const shots: string[] = []
  for (let step = 0; step < 10; step += 1) {
    const index = await page.getAttribute('[data-testid="player-root"]', 'data-index')
    const file = path.join(screensDir, `story-${String(step)}-${viewport}-${theme}.png`)
    await page.screenshot({ path: file })
    shots.push(file)
    await page.locator('[data-testid="player-zone-next"]').click()
    const advanced = await page
      .waitForFunction(
        (previous) =>
          document.querySelector('[data-testid="player-root"]')?.getAttribute('data-index') !==
          previous,
        index,
        { timeout: 2_000 },
      )
      .then(() => true)
      .catch(() => false)
    // The cross-fade keeps both stories mounted for its duration; a capture
    // taken here would show two stories overprinted.
    await page
      .waitForFunction(
        () => document.querySelectorAll('[data-testid^="player-story-"]').length === 1,
        undefined,
        { timeout: 2_000 },
      )
      .catch(() => undefined)
    if (!advanced) {
      break
    }
  }
  await page.locator('[data-testid="player-close"]').click()
  return shots
}

function problemsOf(consoleLog: readonly ConsoleEntry[]): ConsoleEntry[] {
  return consoleLog.filter(
    (entry) => entry.type === 'error' || entry.type === 'pageerror' || entry.type === 'warning',
  )
}

async function run(): Promise<number> {
  const options = parseOptions(process.argv.slice(2))
  const outDir = path.join('artifacts', 'verify', timestamp())
  const screensDir = path.join(outDir, 'screens')
  await mkdir(screensDir, { recursive: true })

  const consoleLog: ConsoleEntry[] = []
  const network: NetworkEntry[] = []
  const screenshots: string[] = []
  const failures: VerificationFailure[] = []
  const responsiveness: ResponsivenessEntry[] = []

  let screen = 'startup'
  let server: ViteDevServer | null = null
  let browser: Browser | null = null

  try {
    server = await ensureServer()
    browser = await chromium.launch({ headless: true })

    for (const theme of selectedThemes(options.theme)) {
      for (const viewport of selectedViewports(options.viewport)) {
        const context = await browser.newContext({
          viewport: VIEWPORTS[viewport],
          colorScheme: theme,
          deviceScaleFactor: 1,
          locale: 'es-ES',
        })
        const page = await context.newPage()
        attachCollectors(page, () => screen, consoleLog, network)
        if (options.perf) {
          await watchResponsiveness(page)
        }

        try {
          for (const route of ROUTES) {
            screen = `${route.name}-${viewport}-${theme}`
            try {
              await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'load' })
              await page.waitForSelector(route.root, { state: 'visible' })
              const file = path.join(screensDir, `${screen}.png`)
              await page.screenshot({ path: file, fullPage: true })
              screenshots.push(file)
            } catch (error) {
              failures.push({
                screen,
                message: error instanceof Error ? error.message : String(error),
              })
            }
          }
          if (options.fixture !== null) {
            try {
              screen = `season-${viewport}-${theme}`
              await page.goto(`${BASE_URL}/subir`, { waitUntil: 'load' })
              await page.setInputFiles(
                '[data-testid="upload-input"]',
                path.join('fixtures', 'generated', `${options.fixture}.csv`),
              )
              await page
                .screenshot({
                  path: path.join(screensDir, `processing-${viewport}-${theme}.png`),
                  fullPage: true,
                })
                .catch(() => undefined)
              // A refused fixture is a legitimate outcome: `no-2026` renders an
              // error state instead of season numbers, so either is awaited.
              await page.waitForSelector(
                '[data-testid="result-total-distance"], [data-testid^="upload-error-"]',
                {
                  state: 'visible',
                  timeout: 30_000,
                },
              )
              const file = path.join(screensDir, `season-${viewport}-${theme}.png`)
              await page.screenshot({ path: file, fullPage: true })
              screenshots.push(file)
              screenshots.push(...(await captureStories(page, screensDir, viewport, theme)))
              responsiveness.push(await readWorstDrift(page, screen))
            } catch (error) {
              failures.push({
                screen,
                message: error instanceof Error ? error.message : String(error),
              })
            }
          }
        } finally {
          await context.close()
        }
      }
    }
  } catch (error) {
    failures.push({
      screen,
      message: error instanceof Error ? error.message : String(error),
    })
  } finally {
    if (browser !== null) {
      await browser.close()
    }
    if (server !== null) {
      await server.close()
    }

    const summaryProblems = problemsOf(consoleLog)
    const summaryOverBudget = responsiveness.filter(
      (entry) => entry.worstDriftMs > LONG_TASK_BUDGET_MS,
    )
    await writeFile(
      path.join(outDir, 'perf.json'),
      JSON.stringify({ budgetMs: LONG_TASK_BUDGET_MS, samples: responsiveness }, null, 2),
      'utf8',
    )
    await writeFile(
      path.join(outDir, 'console.log'),
      consoleLog.map((entry) => `[${entry.screen}] ${entry.type}: ${entry.text}`).join('\n'),
      'utf8',
    )
    await writeFile(path.join(outDir, 'network.json'), JSON.stringify(network, null, 2), 'utf8')
    await writeFile(
      path.join(outDir, 'summary.json'),
      JSON.stringify(
        {
          ok:
            failures.length === 0 && summaryProblems.length === 0 && summaryOverBudget.length === 0,
          options,
          screenshots,
          requests: network.length,
          worstDriftMs: responsiveness.reduce((max, entry) => Math.max(max, entry.worstDriftMs), 0),
          overBudgetScreens: summaryOverBudget.length,
          consoleProblems: summaryProblems.length,
          failures,
          lastScreen: screen,
        },
        null,
        2,
      ),
      'utf8',
    )
  }

  const problems = problemsOf(consoleLog)
  const overBudget = responsiveness.filter((entry) => entry.worstDriftMs > LONG_TASK_BUDGET_MS)

  process.stdout.write(`verify: ${String(screenshots.length)} screenshots in ${outDir}\n`)
  process.stdout.write(
    `verify: ${String(network.length)} requests, ${String(problems.length)} console problems\n`,
  )

  for (const entry of problems) {
    process.stderr.write(`console ${entry.type} on ${entry.screen}: ${entry.text}\n`)
  }
  for (const failure of failures) {
    process.stderr.write(`verify failed on ${failure.screen}: ${failure.message}\n`)
  }

  if (responsiveness.length > 0) {
    const worst = responsiveness.reduce((max, entry) => Math.max(max, entry.worstDriftMs), 0)
    process.stdout.write(
      `verify: worst main-thread drift ${worst.toFixed(1)} ms of a ${String(LONG_TASK_BUDGET_MS)} ms budget
`,
    )
  }
  for (const entry of overBudget) {
    process.stderr.write(
      `main thread blocked on ${entry.screen}: ${entry.worstDriftMs.toFixed(1)} ms
`,
    )
  }

  return failures.length === 0 && problems.length === 0 && overBudget.length === 0 ? 0 : 1
}

run().then(
  (code) => {
    process.exitCode = code
  },
  (error: unknown) => {
    process.stderr.write(
      `verify failed: ${error instanceof Error ? error.message : String(error)}\n`,
    )
    process.exitCode = 1
  },
)
