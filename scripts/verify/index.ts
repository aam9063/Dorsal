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

const NOT_IMPLEMENTED = ['--fixture', '--trace', '--perf', '--heap'] as const

interface Options {
  viewport: ViewportName | 'both'
  theme: 'light' | 'dark' | 'both'
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

  return { viewport, theme }
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

  let screen = 'startup'
  let server: ViteDevServer | null = null
  let browser: Browser | null = null
  let failure: string | null = null

  try {
    server = await ensureServer()
    browser = await chromium.launch()

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

        try {
          for (const route of ROUTES) {
            screen = `${route.name}-${viewport}-${theme}`
            await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' })
            await page.waitForSelector(route.root, { state: 'visible' })
            const file = path.join(screensDir, `${screen}.png`)
            await page.screenshot({ path: file, fullPage: true })
            screenshots.push(file)
          }
        } finally {
          await context.close()
        }
      }
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error)
  } finally {
    if (browser !== null) {
      await browser.close()
    }
    if (server !== null) {
      await server.close()
    }

    const problems = problemsOf(consoleLog)
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
          ok: failure === null && problems.length === 0,
          options,
          screenshots,
          requests: network.length,
          consoleProblems: problems.length,
          failure,
          lastScreen: screen,
        },
        null,
        2,
      ),
      'utf8',
    )
  }

  const problems = problemsOf(consoleLog)

  process.stdout.write(`verify: ${String(screenshots.length)} screenshots in ${outDir}\n`)
  process.stdout.write(
    `verify: ${String(network.length)} requests, ${String(problems.length)} console problems\n`,
  )

  for (const entry of problems) {
    process.stderr.write(`console ${entry.type} on ${entry.screen}: ${entry.text}\n`)
  }
  if (failure !== null) {
    process.stderr.write(`verify failed on ${screen}: ${failure}\n`)
  }

  return failure === null && problems.length === 0 ? 0 : 1
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
