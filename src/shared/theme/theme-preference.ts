import { readThemePreference, writeThemePreference, type ThemePreference } from './storage'

const DARK_QUERY = '(prefers-color-scheme: dark)'

const listeners = new Set<() => void>()
const systemQuery =
  typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia(DARK_QUERY) : null

let current: ThemePreference = readThemePreference()

function apply(preference: ThemePreference): void {
  if (typeof document === 'undefined') {
    return
  }
  const root = document.documentElement
  if (preference === 'system') {
    root.removeAttribute('data-theme')
    return
  }
  root.dataset.theme = preference
}

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

apply(current)

systemQuery?.addEventListener('change', () => {
  if (current === 'system') {
    notify()
  }
})

export function getThemePreference(): ThemePreference {
  return current
}

export function subscribeToThemePreference(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setThemePreference(preference: ThemePreference): void {
  current = preference
  writeThemePreference(preference)
  apply(preference)
  notify()
}
