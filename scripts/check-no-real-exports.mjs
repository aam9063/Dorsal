import { readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'artifacts',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
])

const ALLOWED_DIR = path.join('fixtures', 'generated')
const FORBIDDEN_EXTENSIONS = new Set(['.csv', '.zip'])

async function walk(directory, found = []) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue
      }
      await walk(path.join(directory, entry.name), found)
      continue
    }
    const file = path.join(directory, entry.name)
    if (FORBIDDEN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      found.push(file)
    }
  }
  return found
}

const offenders = (await walk(process.cwd())).filter(
  (file) =>
    path.relative(process.cwd(), file).split(path.sep).slice(0, 2).join(path.sep) !== ALLOWED_DIR,
)

if (offenders.length > 0) {
  process.stderr.write(
    `Real exports are not allowed in git. Move these outside the repo or generate them with fixtures/generator:\n${offenders.join('\n')}\n`,
  )
  process.exitCode = 1
} else {
  process.stdout.write('no real exports: clean\n')
}
