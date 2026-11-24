import type { YearSummary } from '../../core/model/year-summary'
import { formatKilometres, formatNumber } from '../../shared/format'
import { t } from '../../shared/i18n'

/**
 * The shareable bib card: a 1080×1920 PNG painted with Canvas 2D
 * (BRIEF §3, odd/tasks/h11-bib-card.md decision 3). The draw is pure over the
 * `CardSurface` subset of `CanvasRenderingContext2D`, every coordinate is a
 * named constant — never measured from the DOM — and the copy and the numbers
 * come from `src/shared/i18n/` and `src/shared/format.ts` only. No `Date`, no
 * `Math.random`, no runtime locale: two draws from the same inputs produce the
 * same command stream, which `e2e/bib-card.spec.ts` pins at the byte level.
 *
 * H-11b redrew the composition (odd/tasks/h11b-season-cards.md, decision 2):
 * the season band is measured to hold its own text, the number never reaches
 * it, the monthly series is drawn as the twelve bars it really is instead of a
 * filled silhouette pretending to be a mountain, and the lower third carries
 * the season's best marks instead of empty bone. The card carries no
 * third-party brand (S4): the only name on it is the app's own.
 */

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1920

/** Hex values mirrored from `src/shared/tokens/tokens.css` (canvas cannot read CSS variables). */
export const CardColours = {
  /** `--dorsal-fg` light / `--color-ink`: card lettering on bone (15.4:1). */
  ink: '#0f100d',
  /** `--dorsal-surface` light: the bone plate the card paints on. */
  bone: '#f2f0e9',
  /** `--dorsal-accent`: the field behind the card, the punched holes and the peak bar. */
  accent: '#fc5200',
  /** `--dorsal-fg-subtle` light: secondary lettering on bone (5.6:1, AA). */
  labelInk: '#5e5f58',
  /** Orange lettering on the dark plate (5.2:1, AA). */
  orange: '#fc5200',
  /** Simulated inset shadow of the punched holes; decorative, not text. */
  holeShadow: 'rgba(0, 0, 0, 0.28)',
} as const

/**
 * The surface subset `drawBibCard` paints with. `CanvasRenderingContext2D`
 * satisfies it structurally, so the production call passes a real context and
 * the unit test passes a recording one.
 */
export interface CardSurface {
  save(): void
  restore(): void
  translate(x: number, y: number): void
  rotate(angle: number): void
  beginPath(): void
  closePath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void
  fill(): void
  fillStyle: string | CanvasGradient | CanvasPattern
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  letterSpacing: string
  fillText(text: string, x: number, y: number): void
}

/** Everything the card paints, resolved before the first pixel. */
export interface BibCardInput {
  summary: YearSummary
  /** The optional name the athlete typed on the portada; it never comes from the file. */
  name: string | null
}

// — Surface geometry ————————————————————————————————————————————————————————

const CARD_X = 78
const CARD_Y = 286
const CARD_W = 924
const CARD_H = 1400
const CARD_RADIUS = 40
/** The artboard tilts the plate 3° counterclockwise. */
const CARD_ROTATION = -(3 * Math.PI) / 180

// — Card-local geometry, all coordinates inside the rotated plate ——————————

const HOLE_INSET = 52
const HOLE_RADIUS = 17
/** The dark crescent that suggests the punched hole's inset shadow. */
const HOLE_SHADOW_RADIUS = HOLE_RADIUS - 1.5
const HOLE_SHADOW_OFFSET = 2.5

/**
 * The dark season band. Its padding is explicit and the band is wider than the
 * text column, so neither the label nor the unit can reach the rounded corner:
 * the pre-H-11b draw let the text run under the corner and the number overlap
 * the band.
 */
const BAND_INSET_X = 62
const BAND_Y = 48
const BAND_H = 84
const BAND_RADIUS = 16
const BAND_TEXT_SIZE = 26
const BAND_LETTER_SPACING = '3px'
const BAND_INNER_X = 28

const CONTENT_X = 106
const CONTENT_W = CARD_W - 2 * CONTENT_X
const CENTER_X = CARD_W / 2

const NUMBER_BASELINE = 448
/** Anton advance is ~0.47em, so five digits need a smaller face to stay in the column. */
const NUMBER_SIZE_LONG = 236
const NUMBER_SIZE = 290
const LONG_NUMBER_DIGITS = 5

const NAME_BASELINE = 528
const NAME_SIZE = 46
const NAME_SIZE_LONG = 38
const NAME_LETTER_SPACING = '11px'
const LONG_NAME_LENGTH = 12

const ARCHETYPE_BASELINE = 574
const ARCHETYPE_SIZE = 26
const ARCHETYPE_LETTER_SPACING = '3px'

const CHART_CAPTION_BASELINE = 616
const CHART_CAPTION_SIZE = 22
const CHART_TOP = 626
const CHART_BASE = 800
const CHART_BAR_GAP = 16
const CHART_BAR_RADIUS = 6
const MONTH_LABEL_BASELINE = 838
const MONTH_LABEL_SIZE = 20

const DASH_LENGTH = 18
const DASH_GAP = 12
const DASH_THICKNESS = 6
const DIVIDER_Y = 880

const STAT_VALUE_SIZE = 60
const STAT_LABEL_SIZE = 27
const STAT_LABEL_LETTER_SPACING = '2px'
const STAT_VALUE_BASELINE = 946
const STAT_LABEL_BASELINE = 990

const MARKS_TITLE_BASELINE = 1052
const MARKS_TITLE_SIZE = 22
const MARKS_FIRST_BASELINE = 1108
const MARKS_ROW_H = 72
const MARKS_TEXT_SIZE = 22
const MARKS_LABEL_LETTER_SPACING = '2px'
const MARKS_RULE_SIZE = 2
const MARKS_RULE_OFFSET = 26

const FOOTER_SIZE = 27
const FOOTER_LETTER_SPACING = '3px'
const FOOTER_BASELINE = CARD_H - 62

/** Quarter of a turn, for the rounded-corner arcs. */
const QUARTER = Math.PI / 2

const FONT_DISPLAY = '"Anton"'
const FONT_SANS = '"Inter"'
const FONT_MONO = '"JetBrains Mono"'

/**
 * The vertical skeleton of the plate, exported so a layout regression is a test
 * failure instead of a card nobody notices: the number must clear the season
 * band, the marks must stay above the footer, and the footer must sit near the
 * bottom edge instead of leaving the lower third empty.
 */
export const bibCardGeometry = {
  plateHeight: CARD_H,
  bandTop: BAND_Y,
  bandHeight: BAND_H,
  numberBaseline: NUMBER_BASELINE,
  numberSize: NUMBER_SIZE,
  numberSizeLong: NUMBER_SIZE_LONG,
  marksFirstBaseline: MARKS_FIRST_BASELINE,
  marksRowHeight: MARKS_ROW_H,
  marksRuleOffset: MARKS_RULE_OFFSET,
  footerBaseline: FOOTER_BASELINE,
} as const

/**
 * A stored calendar date as the card prints it: `12 mar`. The month table lives
 * in `src/shared/i18n/`, so the card never formats a date through a runtime
 * locale and two draws keep identical bytes.
 */
export function monthDayText(month: number, day: number): string {
  return `${day} ${(t.monthsShort[month - 1] ?? '').toLowerCase()}`
}

/**
 * The three rows of numbers under the tear-off edge — the same strings the
 * draw and the DOM preview paint (odd/tasks/h11-bib-card.md decision 1): the
 * activity count, the Everest equivalence and the season — the longest streak
 * when the consistency story is available, the active days when it is not.
 */
export function bibCardStatRows(summary: YearSummary): { value: string; label: string }[] {
  const copy = t.stories['08-dorsal']
  const streak = summary.consistency?.longestStreak.days ?? null
  return [
    { value: formatNumber(summary.totals.activityCount), label: copy.statActivities },
    {
      value: `${formatNumber(Math.round(summary.totals.everests * 10) / 10)}×`,
      label: copy.statEverest,
    },
    streak === null
      ? { value: formatNumber(summary.totals.activeDays), label: copy.statActiveDays }
      : { value: `${formatNumber(streak)} D`, label: copy.statStreak },
  ]
}

/**
 * The season's best marks as label/value rows, the block that fills the lower
 * third of the plate. A mark the season cannot prove is left out entirely, so
 * the card never prints a zero it did not measure.
 */
export function bibCardMarkRows(summary: YearSummary): { label: string; value: string }[] {
  const bests = summary.seasonBests
  if (bests === null) {
    return []
  }
  const copy = t.stories['08-dorsal'].carnet
  const rows: { label: string; value: string }[] = []
  const longest = bests.longestSessionByDistance
  if (longest !== null) {
    rows.push({
      label: copy.longestSessionLabel,
      value: `${formatKilometres(longest.distanceM)} km · ${monthDayText(longest.month, longest.day)}`,
    })
  }
  const climb = bests.biggestElevationDay
  if (climb !== null) {
    rows.push({
      label: copy.biggestElevationDayLabel,
      value: `${formatNumber(climb.elevationGainM)} m · ${monthDayText(climb.month, climb.day)}`,
    })
  }
  const week = bests.bestWeek
  if (week !== null) {
    rows.push({
      label: copy.bestWeekMarkLabel,
      value: `${formatKilometres(week.distanceM)} km · ${monthDayText(week.monday.month, week.monday.day)}`,
    })
  }
  return rows
}

/**
 * The name line: the athlete's own name when they typed one, otherwise the
 * same words the portada uses (h11 decision 4 — the export carries no name).
 */
export function bibCardNameText(name: string | null): string {
  const trimmed = name?.trim() ?? ''
  return (trimmed === '' ? t.stories['08-dorsal'].fallbackName : trimmed).toUpperCase()
}

/** The archetype name in caps, or `null` when the season has no archetype. */
export function bibCardArchetypeText(summary: YearSummary): string | null {
  const archetype = summary.archetype
  if (archetype === null) {
    return null
  }
  return t.stories['05-arquetipo'].archetypeNames[archetype.primary].toUpperCase()
}

/** Rounded rectangle out of the four supported arcs (`arc` only, no `arcTo`). */
function roundRectPath(
  surface: CardSurface,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  surface.beginPath()
  surface.moveTo(x + safeRadius, y)
  surface.arc(x + width - safeRadius, y + safeRadius, safeRadius, 2 * -QUARTER, 0)
  surface.arc(x + width - safeRadius, y + height - safeRadius, safeRadius, 0, QUARTER)
  surface.arc(x + safeRadius, y + height - safeRadius, safeRadius, QUARTER, 2 * QUARTER)
  surface.arc(x + safeRadius, y + safeRadius, safeRadius, 2 * QUARTER, 3 * QUARTER)
  surface.closePath()
}

/** One month bar, so the card shows the twelve real months instead of a silhouette. */
function barPath(
  surface: CardSurface,
  x: number,
  width: number,
  height: number,
  baseline: number,
): void {
  if (height <= 0) {
    return
  }
  roundRectPath(surface, x, baseline - height, width, height, CHART_BAR_RADIUS)
}

/** The twelve monthly bars, with the peak month in accent. */
function drawMonthlyBars(surface: CardSurface, monthlyDistanceM: readonly number[]): void {
  const max = Math.max(...monthlyDistanceM, 0)
  const barWidth = (CONTENT_W - CHART_BAR_GAP * 11) / 12
  const peak = monthlyDistanceM.indexOf(max)
  const height = CHART_BASE - CHART_TOP
  for (let month = 0; month < 12; month += 1) {
    const distanceM = monthlyDistanceM[month] ?? 0
    const barHeight = max > 0 ? (distanceM / max) * height : 0
    if (barHeight <= 0) {
      continue
    }
    const x = CONTENT_X + month * (barWidth + CHART_BAR_GAP)
    surface.fillStyle = month === peak ? CardColours.accent : CardColours.ink
    barPath(surface, x, barWidth, barHeight, CHART_BASE)
    surface.fill()
  }
}

/** Dashed tear-off edge, drawn as filled dashes because the subset has no stroke. */
function dashedDivider(surface: CardSurface): void {
  surface.fillStyle = CardColours.ink
  const half = DASH_THICKNESS / 2
  const step = DASH_LENGTH + DASH_GAP
  for (let x = CONTENT_X; x + DASH_LENGTH <= CONTENT_X + CONTENT_W; x += step) {
    surface.beginPath()
    surface.moveTo(x, DIVIDER_Y - half)
    surface.lineTo(x + DASH_LENGTH, DIVIDER_Y - half)
    surface.lineTo(x + DASH_LENGTH, DIVIDER_Y + half)
    surface.lineTo(x, DIVIDER_Y + half)
    surface.closePath()
    surface.fill()
  }
}

function drawHoles(surface: CardSurface): void {
  const corners: [number, number][] = [
    [HOLE_INSET, HOLE_INSET],
    [CARD_W - HOLE_INSET, HOLE_INSET],
    [HOLE_INSET, CARD_H - HOLE_INSET],
    [CARD_W - HOLE_INSET, CARD_H - HOLE_INSET],
  ]
  for (const [cx, cy] of corners) {
    surface.beginPath()
    surface.arc(cx, cy - HOLE_SHADOW_OFFSET, HOLE_RADIUS, 0, 2 * Math.PI)
    surface.fillStyle = CardColours.holeShadow
    surface.fill()
    surface.beginPath()
    surface.arc(cx, cy, HOLE_SHADOW_RADIUS, 0, 2 * Math.PI)
    surface.fillStyle = CardColours.accent
    surface.fill()
  }
}

function setFont(
  surface: CardSurface,
  weight: string,
  size: number,
  family: string,
  letterSpacing: string,
): void {
  surface.font = `${weight} ${size}px ${family}, sans-serif`
  surface.letterSpacing = letterSpacing
}

/**
 * Paints the whole card. Order matters: the field, then the rotated plate and
 * its holes, then the lettering, then the data blocks from the top down.
 */
export function drawBibCard(surface: CardSurface, input: BibCardInput): void {
  const copy = t.stories['08-dorsal']
  const { summary, name } = input

  // The field.
  surface.fillStyle = CardColours.accent
  surface.beginPath()
  surface.moveTo(0, 0)
  surface.lineTo(CARD_WIDTH, 0)
  surface.lineTo(CARD_WIDTH, CARD_HEIGHT)
  surface.lineTo(0, CARD_HEIGHT)
  surface.closePath()
  surface.fill()

  // The plate, rotated about its centre, drawn in card-local coordinates.
  surface.save()
  surface.translate(CARD_X + CARD_W / 2, CARD_Y + CARD_H / 2)
  surface.rotate(CARD_ROTATION)
  surface.translate(-CARD_W / 2, -CARD_H / 2)

  roundRectPath(surface, 0, 0, CARD_W, CARD_H, CARD_RADIUS)
  surface.fillStyle = CardColours.bone
  surface.fill()
  drawHoles(surface)

  // The dark season band, padded so its own text cannot reach the corners.
  roundRectPath(surface, BAND_INSET_X, BAND_Y, CARD_W - 2 * BAND_INSET_X, BAND_H, BAND_RADIUS)
  surface.fillStyle = CardColours.ink
  surface.fill()
  setFont(surface, '600', BAND_TEXT_SIZE, FONT_MONO, BAND_LETTER_SPACING)
  surface.fillStyle = CardColours.orange
  surface.textBaseline = 'middle'
  surface.textAlign = 'left'
  surface.fillText(copy.plate.toUpperCase(), BAND_INSET_X + BAND_INNER_X, BAND_Y + BAND_H / 2)
  surface.textAlign = 'right'
  surface.fillText(copy.plateKm, CARD_W - BAND_INSET_X - BAND_INNER_X, BAND_Y + BAND_H / 2)
  surface.textBaseline = 'alphabetic'

  // The bib number, sized so five digits still fit the content column.
  const numberText = String(summary.bibCard.number)
  const numberSize = numberText.length >= LONG_NUMBER_DIGITS ? NUMBER_SIZE_LONG : NUMBER_SIZE
  setFont(surface, '400', numberSize, FONT_DISPLAY, '0px')
  surface.fillStyle = CardColours.ink
  surface.textAlign = 'center'
  surface.fillText(numberText, CENTER_X, NUMBER_BASELINE)

  const nameText = bibCardNameText(name)
  setFont(
    surface,
    '700',
    nameText.length > LONG_NAME_LENGTH ? NAME_SIZE_LONG : NAME_SIZE,
    FONT_SANS,
    NAME_LETTER_SPACING,
  )
  surface.fillStyle = CardColours.ink
  surface.fillText(nameText, CENTER_X, NAME_BASELINE)

  const archetype = bibCardArchetypeText(summary)
  if (archetype !== null) {
    setFont(surface, '400', ARCHETYPE_SIZE, FONT_MONO, ARCHETYPE_LETTER_SPACING)
    surface.fillStyle = CardColours.labelInk
    surface.fillText(archetype, CENTER_X, ARCHETYPE_BASELINE)
  }

  // The twelve months as bars, with the caption and the peak month's distance.
  const monthly = summary.bibCard.monthlyDistanceM
  const peakDistanceM = Math.max(...monthly, 0)
  const peakMonth = monthly.indexOf(peakDistanceM)
  setFont(surface, '400', CHART_CAPTION_SIZE, FONT_MONO, '2px')
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(copy.chartCaption.toUpperCase(), CONTENT_X, CHART_CAPTION_BASELINE)
  if (peakDistanceM > 0) {
    surface.textAlign = 'right'
    surface.fillText(
      `${t.monthsShort[peakMonth] ?? ''} · ${formatKilometres(peakDistanceM)}`.toUpperCase(),
      CONTENT_X + CONTENT_W,
      CHART_CAPTION_BASELINE,
    )
  }
  drawMonthlyBars(surface, monthly)
  setFont(surface, '400', MONTH_LABEL_SIZE, FONT_MONO, '0px')
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'center'
  const barWidth = (CONTENT_W - CHART_BAR_GAP * 11) / 12
  for (let month = 0; month < 12; month += 1) {
    surface.fillText(
      t.monthsAbbr[month] ?? '',
      CONTENT_X + month * (barWidth + CHART_BAR_GAP) + barWidth / 2,
      MONTH_LABEL_BASELINE,
    )
  }

  dashedDivider(surface)

  // The three closing stats.
  const rows = bibCardStatRows(summary)
  const statWidth = CONTENT_W / 3
  setFont(surface, '400', STAT_VALUE_SIZE, FONT_DISPLAY, '0px')
  surface.fillStyle = CardColours.ink
  surface.textAlign = 'center'
  for (const [index, row] of rows.entries()) {
    surface.fillText(row.value, CONTENT_X + statWidth * index + statWidth / 2, STAT_VALUE_BASELINE)
  }
  setFont(surface, '400', STAT_LABEL_SIZE, FONT_MONO, STAT_LABEL_LETTER_SPACING)
  for (const [index, row] of rows.entries()) {
    surface.fillText(
      row.label.toUpperCase(),
      CONTENT_X + statWidth * index + statWidth / 2,
      STAT_LABEL_BASELINE,
    )
  }

  // The season's best marks, the block that used to be empty bone.
  const marks = bibCardMarkRows(summary)
  if (marks.length > 0) {
    setFont(surface, '700', MARKS_TITLE_SIZE, FONT_MONO, MARKS_LABEL_LETTER_SPACING)
    surface.fillStyle = CardColours.labelInk
    surface.textAlign = 'left'
    surface.fillText(
      t.stories['08-dorsal'].carnet.marksTitle.toUpperCase(),
      CONTENT_X,
      MARKS_TITLE_BASELINE,
    )
    setFont(surface, '400', MARKS_TEXT_SIZE, FONT_MONO, MARKS_LABEL_LETTER_SPACING)
    for (const [index, mark] of marks.entries()) {
      const baseline = MARKS_FIRST_BASELINE + index * MARKS_ROW_H
      surface.fillStyle = CardColours.labelInk
      surface.textAlign = 'left'
      surface.fillText(mark.label.toUpperCase(), CONTENT_X, baseline)
      surface.fillStyle = CardColours.ink
      surface.textAlign = 'right'
      surface.fillText(mark.value, CONTENT_X + CONTENT_W, baseline)
      surface.fillStyle = CardColours.labelInk
      surface.beginPath()
      surface.moveTo(CONTENT_X, baseline + MARKS_RULE_OFFSET)
      surface.lineTo(CONTENT_X + CONTENT_W, baseline + MARKS_RULE_OFFSET)
      surface.lineTo(CONTENT_X + CONTENT_W, baseline + MARKS_RULE_OFFSET + MARKS_RULE_SIZE)
      surface.lineTo(CONTENT_X, baseline + MARKS_RULE_OFFSET + MARKS_RULE_SIZE)
      surface.closePath()
      surface.fill()
    }
  }

  setFont(surface, '400', FOOTER_SIZE, FONT_MONO, FOOTER_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'center'
  surface.fillText(copy.madeWith.toUpperCase(), CENTER_X, FOOTER_BASELINE)

  surface.restore()
}
