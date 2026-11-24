/**
 * Pure decisions shared by `use-gsap-reveal`. Kept free of `gsap` and of the
 * DOM so the reduced-motion rule and the counter value format can be unit
 * tested in the node test environment (the hook itself cannot run there).
 */

/** Under `prefers-reduced-motion: reduce` the landing shows its final state and nothing moves (BRIEF §7). */
export function shouldAnimate(reducedMotion: boolean): boolean {
  return !reducedMotion
}

export interface CountValue {
  value: number
  decimals: number
  /** The markup groups thousands with a dot, e.g. `41.380`. */
  grouped: boolean
  /** Text that follows the number (units, symbols) and is copied through unchanged. */
  suffix: string
}

const COUNT_PATTERN = /^([^0-9]*)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?([^0-9]*)$/

/**
 * Reads a landing counter value as written in the markup. Spanish copy uses a
 * dot for thousands and a comma for decimals, and may carry a suffix like
 * ` h` or `×`. Returns null when the text is not a single countable number
 * (dates, ranges, labels with more than one number), in which case the
 * markup value is simply shown.
 */
export function parseCountValue(text: string): CountValue | null {
  const match = COUNT_PATTERN.exec(text)
  if (match === null) {
    return null
  }
  const [, prefix = '', integer = '', decimals, suffix = ''] = match
  // A countable value is a bare number, optionally followed by a unit: text
  // before the number (dates, labels like `Temporada 2026`) is never animated.
  if (prefix !== '') {
    return null
  }
  const grouped = integer.includes('.')
  const withoutSeparators = integer.replaceAll('.', '')
  if (decimals === undefined) {
    return { value: Number(withoutSeparators), decimals: 0, grouped, suffix }
  }
  const decimalsLength = decimals.length
  return {
    value: Number(withoutSeparators) + Number(decimals) / 10 ** decimalsLength,
    decimals: decimalsLength,
    grouped,
    suffix,
  }
}

const GROUP_SEPARATOR_PATTERN = /\B(?=(\d{3})+(?!\d))/g

/**
 * Formats a counter frame in the same style as the markup value it replaces,
 * so at the end of the count the text is exactly the value rendered by the
 * markup (constraint: the final value must equal the number rendered by React).
 */
export function formatCountValue(value: number, parsed: CountValue): string {
  const scaled = Math.round(value * 10 ** parsed.decimals)
  const integer = Math.trunc(scaled / 10 ** parsed.decimals)
  const integerText = Math.abs(integer).toString()
  let text = integerText
  if (parsed.grouped) {
    text = integerText.replace(GROUP_SEPARATOR_PATTERN, '.')
  }
  if (integer < 0) {
    text = `-${text}`
  }
  if (parsed.decimals > 0) {
    const decimals = Math.abs(scaled) % 10 ** parsed.decimals
    text += `,${decimals.toString().padStart(parsed.decimals, '0')}`
  }
  return `${text}${parsed.suffix}`
}
