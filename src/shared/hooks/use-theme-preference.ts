import { useSyncExternalStore } from 'react'
import { getThemePreference, subscribeToThemePreference } from '../theme'
import type { ThemePreference } from '../theme'

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribeToThemePreference, getThemePreference, getThemePreference)
}
