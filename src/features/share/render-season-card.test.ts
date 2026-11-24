import { describe, expect, it } from 'vitest'
import { buildYearSummary } from '../../core/metrics/build-year-summary'
import { MIN_SESSIONS_PER_WEEK } from '../../core/metrics/weekly-load'
import type { YearSummary } from '../../core/model/year-summary'
import { t } from '../../shared/i18n'
import { fulfilledWeeksSentence, powerCoverageSentence } from '../../shared/i18n'
import { CardColours, CARD_HEIGHT, CARD_WIDTH, type CardSurface } from './render-bib-card'
import {
  SEASON_CARD_HEIGHT,
  SEASON_CARD_WIDTH,
  drawSeasonCard,
  seasonCardGeometry,
  type SeasonCardInput,
} from './render-season-card'

/**
 * The season card is verified the same way the bib card is: a recording
 * surface in the node environment serializes every command the draw makes,
 * with its fill style, font, letter spacing and — for the sport icons — the
 * stroke style and width at that moment. Two draws from the same inputs must
 * produce the same command stream, and text must only ever use the AA colour
 * pairs shared with `src/shared/tokens/tokens.css`.
 *
 * Glyph rasterization, font loading and the PNG bytes are covered by the
 * browser e2e spec, not here.
 */

const ALLOWED_TEXT_COLOURS = [CardColours.ink, CardColours.labelInk, CardColours.orange] as const

interface RecordedOp {
  op: string
  args: string[]
  fillStyle: string
  font: string
  letterSpacing: string
  strokeStyle: string
  lineWidth: string
}

class RecordingSurface implements CardSurface {
  readonly ops: RecordedOp[] = []

  fillStyle = ''
  font = ''
  textAlign: CanvasTextAlign = 'left'
  textBaseline: CanvasTextBaseline = 'alphabetic'
  letterSpacing = '0px'
  strokeStyle = ''
  lineWidth = 1
  lineJoin: CanvasLineJoin = 'miter'
  lineCap: CanvasLineCap = 'butt'

  save(): void {
    this.push('save', [])
  }

  restore(): void {
    this.push('restore', [])
  }

  translate(x: number, y: number): void {
    this.push('translate', [x, y])
  }

  scale(x: number, y: number): void {
    this.push('scale', [x, y])
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

  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void {
    this.push('bezierCurveTo', [x1, y1, x2, y2, x, y])
  }

  quadraticCurveTo(x1: number, y1: number, x: number, y: number): void {
    this.push('quadraticCurveTo', [x1, y1, x, y])
  }

  stroke(): void {
    this.push('stroke', [])
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
    this.ops.push({
      op,
      args: args.map((argument) => serialiseArgument(argument)),
      fillStyle: this.fillStyle,
      font: this.font,
      letterSpacing: this.letterSpacing,
      strokeStyle: this.strokeStyle,
      lineWidth: serialiseArgument(this.lineWidth),
    })
  }

  /** The serialized command stream: the "bytes" of this substitute surface. */
  bytes(): Uint8Array {
    const lines = this.ops.map(
      (recorded) =>
        `${recorded.op}[${recorded.args.join(',')}];${recorded.fillStyle};${recorded.font};${recorded.letterSpacing};${recorded.strokeStyle};${recorded.lineWidth}`,
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

type PowerMonth = NonNullable<YearSummary['powerProfile']>['months'][number]

function powerMonth(
  month: number,
  bestWeightedAvgPowerW: number,
  bestMaxPowerW: number,
): PowerMonth {
  return {
    month,
    bestWeightedAvgPowerW,
    bestMaxPowerW,
    activityCount: 12,
    sessionsWithPower: 8,
    coverage: 8 / 12,
  }
}

function fullSeason(): YearSummary {
  const base = buildYearSummary([])
  return {
    ...base,
    bibCard: {
      number: 3214,
      distanceKm: 3214.4,
      monthlyDistanceM: [10, 20, 30, 40, 50, 60, 90, 80, 70, 50, 40, 30].map((km) => km * 1000),
    },
    totals: { ...base.totals, activityCount: 316, movingTimeS: 1_140_000 },
    sportBreakdown: {
      sports: [
        {
          sport: 'ride',
          activityCount: 180,
          distanceM: 540_000,
          movingTimeS: 720_000,
          elevationGainM: 62_000,
          share: 0.63,
        },
        {
          sport: 'run',
          activityCount: 96,
          distanceM: 860_000,
          movingTimeS: 300_000,
          elevationGainM: 9_400,
          share: 0.26,
        },
        {
          sport: 'swim',
          activityCount: 40,
          distanceM: 90_000,
          movingTimeS: 120_000,
          elevationGainM: 0,
          share: 0.11,
        },
      ],
    },
    weeklyLoad: {
      weeks: [
        {
          isoYear: 2026,
          isoWeek: 12,
          monday: { month: 3, day: 23 },
          activityCount: 4,
          distanceM: 90_000,
        },
        {
          isoYear: 2026,
          isoWeek: 20,
          monday: { month: 5, day: 11 },
          activityCount: 6,
          distanceM: 187_300,
        },
      ],
      best: {
        isoYear: 2026,
        isoWeek: 20,
        monday: { month: 5, day: 11 },
        activityCount: 6,
        distanceM: 187_300,
      },
      longestFulfilledStreak: 12,
    },
    seasonBests: {
      longestSessionByDistance: { distanceM: 62_400, month: 3, day: 12 },
      biggestElevationDay: { elevationGainM: 1240, month: 8, day: 4 },
      bestWeek: { distanceM: 187_300, isoWeek: 20, monday: { month: 5, day: 11 } },
    },
    powerProfile: {
      months: [3, 4, 5, 6, 7, 8, 9, 10].map((month, index) =>
        powerMonth(month, 220 + index * 4, 760 + index * 6),
      ),
      totals: {
        bestWeightedAvgPowerW: 248,
        bestMaxPowerW: 808,
        activityCount: 60,
        sessionsWithPower: 34,
        coverage: 34 / 60,
      },
    },
    availability: {
      ...base.availability,
      seasonCards: true,
      powerProfile: true,
    },
  }
}

const draw = (summary: YearSummary, name: string | null): RecordingSurface => {
  const surface = new RecordingSurface()
  drawSeasonCard(surface, { summary, name } satisfies SeasonCardInput)
  return surface
}

describe('season card renderer', () => {
  it('produces the same byte-for-byte command stream from the same inputs', () => {
    const summary = fullSeason()
    const first = draw(summary, 'Lucía M.')
    const second = draw(summary, 'Lucía M.')

    expect(second.bytes()).toEqual(first.bytes())
  })

  it('keeps the declared surface at 1080×1920', () => {
    expect(SEASON_CARD_WIDTH).toBe(CARD_WIDTH)
    expect(SEASON_CARD_HEIGHT).toBe(CARD_HEIGHT)
    expect(SEASON_CARD_WIDTH).toBe(1080)
    expect(SEASON_CARD_HEIGHT).toBe(1920)
  })

  it('draws every text with the AA colour pairs of the design tokens', () => {
    const surface = draw(fullSeason(), 'Lucía M.')

    const textColours = surface.texts().map((text) => text.fillStyle)
    expect(textColours.length).toBeGreaterThan(0)
    for (const fillStyle of textColours) {
      expect(ALLOWED_TEXT_COLOURS).toContain(fillStyle)
    }
    expect(textColours).not.toContain(CardColours.accent)
    expect(textColours).toContain(CardColours.ink)
    expect(textColours).toContain(CardColours.labelInk)
  })

  it('paints the whole card: the field, the plate, the header and the footer', () => {
    const surface = draw(fullSeason(), 'Lucía M.')

    const firstOp = surface.ops[0]
    expect(firstOp?.op).toBe('beginPath')
    expect(firstOp?.fillStyle).toBe(CardColours.accent)

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('CARNET DE TEMPORADA')
    expect(texts).toContain('DORSAL · TEMPORADA 2026')
    expect(texts).toContain('LUCÍA M.')
    expect(texts).toContain('HECHO CON DORSAL')
    expect(texts).toContain('3214')

    const fills = surface.ops.filter((recorded) => recorded.op === 'fill').length
    expect(fills).toBeGreaterThanOrEqual(12)
    expect(surface.texts().length).toBeGreaterThanOrEqual(30)
  })

  it('draws every sport of the season with icon strokes, count, distance and share', () => {
    const surface = draw(fullSeason(), 'Lucía M.')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain(t.sports.ride)
    expect(texts).toContain(t.sports.run)
    expect(texts).toContain(t.sports.swim)
    expect(texts).toContain('180 · 540,0 km')
    expect(texts).toContain('96 · 860,0 km')
    expect(texts).toContain('40 · 90,0 km')

    // Every sport row carries its stroked icon: one stroke per subpath.
    const strokes = surface.ops.filter((recorded) => recorded.op === 'stroke').length
    expect(strokes).toBeGreaterThanOrEqual(12)
  })

  it('marks the first entry as the most practiced sport, exactly once', () => {
    const surface = draw(fullSeason(), 'Lucía M.')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('EL DEPORTE QUE MÁS TIEMPO TE LLEVÓ')
    expect(texts.filter((text) => text === 'EL DEPORTE QUE MÁS TIEMPO TE LLEVÓ').length).toBe(1)

    // S8 order: the sport rows appear most-practiced first.
    expect(texts.indexOf(t.sports.ride)).toBeLessThan(texts.indexOf(t.sports.run))
    expect(texts.indexOf(t.sports.run)).toBeLessThan(texts.indexOf(t.sports.swim))
  })

  it('shows the best week, the fulfilled streak and the threshold rule', () => {
    const surface = draw(fullSeason(), 'Lucía M.')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('LA SEMANA CON MÁS KM')
    expect(texts).toContain('187,3 km · 11 may')
    expect(texts).toContain('SEMANAS CONSECUTIVAS CUMPLIENDO ENTRENOS')
    expect(texts).toContain('12 semanas')
    expect(texts).toContain(fulfilledWeeksSentence(MIN_SESSIONS_PER_WEEK))
  })

  it('prints the best marks with the same wording the dorsal uses', () => {
    const surface = draw(fullSeason(), 'Lucía M.')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('MEJORES MARCAS')
    expect(texts).toContain('LA SALIDA MÁS LARGA')
    expect(texts).toContain('62,4 km · 12 mar')
    expect(texts).toContain('EL DÍA CON MÁS DESNIVEL')
    expect(texts).toContain('1240 m · 4 ago')
    expect(texts).toContain('LA MEJOR SEMANA')
  })

  it('shows the power panel with its year values, evolution bars and coverage', () => {
    const surface = draw(fullSeason(), 'Lucía M.')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('POTENCIA')
    expect(texts).toContain('248 W')
    expect(texts).toContain('808 W')
    expect(texts).toContain('MEJOR MEDIA PONDERADA')
    expect(texts).toContain('MEJOR PICO')
    expect(texts).toContain('EVOLUCIÓN POR MES')
    expect(texts).toContain(powerCoverageSentence(34, 60).toUpperCase())

    for (const month of t.monthsAbbr) {
      expect(texts).toContain(month)
    }

    const barFills = surface.ops.filter(
      (recorded) => recorded.op === 'fill' && recorded.fillStyle === CardColours.ink,
    )
    expect(barFills.length).toBeGreaterThanOrEqual(1)
  })

  it('leaves no trace of the power panel when the flag is off', () => {
    const surface = draw(
      { ...fullSeason(), availability: { ...fullSeason().availability, powerProfile: false } },
      'Lucía M.',
    )

    const texts = surface.texts().map((text) => text.text)
    expect(texts).not.toContain('POTENCIA')
    expect(texts).not.toContain('EVOLUCIÓN POR MES')
  })

  it('leaves no trace of the power panel when the season carries no power profile', () => {
    const surface = draw({ ...fullSeason(), powerProfile: null }, 'Lucía M.')

    expect(surface.texts().map((text) => text.text)).not.toContain('POTENCIA')
  })

  it('leaves the marks out when the season has no bests', () => {
    const surface = draw({ ...fullSeason(), seasonBests: null }, 'Lucía M.')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).not.toContain('MEJORES MARCAS')
    expect(texts).not.toContain('LA SALIDA MÁS LARGA')
    // The rest of the card survives.
    expect(texts).toContain('CARNET DE TEMPORADA')
  })

  it('skips a mark the season cannot prove', () => {
    const surface = draw(
      {
        ...fullSeason(),
        seasonBests: {
          longestSessionByDistance: null,
          biggestElevationDay: null,
          bestWeek: { distanceM: 12_000, isoWeek: 3, monday: { month: 1, day: 12 } },
        },
      },
      'Lucía M.',
    )

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('LA MEJOR SEMANA')
    expect(texts).not.toContain('LA SALIDA MÁS LARGA')
    expect(texts).not.toContain('EL DÍA CON MÁS DESNIVEL')
  })

  it('draws a season with no sport breakdown without throwing, header and footer intact', () => {
    const surface = draw({ ...fullSeason(), sportBreakdown: null }, null)

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('CARNET DE TEMPORADA')
    expect(texts).toContain('TU AÑO')
    expect(texts).toContain('HECHO CON DORSAL')
    expect(texts).not.toContain('EL DEPORTE QUE MÁS TIEMPO TE LLEVÓ')
  })

  it('draws a season with no weekly load without the weeks panel', () => {
    const surface = draw({ ...fullSeason(), weeklyLoad: null }, 'Lucía M.')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).not.toContain('LA SEMANA CON MÁS KM')
    expect(texts).not.toContain('SEMANAS CONSECUTIVAS CUMPLIENDO ENTRENOS')
    expect(texts).toContain('MEJORES MARCAS')
  })

  it('keeps every panel stacked from top to bottom, above the plate bottom', () => {
    const geometry = seasonCardGeometry
    const sportsBottomWorst =
      geometry.sportsTop +
      geometry.sportFirstRowExtra +
      (geometry.maxSportRows - 1) * geometry.sportRowHeight

    expect(geometry.headerTitleBaseline).toBeGreaterThan(0)
    expect(geometry.headerNameBaseline).toBeGreaterThan(geometry.headerTitleBaseline)
    expect(geometry.sportsTop).toBeGreaterThan(geometry.headerNameBaseline)
    expect(geometry.weeksBestBaseline).toBeGreaterThan(sportsBottomWorst)
    expect(geometry.weeksStreakBaseline).toBeGreaterThan(geometry.weeksBestBaseline)
    expect(geometry.weeksRuleBaseline).toBeGreaterThan(geometry.weeksStreakBaseline)
    expect(geometry.marksTitleBaseline).toBeGreaterThan(geometry.weeksRuleBaseline)
    const marksBottomWorst = geometry.marksFirstBaseline + 2 * geometry.marksRowHeight
    expect(marksBottomWorst).toBeLessThan(geometry.powerTitleBaseline)
    expect(geometry.powerTitleBaseline).toBeGreaterThan(geometry.marksTitleBaseline)
    expect(geometry.barsBase).toBeGreaterThan(geometry.barsTop)
    expect(geometry.powerMonthLabelBaseline).toBeGreaterThan(geometry.barsBase)
  })

  it('keeps the footer inside the plate and clear of the last panel', () => {
    const geometry = seasonCardGeometry

    expect(geometry.powerMonthLabelBaseline).toBeLessThan(geometry.footerBaseline - 16)
    expect(geometry.footerBaseline).toBeLessThan(geometry.plateHeight - 24)
    expect(geometry.plateHeight - geometry.footerBaseline).toBeGreaterThan(24)
    expect(geometry.plateTop + geometry.plateHeight).toBeLessThan(SEASON_CARD_HEIGHT)
  })
})
