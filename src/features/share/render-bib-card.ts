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
 * same command stream, which `e2e/bib-card.spec.ts` pins at the byte level
 * (odd/tasks/redesign-objeto-dorsal.md, S7).
 *
 * The card speaks the same object language as the stories
 * (design/redesign-2026/03-objeto-dorsal/02-numeros.html): the bone plate with
 * its two punched pins, the editorial spine head — stage numeral and mono
 * season label on one baseline between two hairlines — the dashed tear-off
 * with the accent field showing through its punched hole, the accent kept for
 * stamps, and hairline rules bounding the blocks. The palette is the tokens'
 * (`src/shared/tokens/tokens.css`), and text only ever uses the AA pairs:
 * ink on bone, label ink on bone, orange only over ink.
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
  /** `--color-line-light`: the hairline rules bounding the blocks (decorative, 3:1+ against bone). */
  hairline: '#d3d1c7',
  /** `--color-bone-soft`: the dashed tear-off edge (decorative). */
  boneSoft: '#c9c8bf',
  /** Orange lettering on the ink stamp (5.2:1, AA). */
  orange: '#fc5200',
  /** The stories' pin glint, inset shadow of the pins and holes; decorative, not text. */
  pinGlint: 'rgba(252, 82, 0, 0.45)',
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
/** The plate tilts 3° counterclockwise on the accent field. */
const CARD_ROTATION = -(3 * Math.PI) / 180

// — Punched pins —————————————————————————————————————————————————————————————

const PIN_INSET_X = 48
const PIN_Y = 30
const PIN_RADIUS = 19
/** The stories' inset glint, drawn as a small accent dot in the pin's upper left. */
const PIN_GLINT_RADIUS = 6.5
const PIN_GLINT_OFFSET = 4

// — Card-local geometry, all coordinates inside the rotated plate ——————————

const CONTENT_X = 106
const CONTENT_W = CARD_W - 2 * CONTENT_X
const CENTER_X = CARD_W / 2
const CONTENT_RIGHT = CONTENT_X + CONTENT_W

/**
 * The editorial spine head: the stage numeral and the mono season label on the
 * same baseline, between two hairline rules of the plate's inner width.
 */
export const HEAD_X = 72
const HEAD_W = CARD_W - 2 * HEAD_X
const HEAD_RULE_TOP = 88
const HEAD_RULE_BOTTOM = 172
const RULE_THICKNESS = 2
const HEAD_NUMERAL_SIZE = 60
const HEAD_META_SIZE = 21
const HEAD_META_LETTER_SPACING = '3px'
const HEAD_BASELINE = 156
/**
 * Anton's digits advance about 0.78em: they are far wider than the face's
 * condensed look suggests, and `1451` and `4760` differ enough that any smaller
 * figure clips the last digit.
 */
const DIGIT_ADVANCE_EM = 0.78
/** The numeral is always the two-stage "08": its advance fixes the meta column. */
const HEAD_META_X = HEAD_X + DIGIT_ADVANCE_EM * HEAD_NUMERAL_SIZE * 2 + 26

const NUMBER_BASELINE = 484
const NUMBER_SIZE = 290
/**
 * The number bleeds over the plate's own margin — it gets the plate's width,
 * not the text column's — so it may fill this share of it.
 */
const NUMBER_MAX_WIDTH_RATIO = 0.94

const NAME_BASELINE = 564
const NAME_SIZE = 46
const NAME_SIZE_LONG = 38
const NAME_LETTER_SPACING = '11px'
const LONG_NAME_LENGTH = 12

const ARCHETYPE_BASELINE = 606
const ARCHETYPE_SIZE = 26
const ARCHETYPE_LETTER_SPACING = '3px'

/**
 * The accent sticker: the season's Everest equivalence, stamped on the plate's
 * edge like the stories' sticker — accent pill, ink lettering, a few degrees
 * of rotation. Its pill width is estimated, never measured from the DOM.
 */
const STICKER_CENTER_Y = 656
const STICKER_RIGHT = 830
const STICKER_H = 56
const STICKER_TEXT_SIZE = 22
const STICKER_TEXT_LETTER_SPACING = '2px'
const STICKER_PAD = 34
/** JetBrains Mono's advance is 0.6em; the estimation stays inside that. */
const MONO_ADVANCE_EM = 0.6
const STICKER_ROTATION = -(4 * Math.PI) / 180

const CHART_CAPTION_BASELINE = 744
const CHART_CAPTION_SIZE = 22
const CHART_TOP = 756
const CHART_BASE = 880
const CHART_BAR_GAP = 16
const CHART_BAR_RADIUS = 6
const MONTH_LABEL_BASELINE = 912
const MONTH_LABEL_SIZE = 20

/* The dashed tear-off edge with the punched hole: the accent field shows through. */
const TEAR_Y = 950
const TEAR_HOLE_RADIUS = 13
const DASH_LENGTH = 24
const DASH_GAP = 14
const DASH_THICKNESS = 5

const STAT_VALUE_SIZE = 60
const STAT_LABEL_SIZE = 27
const STAT_LABEL_LETTER_SPACING = '2px'
const STAT_VALUE_BASELINE = 1012
const STAT_LABEL_BASELINE = 1052

const MARKS_TITLE_BASELINE = 1104
const MARKS_TITLE_SIZE = 22
const MARKS_FIRST_BASELINE = 1148
const MARKS_ROW_H = 48
const MARKS_TEXT_SIZE = 22
const MARKS_LABEL_LETTER_SPACING = '2px'
const MARKS_RULE_SIZE = 2
const MARKS_RULE_OFFSET = 18

const FOOTER_SIZE = 27
const FOOTER_LETTER_SPACING = '3px'
const FOOTER_BASELINE = CARD_H - 62

/** Quarter of a turn, for the rounded-corner arcs. */
const QUARTER = Math.PI / 2

const FONT_DISPLAY = '"Anton"'
const FONT_SANS = '"Inter"'
const FONT_MONO = '"JetBrains Mono"'

/** The stage the two cards ship from: the spine numeral on their head band. */
export const CARD_STAGE_NUMERAL = '08'

/**
 * The vertical skeleton of the plate, exported so a layout regression is a test
 * failure instead of a card nobody notices: the number must clear the spine
 * head, the marks must stay above the footer, and the footer must sit near the
 * bottom edge instead of leaving the lower third empty.
 */
export const bibCardGeometry = {
  plateHeight: CARD_H,
  bandTop: HEAD_RULE_TOP,
  bandHeight: HEAD_RULE_BOTTOM - HEAD_RULE_TOP,
  headRuleTop: HEAD_RULE_TOP,
  headRuleBottom: HEAD_RULE_BOTTOM,
  numberBaseline: NUMBER_BASELINE,
  numberSize: NUMBER_SIZE,
  contentWidth: CONTENT_W,
  plateWidth: CARD_W,
  digitAdvanceEm: DIGIT_ADVANCE_EM,
  numberMaxWidthRatio: NUMBER_MAX_WIDTH_RATIO,
  tearY: TEAR_Y,
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
 * The closing stat rows under the tear-off edge — the same strings the draw and
 * the DOM preview paint (odd/tasks/h11-bib-card.md decision 1): the activity
 * count, the active days and — when the consistency story is available — the
 * longest streak. The Everest equivalence is not a stat: it is the accent
 * sticker ({@link bibCardStickerText}).
 */
export function bibCardStatRows(summary: YearSummary): { value: string; label: string }[] {
  const copy = t.stories['08-dorsal']
  const rows: { value: string; label: string }[] = [
    { value: formatNumber(summary.totals.activityCount), label: copy.statActivities },
    { value: formatNumber(summary.totals.activeDays), label: copy.statActiveDays },
  ]
  const streak = summary.consistency?.longestStreak.days ?? null
  if (streak !== null) {
    rows.push({ value: `${formatNumber(streak)} D`, label: copy.statStreak })
  }
  return rows
}

/**
 * The accent sticker's text: the season's Everest equivalence, uppercase —
 * `null` when the season cannot prove it, so the card never stamps a zero.
 */
export function bibCardStickerText(summary: YearSummary): string | null {
  const everests = summary.totals.everests
  if (everests <= 0) {
    return null
  }
  const value = formatNumber(Math.round(everests * 10) / 10)
  return `${value}× ${t.stories['08-dorsal'].statEverest}`.toUpperCase()
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
 * The bib number's font size: the design size, reduced until the widest possible
 * digits still fit the content column. Anton has proportional digits, so sizing
 * by count is the only rule that holds for `1451` (narrow ones) and `4760`
 * (wide ones) alike, and it keeps five and six digits on the card.
 */
export function bibCardNumberSize(digits: number): number {
  const widest = CARD_W * NUMBER_MAX_WIDTH_RATIO
  return Math.min(NUMBER_SIZE, Math.floor(widest / (DIGIT_ADVANCE_EM * Math.max(digits, 1))))
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

/** The estimated pill width of a mono stamp, shared by both card surfaces. */
export function pillWidth(text: string, size: number, letterSpacing: string, pad: number): number {
  const tracking = Number.parseFloat(letterSpacing) || 0
  return Math.ceil(text.length * (size * MONO_ADVANCE_EM + tracking)) + pad * 2
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

/** Axis-aligned filled rectangle (the subset takes fills only, never strokes). */
export function fillRect(
  surface: CardSurface,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  surface.beginPath()
  surface.moveTo(x, y)
  surface.lineTo(x + width, y)
  surface.lineTo(x + width, y + height)
  surface.lineTo(x, y + height)
  surface.closePath()
  surface.fill()
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
 * The two punched pins at the plate's top edge: ink discs with the stories'
 * inset glint in accent.
 */
export function drawCardPins(surface: CardSurface): void {
  const centerXs = [PIN_INSET_X, CARD_W - PIN_INSET_X]
  for (const cx of centerXs) {
    surface.beginPath()
    surface.arc(cx, PIN_Y, PIN_RADIUS, 0, 2 * Math.PI)
    surface.fillStyle = CardColours.ink
    surface.fill()
    surface.beginPath()
    surface.arc(cx - PIN_GLINT_OFFSET, PIN_Y - PIN_GLINT_OFFSET, PIN_GLINT_RADIUS, 0, 2 * Math.PI)
    surface.fillStyle = CardColours.pinGlint
    surface.fill()
  }
}

/**
 * The editorial spine head on the card: the stage numeral in the display face
 * and the mono season label on the same baseline, bounded by two hairline
 * rules (odd/tasks/redesign-objeto-dorsal.md, decision 2).
 */
export function drawCardSpineHead(surface: CardSurface, meta: string): void {
  for (const y of [HEAD_RULE_TOP, HEAD_RULE_BOTTOM]) {
    fillRect(surface, HEAD_X, y, HEAD_W, RULE_THICKNESS)
  }
  surface.fillStyle = CardColours.ink
  setFont(surface, '400', HEAD_NUMERAL_SIZE, FONT_DISPLAY, '0px')
  surface.textBaseline = 'alphabetic'
  surface.textAlign = 'left'
  surface.fillText(CARD_STAGE_NUMERAL, HEAD_X, HEAD_BASELINE)
  setFont(surface, '600', HEAD_META_SIZE, FONT_MONO, HEAD_META_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.fillText(meta.toUpperCase(), HEAD_META_X, HEAD_BASELINE)
}

/**
 * The dashed tear-off edge with its punched hole, drawn as filled dashes
 * (the subset has no stroke) with the accent field showing through the hole.
 */
export function drawCardTearOff(surface: CardSurface, y: number): void {
  surface.fillStyle = CardColours.boneSoft
  const half = DASH_THICKNESS / 2
  const step = DASH_LENGTH + DASH_GAP
  for (let x = CONTENT_X; x + DASH_LENGTH <= CONTENT_RIGHT; x += step) {
    fillRect(surface, x, y - half, DASH_LENGTH, DASH_THICKNESS)
  }
  surface.beginPath()
  surface.arc(CENTER_X, y, TEAR_HOLE_RADIUS, 0, 2 * Math.PI)
  surface.fillStyle = CardColours.accent
  surface.fill()
}

/**
 * One accent stamp pill with ink mono lettering, the sticker treatment of the
 * stories: a few degrees of rotation, drawn about its own centre.
 */
export function drawStickerPill(
  surface: CardSurface,
  text: string,
  centerX: number,
  centerY: number,
  size: number,
  letterSpacing: string,
  pillHeight: number,
  pad: number,
  rotation: number,
): void {
  const width = pillWidth(text, size, letterSpacing, pad)
  surface.save()
  surface.translate(centerX, centerY)
  surface.rotate(rotation)
  roundRectPath(surface, -width / 2, -pillHeight / 2, width, pillHeight, pillHeight / 2)
  surface.fillStyle = CardColours.accent
  surface.fill()
  setFont(surface, '700', size, FONT_MONO, letterSpacing)
  surface.fillStyle = CardColours.ink
  surface.textAlign = 'center'
  surface.textBaseline = 'middle'
  surface.fillText(text, 0, 0)
  surface.restore()
  surface.textBaseline = 'alphabetic'
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

/**
 * Paints the whole card. Order matters: the field, then the rotated plate and
 * its pins, then the editorial head, then the data blocks from the top down.
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
  drawCardPins(surface)
  drawCardSpineHead(surface, copy.plate)

  // The bib number, sized so five digits still fit the content column.
  const numberText = String(summary.bibCard.number)
  const numberSize = bibCardNumberSize(numberText.length)
  // The plate is tilted, so a number centred on the plate reads as shifted left
  // against the card's straight edges: offset it back by `tan(3°)` times the
  // distance from the plate's middle to the number's optical centre.
  const opticalCenter =
    Math.tan(Math.abs(CARD_ROTATION)) * (CARD_H / 2 - (NUMBER_BASELINE - 0.35 * numberSize))
  setFont(surface, '400', numberSize, FONT_DISPLAY, '0px')
  surface.fillStyle = CardColours.ink
  surface.textAlign = 'center'
  surface.fillText(numberText, CENTER_X + opticalCenter, NUMBER_BASELINE)

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

  // The season's Everest equivalence, stamped on the plate edge in accent.
  const stickerText = bibCardStickerText(summary)
  if (stickerText !== null) {
    drawStickerPill(
      surface,
      stickerText,
      STICKER_RIGHT -
        pillWidth(stickerText, STICKER_TEXT_SIZE, STICKER_TEXT_LETTER_SPACING, STICKER_PAD) / 2,
      STICKER_CENTER_Y,
      STICKER_TEXT_SIZE,
      STICKER_TEXT_LETTER_SPACING,
      STICKER_H,
      STICKER_PAD,
      STICKER_ROTATION,
    )
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
      CONTENT_RIGHT,
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

  drawCardTearOff(surface, TEAR_Y)

  // The closing stats: the columns follow the rows the season can prove.
  const rows = bibCardStatRows(summary)
  const statWidth = CONTENT_W / Math.max(rows.length, 1)
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

  // The season's best marks, bounded by hairline rules.
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
      surface.fillText(mark.value, CONTENT_RIGHT, baseline)
      surface.fillStyle = CardColours.hairline
      fillRect(surface, CONTENT_X, baseline + MARKS_RULE_OFFSET, CONTENT_W, MARKS_RULE_SIZE)
    }
  }

  setFont(surface, '400', FOOTER_SIZE, FONT_MONO, FOOTER_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'center'
  surface.fillText(copy.madeWith.toUpperCase(), CENTER_X, FOOTER_BASELINE)

  surface.restore()
}
