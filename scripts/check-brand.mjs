import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'artifacts',
  'dist',
  'Strava Wrapped 2026-project',
])
const ASSET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.avif'])
const BRAND_PATTERN = /strava/i

const problems = []

async function readText(relativePath) {
  try {
    return await readFile(path.join(process.cwd(), relativePath), 'utf8')
  } catch {
    return ''
  }
}

async function checkProductName() {
  const packageJson = JSON.parse(await readText('package.json'))
  const manifest = JSON.parse(await readText('public/manifest.webmanifest'))
  const html = await readText('index.html')

  const candidates = [
    ['package.json name', packageJson.name],
    ['manifest name', manifest.name],
    ['manifest short_name', manifest.short_name],
    ['index.html title', /<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? ''],
  ]

  for (const [label, value] of candidates) {
    if (typeof value === 'string' && BRAND_PATTERN.test(value)) {
      problems.push(`${label} contains the third-party brand: "${value}"`)
    }
  }
}

async function checkBrandAssets(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        await checkBrandAssets(target)
      }
      continue
    }
    if (
      ASSET_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) &&
      BRAND_PATTERN.test(entry.name)
    ) {
      problems.push(`brand asset committed: ${path.relative(process.cwd(), target)}`)
    }
  }
}

await checkProductName()
await checkBrandAssets(process.cwd())

if (problems.length > 0) {
  process.stderr.write(`brand check failed:\n${problems.join('\n')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write('brand check: product name and assets are clean\n')
}
