import { MIN_SESSIONS_PER_WEEK } from '../../core/metrics/weekly-load'
import type { YearSummary } from '../../core/model/year-summary'
import { formatKilometres, formatNumber } from '../../shared/format'
import { t, fulfilledWeeksSentence, powerCoverageSentence } from '../../shared/i18n'
import {
  CardColours,
  type CardSurface,
  bibCardMarkRows,
  bibCardNameText,
  monthDayText,
} from './render-bib-card'
import {
  SPORT_ICON_VIEWBOX,
  drawSportIcon,
  measureSportIcon,
  type SportIconContext,
} from './sport-icons'

/**
 * The second shareable card, the "carnet de temporada": a 1080×1920 PNG that
 * carries the season's data-dense panels — sport split with icons, best week
 * and fulfilled weeks, best marks, power evolution — while the bib card keeps
 * the legible two-second composition (odd/tasks/h11b-season-cards.md S2).
 *
 * The draw is pure over the same `CardSurface` subset the bib card paints
 * with, every coordinate is a named constant, and every string comes from
 * `src/shared/i18n/` and `src/shared/format.ts`. No `Date`, no
 * `Math.random`, no runtime locale: two draws from the same inputs produce
 * the same command stream.
 *
 * Every panel renders only when the season's data exists (`YearSummary`
 * stores each section as nullable and `availability` carries the flags), so a
 * season without watts or without sport variety leaves no dead block behind.
 * The card draws a route, a GPS trace or a zone the export cannot prove
 * nowhere (S7).
 */

export const SEASON_CARD_WIDTH = 1080
export const SEASON_CARD_HEIGHT = 1920

export interface SeasonCardInput {
  summary: YearSummary
  /** The optional name the athlete typed on the portada; it never comes from the file. */
  name: string | null
}

// — Surface geometry ————————————————————————————————————————————————————————

const CARD_X = 78
const CARD_Y = 200
const CARD_W = 924
const CARD_H = 1560
const CARD_RADIUS = 40
/** The artboard tilts the plate 3° counterclockwise, like the bib card. */
const CARD_ROTATION = -(3 * Math.PI) / 180

const HOLE_INSET = 52
const HOLE_RADIUS = 17
/** The dark crescent that suggests the punched hole's inset shadow. */
const HOLE_SHADOW_RADIUS = HOLE_RADIUS - 1.5
const HOLE_SHADOW_OFFSET = 2.5

const CONTENT_X = 106
const CONTENT_W = CARD_W - 2 * CONTENT_X
const CONTENT_RIGHT = CONTENT_X + CONTENT_W

// — Header ——————————————————————————————————————————————————————————————————

const SEASON_LABEL_BASELINE = 150
const SEASON_LABEL_SIZE = 22
const SEASON_LABEL_LETTER_SPACING = '3px'

const TITLE_BASELINE = 226
const TITLE_SIZE = 66

const NAME_BASELINE = 290
const NAME_SIZE = 44
const NAME_SIZE_LONG = 38
const NAME_LETTER_SPACING = '10px'
const LONG_NAME_LENGTH = 12

// — Sport rows ——————————————————————————————————————————————————————————————

const SPORTS_TOP = 356
const SPORT_ROW_H = 78
/** The first row also carries the most-practiced tag under its bar. */
const SPORT_FIRST_EXTRA = 36
/** One row per `SportKind`, the upper bound of `sportBreakdown.sports`. */
const MAX_SPORT_ROWS = 6
const SPORT_NAME_OFFSET = 36
const SPORT_NAME_X = CONTENT_X + 66
const ICON_SIZE = 44
const ICON_CENTER_OFFSET = 26
const SPORT_ROW_STROKE_WIDTH = 2.4
const BAR_TOP_OFFSET = 58
const BAR_HEIGHT = 8
const BAR_RADIUS = 4
/** The empty track behind a share bar; decorative fill, never text. */
const BAR_TRACK_COLOUR = 'rgba(15, 16, 13, 0.16)'
const SPORT_TAG_OFFSET = 96
const SPORT_TAG_SIZE = 17
const SPORT_TAG_LETTER_SPACING = '2px'

// — Weeks ———————————————————————————————————————————————————————————————————

const WEEKS_TOP = 904
const WEEKS_BEST_BASELINE = WEEKS_TOP + 28
const WEEKS_STREAK_BASELINE = WEEKS_TOP + 80
const WEEKS_RULE_BASELINE = WEEKS_TOP + 114
const WEEKS_LABEL_SIZE = 18
const WEEKS_LABEL_LETTER_SPACING = '1px'
const WEEKS_VALUE_SIZE = 26

// — Best marks ——————————————————————————————————————————————————————————————

const MARKS_TITLE_BASELINE = 1086
const MARKS_TITLE_SIZE = 20
const MARKS_FIRST_BASELINE = 1132
const MARK_ROW_H = 48
const MARKS_TEXT_SIZE = 18

// — Power ———————————————————————————————————————————————————————————————————

const POWER_TITLE_BASELINE = 1296
const POWER_TITLE_SIZE = 20
const POWER_STAT_VALUE_BASELINE = 1350
const POWER_STAT_VALUE_SIZE = 52
const POWER_STAT_LABEL_BASELINE = 1376
const POWER_STAT_LABEL_SIZE = 17
const POWER_STAT_LABEL_LETTER_SPACING = '2px'
const POWER_SECOND_STAT_X = CONTENT_X + 260
const POWER_CAPTION_BASELINE = 1410
const POWER_CAPTION_SIZE = 17
const POWER_CAPTION_LETTER_SPACING = '1px'
const BARS_TOP = 1420
const BARS_BASE = 1452
const POWER_BAR_GAP = 10
const POWER_BAR_RADIUS = 5
const MONTH_LABEL_BASELINE = 1478
const MONTH_LABEL_SIZE = 15

// — Footer ——————————————————————————————————————————————————————————————————

const FOOTER_SIZE = 20
const FOOTER_LETTER_SPACING = '2px'
const FOOTER_BASELINE = CARD_H - 44

/** Quarter of a turn, for the rounded-corner arcs. */
const QUARTER = Math.PI / 2

const FONT_DISPLAY = '"Anton"'
const FONT_SANS = '"Inter"'
const FONT_MONO = '"JetBrains Mono"'

/**
 * The vertical skeleton of the plate, exported so a layout regression is a
 * test failure instead of a card nobody notices: the panels stack morning to
 * night, the deepest baseline is the month labels, and the footer sits near
 * the plate's bottom edge.
 */
export const seasonCardGeometry = {
  plateTop: CARD_Y,
  plateHeight: CARD_H,
  headerTitleBaseline: TITLE_BASELINE,
  headerNameBaseline: NAME_BASELINE,
  sportsTop: SPORTS_TOP,
  sportRowHeight: SPORT_ROW_H,
  sportFirstRowExtra: SPORT_FIRST_EXTRA,
  maxSportRows: MAX_SPORT_ROWS,
  weeksBestBaseline: WEEKS_BEST_BASELINE,
  weeksStreakBaseline: WEEKS_STREAK_BASELINE,
  weeksRuleBaseline: WEEKS_RULE_BASELINE,
  marksTitleBaseline: MARKS_TITLE_BASELINE,
  marksFirstBaseline: MARKS_FIRST_BASELINE,
  marksRowHeight: MARK_ROW_H,
  powerTitleBaseline: POWER_TITLE_BASELINE,
  barsTop: BARS_TOP,
  barsBase: BARS_BASE,
  powerMonthLabelBaseline: MONTH_LABEL_BASELINE,
  footerBaseline: FOOTER_BASELINE,
} as const

type SportRow = NonNullable<YearSummary['sportBreakdown']>['sports'][number]

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
 * This card draws sport icons, so its surface is the fill subset the bib card
 * needs plus the stroke subset `drawSportIcon` needs. `CanvasRenderingContext2D`
 * satisfies both structurally, which keeps every call honest instead of casting
 * a narrowed view back to the wider one.
 */
export type SeasonCardSurface = CardSurface & SportIconContext

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

/** The share bar of one sport row: an empty track plus the measured fill. */
function drawShareBar(
  surface: CardSurface,
  x: number,
  y: number,
  width: number,
  share: number,
  maxShare: number,
  colour: string,
): void {
  surface.fillStyle = BAR_TRACK_COLOUR
  roundRectPath(surface, x, y, width, BAR_HEIGHT, BAR_RADIUS)
  surface.fill()
  const fillWidth = maxShare > 0 ? (share / maxShare) * width : 0
  if (fillWidth <= 0) {
    return
  }
  surface.fillStyle = colour
  roundRectPath(surface, x, y, fillWidth, BAR_HEIGHT, BAR_RADIUS)
  surface.fill()
}

/**
 * One row per sport present in 2026, ordered by moving time (S8): the icon,
 * the sport name, the activity count with the distance in km, and the share
 * of moving time as a bar. The first entry is the most practiced sport and
 * carries the tag that says so.
 */
function drawSportsPanel(surface: SeasonCardSurface, sports: readonly SportRow[]): void {
  const copy = t.stories['08-dorsal'].carnet
  const maxShare = sports.reduce((acc, row) => Math.max(acc, row.share), 0)
  const iconScale = ICON_SIZE / SPORT_ICON_VIEWBOX

  for (const [index, row] of sports.entries()) {
    const top = SPORTS_TOP + index * SPORT_ROW_H + (index === 0 ? 0 : SPORT_FIRST_EXTRA)
    const bounds = measureSportIcon(row.sport)
    const iconWidth = (bounds.maxX - bounds.minX) * iconScale
    const iconHeight = (bounds.maxY - bounds.minY) * iconScale
    drawSportIcon(surface, row.sport, {
      x: CONTENT_X + (ICON_SIZE - iconWidth) / 2 - bounds.minX * iconScale,
      y:
        top +
        ICON_CENTER_OFFSET -
        ICON_SIZE / 2 +
        (ICON_SIZE - iconHeight) / 2 -
        bounds.minY * iconScale,
      size: ICON_SIZE,
      color: CardColours.ink,
      strokeWidth: SPORT_ROW_STROKE_WIDTH,
    })

    const nameBaseline = top + SPORT_NAME_OFFSET
    setFont(surface, '600', 26, FONT_SANS, '0px')
    surface.fillStyle = CardColours.ink
    surface.textAlign = 'left'
    surface.fillText(t.sports[row.sport], SPORT_NAME_X, nameBaseline)

    setFont(surface, '400', 22, FONT_MONO, '0px')
    surface.fillStyle = CardColours.ink
    surface.textAlign = 'right'
    surface.fillText(
      `${formatNumber(row.activityCount)} · ${formatKilometres(row.distanceM)} km`,
      CONTENT_RIGHT,
      nameBaseline,
    )

    drawShareBar(
      surface,
      CONTENT_X,
      top + BAR_TOP_OFFSET,
      CONTENT_W,
      row.share,
      maxShare,
      index === 0 ? CardColours.accent : CardColours.ink,
    )

    if (index === 0) {
      setFont(surface, '400', SPORT_TAG_SIZE, FONT_MONO, SPORT_TAG_LETTER_SPACING)
      surface.fillStyle = CardColours.labelInk
      surface.textAlign = 'left'
      surface.fillText(copy.mostPracticedLabel.toUpperCase(), CONTENT_X, top + SPORT_TAG_OFFSET)
    }
  }
}

/** Label left, value right: the shared shape of the weeks and marks rows. */
function drawLabelValueRow(
  surface: CardSurface,
  label: string,
  value: string,
  baseline: number,
  valueSize: number,
): void {
  if (label.length === 0) {
    return
  }
  setFont(surface, '400', WEEKS_LABEL_SIZE, FONT_MONO, WEEKS_LABEL_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(label.toUpperCase(), CONTENT_X, baseline)
  setFont(surface, '400', valueSize, FONT_MONO, '0px')
  surface.fillStyle = CardColours.ink
  surface.textAlign = 'right'
  surface.fillText(value, CONTENT_RIGHT, baseline)
}

/**
 * The best week of the season plus the longest run of fulfilled weeks, with
 * the threshold sentence printed so the rule is visible on the artifact.
 */
function drawWeeksPanel(
  surface: CardSurface,
  weeklyLoad: NonNullable<YearSummary['weeklyLoad']>,
): void {
  const copy = t.stories['08-dorsal'].carnet
  const best = weeklyLoad.best
  if (best !== null) {
    drawLabelValueRow(
      surface,
      copy.bestWeekLabel,
      `${formatKilometres(best.distanceM)} km · ${monthDayText(best.monday.month, best.monday.day)}`,
      WEEKS_BEST_BASELINE,
      WEEKS_VALUE_SIZE,
    )
  }
  const streak = weeklyLoad.longestFulfilledStreak
  const unit = streak === 1 ? copy.weeksUnitSingular : copy.weeksUnit
  drawLabelValueRow(
    surface,
    copy.consecutiveLead,
    `${formatNumber(streak)} ${unit}`,
    WEEKS_STREAK_BASELINE,
    WEEKS_VALUE_SIZE,
  )
  setFont(surface, '400', SPORT_TAG_SIZE, FONT_MONO, WEEKS_LABEL_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(fulfilledWeeksSentence(MIN_SESSIONS_PER_WEEK), CONTENT_X, WEEKS_RULE_BASELINE)
}

/** The season's best marks, in the same wording the dorsal prints. */
function drawMarksPanel(
  surface: CardSurface,
  markRows: readonly { label: string; value: string }[],
): void {
  const copy = t.stories['08-dorsal'].carnet
  setFont(surface, '700', MARKS_TITLE_SIZE, FONT_MONO, WEEKS_LABEL_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(copy.marksTitle.toUpperCase(), CONTENT_X, MARKS_TITLE_BASELINE)
  for (const [index, mark] of markRows.entries()) {
    const baseline = MARKS_FIRST_BASELINE + index * MARK_ROW_H
    setFont(surface, '400', MARKS_TEXT_SIZE, FONT_MONO, WEEKS_LABEL_LETTER_SPACING)
    surface.fillStyle = CardColours.labelInk
    surface.textAlign = 'left'
    surface.fillText(mark.label.toUpperCase(), CONTENT_X, baseline)
    setFont(surface, '400', 22, FONT_MONO, '0px')
    surface.fillStyle = CardColours.ink
    surface.textAlign = 'right'
    surface.fillText(mark.value, CONTENT_RIGHT, baseline)
  }
}

/** One power bar of the twelve-month evolution, filled only where watts exist. */
function drawPowerBar(surface: CardSurface, x: number, height: number, colour: string): void {
  if (height <= 0) {
    return
  }
  surface.fillStyle = colour
  roundRectPath(
    surface,
    x,
    BARS_BASE - height,
    (CONTENT_W - POWER_BAR_GAP * 11) / 12,
    height,
    POWER_BAR_RADIUS,
  )
  surface.fill()
}

/**
 * Power, only for seasons the file can prove: the year's best weighted
 * average and best maximum, the twelve-month evolution of the weighted
 * average as bars, and the coverage sentence so a partial year cannot read as
 * a complete one. A stat the season cannot measure is left out entirely.
 */
function drawPowerPanel(
  surface: CardSurface,
  power: NonNullable<YearSummary['powerProfile']>,
): void {
  const copy = t.stories['08-dorsal'].carnet
  setFont(surface, '700', POWER_TITLE_SIZE, FONT_MONO, WEEKS_LABEL_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(copy.powerTitle.toUpperCase(), CONTENT_X, POWER_TITLE_BASELINE)

  const stats: { label: string; x: number; value: number | null }[] = [
    { label: copy.weightedAvgPowerLabel, x: CONTENT_X, value: power.totals.bestWeightedAvgPowerW },
    { label: copy.maxPowerLabel, x: POWER_SECOND_STAT_X, value: power.totals.bestMaxPowerW },
  ]
  for (const stat of stats) {
    if (stat.value === null) {
      continue
    }
    setFont(surface, '400', POWER_STAT_VALUE_SIZE, FONT_DISPLAY, '0px')
    surface.fillStyle = CardColours.ink
    surface.textAlign = 'left'
    surface.fillText(`${formatNumber(Math.round(stat.value))} W`, stat.x, POWER_STAT_VALUE_BASELINE)
    setFont(surface, '400', POWER_STAT_LABEL_SIZE, FONT_MONO, POWER_STAT_LABEL_LETTER_SPACING)
    surface.fillStyle = CardColours.labelInk
    surface.fillText(stat.label.toUpperCase(), stat.x, POWER_STAT_LABEL_BASELINE)
  }

  setFont(surface, '400', POWER_CAPTION_SIZE, FONT_MONO, POWER_CAPTION_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(copy.powerEvolutionLabel.toUpperCase(), CONTENT_X, POWER_CAPTION_BASELINE)
  surface.textAlign = 'right'
  surface.fillText(
    powerCoverageSentence(power.totals.sessionsWithPower, power.totals.activityCount).toUpperCase(),
    CONTENT_RIGHT,
    POWER_CAPTION_BASELINE,
  )
  surface.textAlign = 'center'

  const wattsByMonth = new Map<number, number>()
  let maxWatts = 0
  for (const entry of power.months) {
    const watts = entry.bestWeightedAvgPowerW
    if (watts !== null && watts > maxWatts) {
      maxWatts = watts
    }
    if (watts !== null) {
      wattsByMonth.set(entry.month, watts)
    }
  }
  const barWidth = (CONTENT_W - POWER_BAR_GAP * 11) / 12
  const barHeight = BARS_BASE - BARS_TOP
  let peakMonth = 0
  let peakWatts = 0
  for (const [month, watts] of wattsByMonth) {
    if (watts > peakWatts) {
      peakWatts = watts
      peakMonth = month
    }
  }
  for (let month = 1; month <= 12; month += 1) {
    const watts = wattsByMonth.get(month)
    if (watts === undefined) {
      continue
    }
    const height = maxWatts > 0 ? (watts / maxWatts) * barHeight : 0
    const x = CONTENT_X + (month - 1) * (barWidth + POWER_BAR_GAP)
    drawPowerBar(surface, x, height, month === peakMonth ? CardColours.accent : CardColours.ink)
  }

  setFont(surface, '400', MONTH_LABEL_SIZE, FONT_MONO, '0px')
  surface.fillStyle = CardColours.labelInk
  for (let month = 0; month < 12; month += 1) {
    surface.fillText(
      t.monthsAbbr[month] ?? '',
      CONTENT_X + month * (barWidth + POWER_BAR_GAP) + barWidth / 2,
      MONTH_LABEL_BASELINE,
    )
  }
}

/**
 * Paints the whole season card: the field, the rotated plate and its holes,
 * the header, then the four panels top to bottom, then the footer. Each panel
 * renders only when its data exists.
 */
export function drawSeasonCard(surface: SeasonCardSurface, input: SeasonCardInput): void {
  const copy = t.stories['08-dorsal']
  const { summary, name } = input

  // The field.
  surface.fillStyle = CardColours.accent
  surface.beginPath()
  surface.moveTo(0, 0)
  surface.lineTo(SEASON_CARD_WIDTH, 0)
  surface.lineTo(SEASON_CARD_WIDTH, SEASON_CARD_HEIGHT)
  surface.lineTo(0, SEASON_CARD_HEIGHT)
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

  surface.textBaseline = 'alphabetic'

  // The header: the season, the card title and the athlete's name.
  setFont(surface, '600', SEASON_LABEL_SIZE, FONT_MONO, SEASON_LABEL_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(copy.plate.toUpperCase(), CONTENT_X, SEASON_LABEL_BASELINE)

  setFont(surface, '400', TITLE_SIZE, FONT_DISPLAY, '0px')
  surface.fillStyle = CardColours.ink
  surface.fillText(copy.carnet.title.toUpperCase(), CONTENT_X, TITLE_BASELINE)

  setFont(
    surface,
    '700',
    bibCardNameText(name).length > LONG_NAME_LENGTH ? NAME_SIZE_LONG : NAME_SIZE,
    FONT_SANS,
    NAME_LETTER_SPACING,
  )
  surface.fillStyle = CardColours.ink
  surface.fillText(bibCardNameText(name), CONTENT_X, NAME_BASELINE)

  // The panels, only when the season's data exists.
  const sports = summary.sportBreakdown?.sports ?? null
  if (sports !== null && sports.length > 0) {
    drawSportsPanel(surface, sports)
  }

  if (summary.weeklyLoad !== null) {
    drawWeeksPanel(surface, summary.weeklyLoad)
  }

  const marks = bibCardMarkRows(summary)
  if (marks.length > 0) {
    drawMarksPanel(surface, marks)
  }

  if (summary.availability.powerProfile && summary.powerProfile !== null) {
    drawPowerPanel(surface, summary.powerProfile)
  }

  // The footer: the app's own words and the season's card number.
  setFont(surface, '400', FOOTER_SIZE, FONT_MONO, FOOTER_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(copy.madeWith.toUpperCase(), CONTENT_X, FOOTER_BASELINE)
  surface.textAlign = 'right'
  surface.fillText(String(summary.bibCard.number), CONTENT_RIGHT, FOOTER_BASELINE)

  surface.restore()
}
