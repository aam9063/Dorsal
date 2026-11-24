import { describe, expect, it } from 'vitest'
import { buildYearSummary } from '../../core/metrics/build-year-summary'
import type { YearSummary } from '../../core/model/year-summary'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  CardColours,
  bibCardGeometry,
  bibCardNumberSize,
  drawBibCard,
  type CardSurface,
} from './render-bib-card'
import { t } from '../../shared/i18n'

/**
 * The unit test runs in Vitest's node environment, which cannot host a real
 * canvas: no 2D context, no CSS font loading, no PNG encoder. The honest
 * substitute is a recording surface — every call the draw makes, with its
 * style at that moment, is serialized byte for byte in the order it happens.
 * That proves the *command stream* is identical between two draws from the
 * same inputs, and that text only ever uses the AA colour pairs.
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

describe('bib card renderer', () => {
  it('produces the same byte-for-byte command stream from the same inputs', () => {
    const summary = fullSeason()
    const first = new RecordingSurface()
    const second = new RecordingSurface()

    drawBibCard(first, { summary, name: 'Lucía M.' })
    drawBibCard(second, { summary, name: 'Lucía M.' })

    expect(second.bytes()).toEqual(first.bytes())
  })

  it('paints the whole declared surface and the composition is not blank', () => {
    const surface = new RecordingSurface()
    drawBibCard(surface, { summary: fullSeason(), name: 'Lucía M.' })

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
    const surface = new RecordingSurface()
    drawBibCard(surface, { summary: fullSeason(), name: 'Lucía M.' })

    const textColours = new Set(surface.texts().map((text) => text.fillStyle))
    for (const fillStyle of textColours) {
      expect(ALLOWED_TEXT_COLOURS).toContain(fillStyle)
    }
    expect(textColours).toContain(CardColours.ink)
    expect(textColours).toContain(CardColours.labelInk)
  })

  it('writes the bib number and the typed name onto the card', () => {
    const surface = new RecordingSurface()
    drawBibCard(surface, { summary: fullSeason(), name: '  Lucía M.  ' })

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('3214')
    expect(texts).toContain('LUCÍA M.')
  })

  it('falls back to the season copy when the name was never typed', () => {
    const surface = new RecordingSurface()
    drawBibCard(surface, { summary: fullSeason(), name: '   ' })

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('TU AÑO')
  })

  it('keeps the declared surface at 1080×1920', () => {
    expect(CARD_WIDTH).toBe(1080)
    expect(CARD_HEIGHT).toBe(1920)
  })

  it('prints the season best marks in the lower third of the plate', () => {
    const surface = new RecordingSurface()
    drawBibCard(surface, { summary: fullSeason(), name: 'Lucía M.' })

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('MEJORES MARCAS')
    expect(texts).toContain('LA SALIDA MÁS LARGA')
    expect(texts).toContain('62,4 km · 12 mar')
    expect(texts).toContain('EL DÍA CON MÁS DESNIVEL')
    expect(texts).toContain('1240 m · 4 ago')
    expect(texts).toContain('LA MEJOR SEMANA')
    expect(texts).toContain('187,3 km · 11 may')
  })

  it('leaves out a mark the season cannot prove', () => {
    const surface = new RecordingSurface()
    const summary: YearSummary = {
      ...fullSeason(),
      seasonBests: {
        longestSessionByDistance: null,
        biggestElevationDay: null,
        bestWeek: { distanceM: 12_000, isoWeek: 3, monday: { month: 1, day: 12 } },
      },
    }
    drawBibCard(surface, { summary, name: null })

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('LA MEJOR SEMANA')
    expect(texts).not.toContain('LA SALIDA MÁS LARGA')
    expect(texts).not.toContain('EL DÍA CON MÁS DESNIVEL')
  })

  it('draws a season with no marks at all without a block', () => {
    const surface = new RecordingSurface()
    drawBibCard(surface, { summary: { ...fullSeason(), seasonBests: null }, name: null })

    expect(surface.texts().map((text) => text.text)).not.toContain('MEJORES MARCAS')
    expect(surface.texts().length).toBeGreaterThanOrEqual(11)
  })

  it('draws the twelve month bars instead of a filled silhouette', () => {
    const surface = new RecordingSurface()
    drawBibCard(surface, { summary: fullSeason(), name: 'Lucía M.' })

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('KM POR MES')
    for (const month of t.monthsAbbr) {
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
