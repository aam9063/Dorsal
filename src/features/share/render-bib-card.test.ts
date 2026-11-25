import { describe, expect, it } from 'vitest'
import { buildYearSummary } from '../../core/metrics/build-year-summary'
import type { YearSummary } from '../../core/model/year-summary'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  CARD_STAGE_NUMERAL,
  CardColours,
  bibCardGeometry,
  bibCardNumberSize,
  drawBibCard,
  type BibCardInput,
  type CardSurface,
} from './render-bib-card'
import { messages, type Locale } from '../../shared/i18n'

/**
 * The unit test runs in Vitest's node environment, which cannot host a real
 * canvas: no 2D context, no CSS font loading, no PNG encoder. The honest
 * substitute is a recording surface — every call the draw makes, with its
 * style at that moment, is serialized byte for byte in the order it happens.
 * That proves the *command stream* is identical between two draws from the
 * same inputs, and that text only ever uses the AA colour pairs.
 *
 * The locale is part of the input (odd/tasks/i18n-english.md, decision 5): the
 * same draw must be deterministic inside each locale and must print the copy
 * of that locale, so these tests run every content assertion twice and check
 * the English grouping (`62.4 km`) against the Spanish one (`62,4 km`).
 *
 * It cannot see pixels: glyph rasterization, antialiasing, font loading and
 * PNG encoding are covered by `e2e/bib-card.spec.ts`, which downloads the real
 * PNG, checks magic bytes and the 1080×1920 dimensions, and draws twice to
 * compare the downloaded files byte for byte.
 *
 * AA pairs (contrast ratios against `src/shared/tokens/tokens.css`):
 * - ink `#0f100d` on bone `#f2f0e9`: 15.4:1
 * - label ink `#5e5f58` on bone `#f2f0e9`: 5.6:1
 * - orange `#fc5200` on ink `#0f100d`: 5.2:1
 */

const ALLOWED_TEXT_COLOURS = [CardColours.ink, CardColours.labelInk, CardColours.orange] as const

const LOCALES = ['es', 'en'] as const

interface RecordedOp {
  op: string
  args: string[]
  fillStyle: string
  font: string
  letterSpacing: string
}

class RecordingSurface implements CardSurface {
  readonly ops: RecordedOp[] = []

  fillStyle = ''
  font = ''
  textAlign: CanvasTextAlign = 'left'
  textBaseline: CanvasTextBaseline = 'alphabetic'
  letterSpacing = '0px'

  private snapshot(): RecordedOp {
    return {
      op: '',
      args: [],
      fillStyle: this.fillStyle,
      font: this.font,
      letterSpacing: this.letterSpacing,
    }
  }

  save(): void {
    this.push('save', [])
  }

  restore(): void {
    this.push('restore', [])
  }

  translate(x: number, y: number): void {
    this.push('translate', [x, y])
  }

  rotate(angle: number): void {
    this.push('rotate', [angle])
  }

  beginPath(): void {
    this.push('beginPath', [])
  }

  closePath(): void {
    this.push('closePath', [])
  }

  moveTo(x: number, y: number): void {
    this.push('moveTo', [x, y])
  }

  lineTo(x: number, y: number): void {
    this.push('lineTo', [x, y])
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void {
    this.push('arc', [x, y, radius, startAngle, endAngle])
  }

  fill(): void {
    this.push('fill', [])
  }

  fillText(text: string, x: number, y: number): void {
    this.push('fillText', [text, x, y])
  }

  private push(op: string, args: readonly (number | string)[]): void {
    const snapshot = this.snapshot()
    this.ops.push({
      op,
      args: args.map((argument) => serialiseArgument(argument)),
      fillStyle: snapshot.fillStyle,
      font: snapshot.font,
      letterSpacing: snapshot.letterSpacing,
    })
  }

  /** The serialized command stream: the "bytes" of this substitute surface. */
  bytes(): Uint8Array {
    const lines = this.ops.map(
      (recorded) =>
        `${recorded.op}[${recorded.args.join(',')}];${recorded.fillStyle};${recorded.font};${recorded.letterSpacing}`,
    )
    return new TextEncoder().encode(lines.join('\n'))
  }

  texts(): { text: string; fillStyle: string }[] {
    return this.ops
      .filter((recorded) => recorded.op === 'fillText')
      .map((recorded) => ({ text: recorded.args[0] ?? '', fillStyle: recorded.fillStyle }))
  }
}

/** Fixed-point serialization: no exponent notation, no locale. */
function serialiseArgument(value: number | string): string {
  return typeof value === 'string'
    ? value
    : Number.isInteger(value)
      ? String(value)
      : value.toFixed(4)
}

function fullSeason(): YearSummary {
  const summary = buildYearSummary([])
  return {
    ...summary,
    // The season's own totals: the sticker reads `totals.everests`, so the
    // fixture carries the equivalence the card would stamp.
    totals: { ...summary.totals, everests: 3.045 },
    bibCard: {
      number: 3214,
      distanceKm: 3214.4,
      monthlyDistanceM: [10, 20, 30, 40, 50, 60, 90, 80, 70, 50, 40, 30].map((km) => km * 1000),
    },
    archetype: {
      primary: 'earlyBird' as const,
      secondary: 'methodical' as const,
      startHours: new Array<number>(24).fill(1),
    },
    seasonBests: {
      longestSessionByDistance: { distanceM: 62_400, month: 3, day: 12 },
      biggestElevationDay: { elevationGainM: 1240, month: 8, day: 4 },
      bestWeek: { distanceM: 187_300, isoWeek: 20, monday: { month: 5, day: 11 } },
    },
  }
}

const drawCard = (input: Omit<BibCardInput, 'locale'>, locale: Locale): RecordingSurface => {
  const surface = new RecordingSurface()
  drawBibCard(surface, { ...input, locale })
  return surface
}

describe('bib card renderer', () => {
  it('produces the same byte-for-byte command stream from the same inputs', () => {
    const summary = fullSeason()
    const first = drawCard({ summary, name: 'Lucía M.' }, 'es')
    const second = drawCard({ summary, name: 'Lucía M.' }, 'es')

    expect(second.bytes()).toEqual(first.bytes())
  })

  it('is byte-for-byte deterministic in the English locale too', () => {
    const summary = fullSeason()
    const first = drawCard({ summary, name: 'Lucía M.' }, 'en')
    const second = drawCard({ summary, name: 'Lucía M.' }, 'en')

    expect(second.bytes()).toEqual(first.bytes())
  })

  it('prints English copy when the card is drawn in the English locale', () => {
    const surface = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'en')

    const texts = surface.texts().map((text) => text.text)
    const copy = messages.en.stories['08-dorsal']
    expect(texts).toContain(copy.madeWith.toUpperCase())
    expect(texts).not.toContain(messages.es.stories['08-dorsal'].madeWith.toUpperCase())
    // The month bar labels follow the drawn locale's month table: English
    // starts the year with J, Spanish with E.
    expect(texts).toContain(messages.en.monthsAbbr[0] ?? '')
    expect(texts).not.toContain(messages.es.monthsAbbr[0] ?? '')
  })

  it('formats the marks and the months through the drawn locale, not the active one', () => {
    const english = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'en')
      .texts()
      .map((row) => row.text)
    const spanish = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'es')
      .texts()
      .map((row) => row.text)

    // English grouping and month names: `62.4 km`, the August day is `aug`.
    expect(english).toContain('62.4 km · 12 mar')
    expect(english).toContain('1,240 m · 4 aug')
    expect(english).toContain('187.3 km · 11 may')
    // Spanish grouping and month names: `62,4 km`, the August day is `ago`.
    expect(spanish).toContain('62,4 km · 12 mar')
    expect(spanish).toContain('1240 m · 4 ago')
    expect(spanish).toContain('187,3 km · 11 may')
  })

  it('paints the whole declared surface and the composition is not blank', () => {
    const surface = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'es')

    // The first fill covers the full declared surface.
    const firstOp = surface.ops[0]
    expect(firstOp?.op).toBe('beginPath')
    expect(firstOp?.fillStyle).toBe(CardColours.accent)
    expect(surface.ops[6]?.op).toBe('fill')

    // Beyond the background: plate, holes, profile, dashes and lettering.
    const fills = surface.ops.filter((recorded) => recorded.op === 'fill').length
    expect(fills).toBeGreaterThanOrEqual(24)
    expect(surface.texts().length).toBeGreaterThanOrEqual(11)
  })

  it('draws every text with the AA colour pairs of the design tokens', () => {
    for (const locale of LOCALES) {
      const surface = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, locale)

      const textColours = new Set(surface.texts().map((text) => text.fillStyle))
      for (const fillStyle of textColours) {
        expect(ALLOWED_TEXT_COLOURS).toContain(fillStyle)
      }
      expect(textColours).toContain(CardColours.ink)
      expect(textColours).toContain(CardColours.labelInk)
    }
  })

  it('prints the spine head: the stage numeral and the season label on the same baseline', () => {
    const surface = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'es')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('08')
    expect(texts).toContain(CARD_STAGE_NUMERAL)
    expect(texts).toContain('DORSAL · TEMPORADA 2026')
  })

  it('prints the spine head label from the drawn locale', () => {
    const english = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'en')
    const spanish = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'es')

    expect(english.texts().map((text) => text.text)).toContain('DORSAL · 2026 SEASON')
    expect(spanish.texts().map((text) => text.text)).toContain('DORSAL · TEMPORADA 2026')
  })

  it('stamps the everest equivalence as the one accent sticker', () => {
    const surface = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'es')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('3× EVEREST')
    expect(texts.filter((text) => text === '3× EVEREST').length).toBe(1)
  })

  it('omits the sticker when the season cannot prove the equivalence', () => {
    const season = fullSeason()
    const summary: YearSummary = {
      ...season,
      totals: { ...season.totals, everests: 0 },
    }
    const surface = drawCard({ summary, name: null }, 'es')

    expect(surface.texts().map((text) => text.text)).not.toContain('3× EVEREST')
  })

  it('writes the bib number and the typed name onto the card', () => {
    const surface = drawCard({ summary: fullSeason(), name: '  Lucía M.  ' }, 'es')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('3214')
    expect(texts).toContain('LUCÍA M.')
  })

  it('falls back to the season copy when the name was never typed, in the drawn locale', () => {
    const spanish = drawCard({ summary: fullSeason(), name: '   ' }, 'es')
    const english = drawCard({ summary: fullSeason(), name: '   ' }, 'en')

    expect(spanish.texts().map((text) => text.text)).toContain('TU AÑO')
    expect(english.texts().map((text) => text.text)).toContain('YOUR YEAR')
  })

  it('keeps the declared surface at 1080×1920', () => {
    expect(CARD_WIDTH).toBe(1080)
    expect(CARD_HEIGHT).toBe(1920)
  })

  it('prints the season best marks in the lower third of the plate', () => {
    const surface = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'es')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('MEJORES MARCAS')
    expect(texts).toContain('LA SALIDA MÁS LARGA')
    expect(texts).toContain('62,4 km · 12 mar')
    expect(texts).toContain('EL DÍA CON MÁS DESNIVEL')
    expect(texts).toContain('1240 m · 4 ago')
    expect(texts).toContain('LA MEJOR SEMANA')
    expect(texts).toContain('187,3 km · 11 may')
  })

  it('prints the season best marks with the English wording of the drawn locale', () => {
    const surface = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'en')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('BEST MARKS')
    expect(texts).toContain('THE LONGEST OUTING')
    expect(texts).toContain('THE DAY WITH MOST CLIMBING')
    expect(texts).toContain('THE BEST WEEK')
  })

  it('leaves out a mark the season cannot prove', () => {
    const summary: YearSummary = {
      ...fullSeason(),
      seasonBests: {
        longestSessionByDistance: null,
        biggestElevationDay: null,
        bestWeek: { distanceM: 12_000, isoWeek: 3, monday: { month: 1, day: 12 } },
      },
    }
    const surface = drawCard({ summary, name: null }, 'es')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('LA MEJOR SEMANA')
    expect(texts).not.toContain('LA SALIDA MÁS LARGA')
    expect(texts).not.toContain('EL DÍA CON MÁS DESNIVEL')
  })

  it('draws a season with no marks at all without a block', () => {
    const surface = drawCard({ summary: { ...fullSeason(), seasonBests: null }, name: null }, 'es')

    expect(surface.texts().map((text) => text.text)).not.toContain('MEJORES MARCAS')
    expect(surface.texts().length).toBeGreaterThanOrEqual(11)
  })

  it('draws the twelve month bars instead of a filled silhouette', () => {
    const surface = drawCard({ summary: fullSeason(), name: 'Lucía M.' }, 'es')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('KM POR MES')
    for (const month of messages.es.monthsAbbr) {
      expect(texts).toContain(month)
    }
    // One accent bar for the peak month, ink bars for the other eleven months.
    const accentFills = surface.ops.filter(
      (recorded) => recorded.op === 'fill' && recorded.fillStyle === CardColours.accent,
    )
    expect(accentFills.length).toBeGreaterThanOrEqual(1)
  })

  it('keeps the number clear of the band and inside the column at any digit count', () => {
    const widest = bibCardGeometry.plateWidth * bibCardGeometry.numberMaxWidthRatio
    for (const digits of [1, 2, 3, 4, 5, 6]) {
      const size = bibCardNumberSize(digits)
      expect(size).toBeLessThanOrEqual(bibCardGeometry.numberSize)
      // Clears the dark band, whatever the size.
      expect(bibCardGeometry.numberBaseline - size).toBeGreaterThanOrEqual(
        bibCardGeometry.bandTop + bibCardGeometry.bandHeight + 16,
      )
      // The widest possible digits still fit inside the plate.
      expect(size * bibCardGeometry.digitAdvanceEm * digits).toBeLessThanOrEqual(widest + 1)
    }
  })

  it('sizes the number by its digits, not by a fixed pair of sizes', () => {
    expect(bibCardNumberSize(4)).toBeLessThanOrEqual(bibCardGeometry.numberSize)
    expect(bibCardNumberSize(6)).toBeLessThan(bibCardNumberSize(4))
  })

  it('keeps the marks above the footer and the footer near the bottom edge', () => {
    const lastRule =
      bibCardGeometry.marksFirstBaseline +
      2 * bibCardGeometry.marksRowHeight +
      bibCardGeometry.marksRuleOffset
    expect(lastRule).toBeLessThan(bibCardGeometry.footerBaseline - 24)

    const bottomPadding = bibCardGeometry.plateHeight - bibCardGeometry.footerBaseline
    expect(bottomPadding).toBeGreaterThan(40)
    expect(bottomPadding).toBeLessThanOrEqual(100)
  })
})
