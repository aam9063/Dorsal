const numberFormat = new Intl.NumberFormat('es-ES')
const oneDecimalFormat = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** Whole number with Spanish separators, e.g. `1234` → `1.234`. */
export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** Metres as kilometres with one decimal, e.g. `1234567` → `1.234,6`. */
export function formatKilometres(metres: number): string {
  return oneDecimalFormat.format(metres / 1000)
}

/**
 * Seconds as `34 h 12 min`; below one hour only the minutes are shown, and a
 * whole number of hours drops the `0 min` that would only add noise.
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours === 0) {
    return `${formatNumber(minutes)} min`
  }
  return minutes === 0
    ? `${formatNumber(hours)} h`
    : `${formatNumber(hours)} h ${formatNumber(minutes)} min`
}
