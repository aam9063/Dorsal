import { useSyncExternalStore } from 'react'

/**
 * The optional name typed on the portada (BRIEF §6, story 01). It lives in
 * module memory only — nothing writes it to storage (AGENTS.md §5.1) — so
 * later stories can read it until the tab closes, and never afterwards.
 */
let name = ''
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setSeasonName(value: string): void {
  if (name !== value) {
    name = value
    for (const listener of listeners) {
      listener()
    }
  }
}

export function getSeasonName(): string {
  return name
}

export function useSeasonName(): string {
  return useSyncExternalStore(subscribe, getSeasonName, getSeasonName)
}
