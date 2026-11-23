import path from 'node:path'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const eslint = new ESLint({ cwd: path.resolve(import.meta.dirname, '..', '..') })

interface RuleEntry {
  name?: unknown
  selector?: unknown
  object?: unknown
  property?: unknown
  patterns?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isRuleEntry(value: unknown): value is RuleEntry {
  return typeof value === 'object' && value !== null
}

async function ruleEntries(filePath: string, ruleId: string): Promise<RuleEntry[]> {
  const config: unknown = await eslint.calculateConfigForFile(filePath)
  if (!isRecord(config)) {
    return []
  }
  const rules = config.rules
  if (!isRecord(rules)) {
    return []
  }
  const entry: unknown = rules[ruleId]
  if (!Array.isArray(entry)) {
    return []
  }
  return Array.from<unknown>(entry).slice(1).filter(isRuleEntry)
}

async function selectors(filePath: string): Promise<string[]> {
  return (await ruleEntries(filePath, 'no-restricted-syntax')).flatMap((entry) =>
    typeof entry.selector === 'string' ? [entry.selector] : [],
  )
}

async function globals(filePath: string): Promise<string[]> {
  return (await ruleEntries(filePath, 'no-restricted-globals')).flatMap((entry) =>
    typeof entry.name === 'string' ? [entry.name] : [],
  )
}

async function properties(filePath: string): Promise<string[]> {
  return (await ruleEntries(filePath, 'no-restricted-properties')).flatMap((entry) =>
    typeof entry.object === 'string' && typeof entry.property === 'string'
      ? [`${entry.object}.${entry.property}`]
      : [],
  )
}

async function restrictedImports(filePath: string): Promise<string[]> {
  return (await ruleEntries(filePath, 'no-restricted-imports')).flatMap((entry) => {
    const patterns = Array.isArray(entry.patterns) ? entry.patterns : []
    return patterns.flatMap((pattern: unknown) => {
      if (typeof pattern !== 'object' || pattern === null || !('group' in pattern)) {
        return []
      }
      const group = pattern.group
      return Array.isArray(group)
        ? group.filter((item): item is string => typeof item === 'string')
        : []
    })
  })
}

describe('hard constraints are wired into the real eslint config', () => {
  it('bans network primitives anywhere in src', async () => {
    expect(await globals('src/app/app.tsx')).toEqual(
      expect.arrayContaining(['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource']),
    )

    const configured = (await selectors('src/app/app.tsx')).join('\n')
    expect(configured).toContain('XMLHttpRequest')
    expect(configured).toContain('ImportExpression')
  })

  it('bans network primitives reached through window, globalThis and self', async () => {
    const banned = await properties('src/app/app.tsx')
    for (const host of ['window', 'globalThis', 'self']) {
      expect(banned).toEqual(
        expect.arrayContaining([
          `${host}.fetch`,
          `${host}.XMLHttpRequest`,
          `${host}.WebSocket`,
          `${host}.EventSource`,
        ]),
      )
    }
    expect(banned).toContain('navigator.sendBeacon')
  })

  it('bans Node builtins with and without the node: prefix', async () => {
    const patterns = await restrictedImports('src/app/app.tsx')
    expect(patterns).toEqual(expect.arrayContaining(['node:*', 'fs', 'path', 'fs/promises']))
  })

  it('bans persistence outside src/shared/theme/storage.ts only', async () => {
    expect(await globals('src/shared/ui/theme-toggle.tsx')).toEqual(
      expect.arrayContaining(['localStorage', 'sessionStorage', 'indexedDB']),
    )
    expect(await globals('src/shared/theme/storage.ts')).not.toEqual(
      expect.arrayContaining(['localStorage', 'sessionStorage', 'indexedDB']),
    )
  })

  it('bans useEffect outside src/shared/hooks/, including React.useEffect', async () => {
    const configured = await selectors('src/features/landing/landing-screen.tsx')
    expect(configured).toContain("ImportSpecifier[imported.name='useEffect']")
    expect(configured).toContain("MemberExpression[object.name='React'][property.name='useEffect']")
    expect(await selectors('src/shared/hooks/use-theme-preference.ts')).not.toContain(
      "ImportSpecifier[imported.name='useEffect']",
    )
  })

  it('bans Math.random and Date in src/core/', async () => {
    const configured = (await selectors('src/core/metrics/totals.ts')).join('\n')
    expect(configured).toContain("NewExpression[callee.name='Date']")
    expect(configured).toContain("MemberExpression[object.name='Math'][property.name='random']")
  })

  it('bans default exports everywhere in src', async () => {
    expect(await selectors('src/app/app.tsx')).toContain('ExportDefaultDeclaration')
    expect(await selectors('src/shared/theme/storage.ts')).toContain('ExportDefaultDeclaration')
  })
})
