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
  seasonCardLayout,
  type SeasonCardInput,
  type SeasonPanelLayout,
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

type SportRowFixture = NonNullable<YearSummary['sportBreakdown']>['sports'][number]

function sportRow(
  sport: SportRowFixture['sport'],
  activityCount: number,
  distanceM: number,
  movingTimeS: number,
  elevationGainM: number,
  share: number,
): SportRowFixture {
  return { sport, activityCount, distanceM, movingTimeS, elevationGainM, share }
}

/** The six `SportKind` values, in moving-time order like the metrics emit them. */
const sixSports: SportRowFixture[] = [
  sportRow('ride', 180, 540_000, 720_000, 62_000, 0.63),
  sportRow('run', 96, 860_000, 300_000, 9_400, 0.26),
  sportRow('swim', 40, 90_000, 120_000, 0, 0.22),
  sportRow('hike', 22, 140_000, 66_000, 5_200, 0.35),
  sportRow('walk', 12, 40_000, 18_000, 0, 0.48),
  sportRow('other', 1, 2_000, 900, 0, 0.9),
]

const oneSportSeason = (): YearSummary => ({
  ...fullSeason(),
  sportBreakdown: { sports: [sportRow('ride', 1, 5_400, 1_800, 60, 0.63)] },
  powerProfile: null,
  availability: { ...fullSeason().availability, powerProfile: false },
})

const sixSportSeason = (withPower: boolean): YearSummary => ({
  ...fullSeason(),
  sportBreakdown: { sports: sixSports },
  powerProfile: withPower ? fullSeason().powerProfile : null,
  availability: { ...fullSeason().availability, powerProfile: withPower },
})

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

  it('draws every sport of the season with icon strokes, distance and a counting caption', () => {
    const surface = draw(fullSeason(), 'Lucía M.')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain(t.sports.ride)
    expect(texts).toContain(t.sports.run)
    expect(texts).toContain(t.sports.swim)
    // The caption copy is the same the DOM replica prints, uppercase.
    expect(texts).toContain('180 ACTIVIDADES · 63 %')
    expect(texts).toContain('96 ACTIVIDADES · 26 %')
    expect(texts).toContain('40 ACTIVIDADES · 11 %')
    expect(texts).toContain('540,0 km')
    expect(texts).toContain('860,0 km')

    // Every sport row carries its stroked icon: one stroke per subpath.
    const strokes = surface.ops.filter((recorded) => recorded.op === 'stroke').length
    expect(strokes).toBeGreaterThanOrEqual(12)
  })

  it('prints the sport caption in the singular when the sport was practiced once', () => {
    const surface = draw(oneSportSeason(), 'Lucía M.')

    const texts = surface.texts().map((text) => text.text)
    expect(texts).toContain('1 ACTIVIDAD · 63 %')
    expect(texts).not.toContain('ACTIVIDADES')
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
})

const presentPanels = (layout: ReturnType<typeof seasonCardLayout>): SeasonPanelLayout[] =>
  [layout.sports, layout.weeks, layout.marks, layout.power].filter(
    (panel): panel is SeasonPanelLayout => panel !== null,
  )

const requiredLayout = (panel: SeasonPanelLayout | null, label: string): SeasonPanelLayout => {
  if (panel === null) throw new Error(`panel ${label} is missing from the layout`)
  return panel
}

describe('constructed vertical layout', () => {
  const sizedSeasons = [oneSportSeason(), sixSportSeason(false), sixSportSeason(true)]

  it('stacks the present panels without overlap and with one shared gap', () => {
    for (const summary of sizedSeasons) {
      const panels = presentPanels(seasonCardLayout(summary))
      expect(panels.length).toBeGreaterThan(1)
      const first = panels[0]
      const second = panels[1]
      if (first === undefined || second === undefined) throw new Error('panel is missing')
      const gap = second.top - first.bottom
      expect(gap).toBeGreaterThanOrEqual(seasonCardGeometry.panelGap)
      expect(gap).toBeLessThanOrEqual(seasonCardGeometry.maxPanelGap)
      for (let index = 1; index < panels.length; index += 1) {
        const previous = panels[index - 1]
        const panel = panels[index]
        if (previous === undefined || panel === undefined) throw new Error('panel is missing')
        expect(panel.top).toBeGreaterThanOrEqual(previous.bottom)
        expect(panel.top - previous.bottom).toBeCloseTo(gap, 6)
      }
    }
  })

  it('pins the footer to the plate bottom and keeps the panels clear of it', () => {
    for (const summary of sizedSeasons) {
      const layout = seasonCardLayout(summary)
      const panels = presentPanels(layout)
      const last = panels[panels.length - 1]
      if (last === undefined) throw new Error('a season must measure at least one panel')
      expect(layout.footerBaseline).toBe(
        seasonCardGeometry.plateHeight - seasonCardGeometry.bottomPadding,
      )
      expect(last.bottom + seasonCardGeometry.footerClearance).toBeLessThanOrEqual(
        layout.footerBaseline,
      )
    }
  })

  it('splits the leftover room evenly above and below the stack', () => {
    for (const summary of sizedSeasons) {
      const layout = seasonCardLayout(summary)
      const panels = presentPanels(layout)
      const first = panels[0]
      const last = panels[panels.length - 1]
      if (first === undefined || last === undefined) throw new Error('panel is missing')
      const above = first.top - seasonCardGeometry.bodyTop
      const below = layout.footerBaseline - last.bottom
      expect(above).toBeGreaterThanOrEqual(0)
      expect(Math.abs(above - (below - seasonCardGeometry.footerClearance))).toBeLessThanOrEqual(2)
    }
  })

  it('places all four panels of the six-sport season with power in document order', () => {
    const layout = seasonCardLayout(sixSportSeason(true))
    const sports = requiredLayout(layout.sports, 'sports')
    const weeks = requiredLayout(layout.weeks, 'weeks')
    const marks = requiredLayout(layout.marks, 'marks')
    const power = requiredLayout(layout.power, 'power')

    const gap = weeks.top - sports.bottom
    expect(sports.top).toBeGreaterThanOrEqual(seasonCardGeometry.bodyTop)
    expect(marks.top).toBe(weeks.bottom + gap)
    expect(power.top).toBe(marks.bottom + gap)
    expect(power.bottom + seasonCardGeometry.footerClearance).toBeLessThanOrEqual(
      layout.footerBaseline,
    )
  })

  it('never places a text baseline outside the plate', () => {
    for (const summary of [...sizedSeasons, fullSeason()]) {
      const surface = draw(summary, 'Lucía M.')
      const textOps = surface.ops.filter((recorded) => recorded.op === 'fillText')
      expect(textOps.length).toBeGreaterThan(0)
      for (const op of textOps) {
        const y = Number(op.args[2] ?? '')
        expect(y).toBeGreaterThan(0)
        expect(y).toBeLessThan(seasonCardGeometry.plateHeight)
      }
    }
  })

  it('draws every panel exactly where the computed layout says', () => {
    const summary = sixSportSeason(true)
    const surface = draw(summary, 'Lucía M.')
    const layout = seasonCardLayout(summary)
    const copy = t.stories['08-dorsal'].carnet
    const g = seasonCardGeometry
    const baselineOf = (text: string): number => {
      const op = surface.ops.find(
        (recorded) => recorded.op === 'fillText' && recorded.args[0] === text,
      )
      if (op === undefined) throw new Error(`not drawn: ${text}`)
      return Number(op.args[2] ?? '')
    }

    const sports = requiredLayout(layout.sports, 'sports')
    const weeks = requiredLayout(layout.weeks, 'weeks')
    expect(baselineOf(t.sports.ride)).toBeCloseTo(sports.top + g.sportRowLead, 3)
    expect(baselineOf(t.sports.run)).toBeCloseTo(
      sports.top + g.sportRowHeight + g.sportFirstExtra + g.sportRowLead,
      3,
    )
    expect(baselineOf(copy.bestWeekLabel.toUpperCase())).toBeCloseTo(weeks.top + g.rowLead, 3)
    expect(baselineOf(copy.consecutiveLead.toUpperCase())).toBeCloseTo(
      weeks.top + g.rowLead + g.linePitch,
      3,
    )
    expect(baselineOf(copy.marksTitle.toUpperCase())).toBeCloseTo(
      requiredLayout(layout.marks, 'marks').top + g.rowLead,
      3,
    )
    expect(baselineOf(copy.powerTitle.toUpperCase())).toBe(
      requiredLayout(layout.power, 'power').top + g.rowLead,
    )
    expect(baselineOf(t.stories['08-dorsal'].madeWith.toUpperCase())).toBeCloseTo(
      layout.footerBaseline,
      3,
    )
  })
})
