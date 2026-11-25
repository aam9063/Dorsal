import { MIN_SESSIONS_PER_WEEK } from '../../core/metrics/weekly-load'
import type { YearSummary } from '../../core/model/year-summary'
import { formatKilometres, formatNumber } from '../../shared/format'
import { t, fulfilledWeeksSentence, powerCoverageSentence } from '../../shared/i18n'
import {
  CardColours,
  type CardSurface,
  bibCardMarkRows,
  bibCardNameText,
  drawCardPins,
  drawCardSpineHead,
  drawCardTearOff,
  drawStickerPill,
  monthDayText,
  pillWidth,
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
 * The body is laid out by construction instead of on fixed baselines:
 * `seasonCardLayout` measures every present panel — its rows, its title, its
 * bars — from the data it actually has, stacks the panels with one fixed
 * `PANEL_GAP`, and places the footer after the last panel plus a fixed
 * `BOTTOM_PADDING`. `drawSeasonCard` consumes that same layout, so a test
 * asserted on `seasonCardLayout` is a test on the painted card, and a season
 * with two sports and no power composes as deliberately as one with six
 * sports and watts.
 *
 * The panels share one rhythm: a panel starts its first line at `ROW_LEAD`
 * from its top, a title separates from its rows by `TITLE_TO_ROWS`, and
 * consecutive rows sit `LINE_PITCH` apart. Sport rows read as a list — name,
 * kilometres, counting caption and a short share bar — with the caption copy
 * taken from the same `06-material` keys the DOM replica prints, so the two
 * artifacts cannot drift.
 *
 * The draw is pure over the same `CardSurface` subset the bib card paints
 * with, every string comes from `src/shared/i18n/` and `src/shared/format.ts`.
 * No `Date`, no `Math.random`, no runtime locale: two draws from the same
 * inputs produce the same command stream (odd/tasks/redesign-objeto-dorsal.md,
 * S7).
 *
 * It shares the object language with the bib card: the accent field, the bone
 * plate with its two punched pins, the editorial spine head (stage numeral
 * and mono season label between hairline rules), the dashed tear-off with its
 * punched hole, the accent kept for stamps and the hairline rules bounding
 * the blocks.
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

const CONTENT_X = 106
const CONTENT_W = CARD_W - 2 * CONTENT_X
const CONTENT_RIGHT = CONTENT_X + CONTENT_W

// — Header ——————————————————————————————————————————————————————————————————

const TITLE_BASELINE = 252
const TITLE_SIZE = 66

const NAME_BASELINE = 322
const NAME_SIZE = 44
const NAME_SIZE_LONG = 38
const NAME_LETTER_SPACING = '10px'
const LONG_NAME_LENGTH = 12

/** The dashed tear-off edge below the header, like the bib card's. */
const TEAR_Y = 372

// — Vertical rhythm (the constructed layout) ————————————————————————————————

const BODY_TOP = 424
/** Fixed space between the measured bottom of one panel and the top of the next. */
const PANEL_GAP = 64
/** Fixed space from the plate's bottom edge to the footer baseline. */
const BOTTOM_PADDING = 64
/** Room kept between the last panel and the footer, so they never touch. */
const FOOTER_CLEARANCE = 56
/** Ceiling for the breathing room the layout may add between panels. */
const MAX_PANEL_GAP = 96
/** Panel top to its first baseline (a title or, without one, the first row). */
const ROW_LEAD = 22
/** Title baseline to the first row baseline under it. */
const TITLE_TO_ROWS = 30
/** Baseline pitch of consecutive simple label/value rows inside a panel. */
const LINE_PITCH = 32
/** Descent allowance from the last baseline to the panel's measured bottom. */
const TEXT_DESCENT = 12

// — Sport rows ——————————————————————————————————————————————————————————————

/** Baseline pitch of two sport rows: a tight list, not bars floating in air. */
const SPORT_ROW_H = 62
/** Every row after the first sits this much lower: row 0 carries the most-practiced tag. */
const SPORT_FIRST_EXTRA = 24
/** Row top to the sport name baseline. */
const SPORT_ROW_LEAD = 24
/** Name baseline down to the counting caption baseline. */
const SPORT_CAPTION_DROP = 22
/** The most practiced tag moves onto the stamp pill above the panel's first row. */
const TAG_STAMP_DROP = 28
const TAG_STAMP_SIZE = 15
const TAG_STAMP_LETTER_SPACING = '2px'
const TAG_STAMP_PAD = 28
const TAG_STAMP_H = 40
const TAG_STAMP_ROTATION = -(2.5 * Math.PI) / 180
const SPORT_NAME_X = CONTENT_X + 66
const ICON_SIZE = 44
const ICON_CENTER_OFFSET = 26
const SPORT_ROW_STROKE_WIDTH = 2.4
/** A short right-aligned bar, not a divider across the whole plate. */
const SPORT_BAR_WIDTH = 240
const SPORT_BAR_DROP = 38
const BAR_HEIGHT = 6
const BAR_RADIUS = 3
/** The empty track behind a share bar; decorative fill, never text. */
const BAR_TRACK_COLOUR = 'rgba(15, 16, 13, 0.16)'

// — Weeks ———————————————————————————————————————————————————————————————————

const WEEKS_LABEL_SIZE = 18
const WEEKS_LABEL_LETTER_SPACING = '1px'
const WEEKS_VALUE_SIZE = 26

// — Best marks ——————————————————————————————————————————————————————————————

const MARKS_TITLE_SIZE = 20
const MARKS_TEXT_SIZE = 18

// — Power ———————————————————————————————————————————————————————————————————

const POWER_TITLE_SIZE = 20
const POWER_VALUE_DROP = 56
const POWER_VALUE_SIZE = 52
const POWER_STAT_LABEL_DROP = 26
const POWER_STAT_LABEL_SIZE = 17
const POWER_STAT_LABEL_LETTER_SPACING = '2px'
const POWER_SECOND_STAT_X = CONTENT_X + 260
const POWER_CAPTION_DROP = 24
const POWER_BARS_DROP = 10
const POWER_BARS_HEIGHT = 34
const POWER_BAR_GAP = 10
const POWER_BAR_RADIUS = 5
const POWER_MONTH_LABEL_DROP = 22
const POWER_MONTH_LABEL_SIZE = 15

// — Shared small copy —————————————————————————————————————————————————————————

const NOTE_SIZE = 17
const NOTE_LETTER_SPACING = '1px'

// — Footer ——————————————————————————————————————————————————————————————————

const FOOTER_SIZE = 20
const FOOTER_LETTER_SPACING = '2px'

/** Quarter of a turn, for the rounded-corner arcs. */
const QUARTER = Math.PI / 2

const FONT_DISPLAY = '"Anton"'
const FONT_SANS = '"Inter"'
const FONT_MONO = '"JetBrains Mono"'

/**
 * The vertical skeleton of the plate, exported so a layout regression is a
 * test failure instead of a card nobody notices: the body starts at
 * `bodyTop`, the panels stack with `panelGap` between their measured extents,
 * and the footer follows the last one after `bottomPadding`. The per-data
 * positions themselves live in `seasonCardLayout`.
 */
export const seasonCardGeometry = {
  plateTop: CARD_Y,
  plateHeight: CARD_H,
  plateWidth: CARD_W,
  bodyTop: BODY_TOP,
  panelGap: PANEL_GAP,
  maxPanelGap: MAX_PANEL_GAP,
  footerClearance: FOOTER_CLEARANCE,
  bottomPadding: BOTTOM_PADDING,
  rowLead: ROW_LEAD,
  titleToRows: TITLE_TO_ROWS,
  linePitch: LINE_PITCH,
  textDescent: TEXT_DESCENT,
  sportRowHeight: SPORT_ROW_H,
  sportFirstExtra: SPORT_FIRST_EXTRA,
  sportRowLead: SPORT_ROW_LEAD,
  sportCaptionDrop: SPORT_CAPTION_DROP,
  tagStampDrop: TAG_STAMP_DROP,
  tearY: TEAR_Y,
  powerPanelHeight: powerPanelHeight(),
  footerSize: FOOTER_SIZE,
} as const

/** The vertical band one panel occupies on the plate. */
export interface SeasonPanelLayout {
  top: number
  bottom: number
}

export interface SeasonCardLayout {
  sports: SeasonPanelLayout | null
  weeks: SeasonPanelLayout | null
  marks: SeasonPanelLayout | null
  power: SeasonPanelLayout | null
  footerBaseline: number
}

type SportRow = NonNullable<YearSummary['sportBreakdown']>['sports'][number]
type SeasonPanelKey = 'sports' | 'weeks' | 'marks' | 'power'

/**
 * The sports panel's height for `rowCount` rows. The metrics emit at most one
 * entry per `SportKind` (six), so the worst case is bounded.
 */
function sportPanelHeight(rowCount: number): number {
  return (
    (rowCount - 1) * SPORT_ROW_H +
    SPORT_FIRST_EXTRA +
    SPORT_ROW_LEAD +
    SPORT_CAPTION_DROP +
    TEXT_DESCENT
  )
}

/** The weeks panel's height: the best-week row (when proven), the streak row and the threshold note. */
function weeksPanelHeight(weeklyLoad: NonNullable<YearSummary['weeklyLoad']>): number {
  const rows = (weeklyLoad.best !== null ? 1 : 0) + 1
  const lines = rows + 1
  return ROW_LEAD + (lines - 1) * LINE_PITCH + TEXT_DESCENT
}

/** The marks panel's height: its title plus one label/value row per mark. */
function marksPanelHeight(rowCount: number): number {
  return ROW_LEAD + TITLE_TO_ROWS + (rowCount - 1) * LINE_PITCH + TEXT_DESCENT
}

/** The power panel's height: its title, its stats, its caption, its bars and its month labels. */
function powerPanelHeight(): number {
  return (
    ROW_LEAD +
    POWER_VALUE_DROP +
    POWER_STAT_LABEL_DROP +
    POWER_CAPTION_DROP +
    POWER_BARS_DROP +
    POWER_BARS_HEIGHT +
    POWER_MONTH_LABEL_DROP +
    TEXT_DESCENT
  )
}

/**
 * The whole vertical layout, computed from the data before anything is
 * painted: each present panel takes the height its data needs, consecutive
 * panels are separated by the fixed `PANEL_GAP`, and the footer baseline
 * follows the last panel after the fixed `BOTTOM_PADDING`. `drawSeasonCard`
 * consumes this same layout, so a season of any size composes inside the
 * plate by construction.
 */
export function seasonCardLayout(summary: YearSummary): SeasonCardLayout {
  const candidates: { key: SeasonPanelKey; height: number }[] = []
  const sports = summary.sportBreakdown?.sports ?? null
  if (sports !== null && sports.length > 0) {
    candidates.push({ key: 'sports', height: sportPanelHeight(sports.length) })
  }
  if (summary.weeklyLoad !== null) {
    candidates.push({ key: 'weeks', height: weeksPanelHeight(summary.weeklyLoad) })
  }
  const markRows = bibCardMarkRows(summary)
  if (markRows.length > 0) {
    candidates.push({ key: 'marks', height: marksPanelHeight(markRows.length) })
  }
  if (summary.availability.powerProfile && summary.powerProfile !== null) {
    candidates.push({ key: 'power', height: powerPanelHeight() })
  }

  // The footer is pinned to the plate's bottom edge, and the panels take the
  // room that is left: the gap between them grows up to `MAX_PANEL_GAP`, and
  // whatever still remains is split evenly above and below the stack. A sparse
  // season then reads as an airy card instead of a card with a hole in it.
  const footerBaseline = CARD_H - BOTTOM_PADDING
  const contentHeight = candidates.reduce((total, candidate) => total + candidate.height, 0)
  const gapCount = Math.max(candidates.length - 1, 0)
  const room = footerBaseline - FOOTER_CLEARANCE - BODY_TOP - contentHeight
  const gap =
    gapCount === 0 ? PANEL_GAP : Math.min(MAX_PANEL_GAP, Math.max(PANEL_GAP, room / gapCount))
  const slack = Math.max(0, room - gap * gapCount)

  const panels = new Map<SeasonPanelKey, SeasonPanelLayout>()
  let cursor = BODY_TOP + slack / 2
  for (const candidate of candidates) {
    const panel = { top: cursor, bottom: cursor + candidate.height }
    panels.set(candidate.key, panel)
    cursor = panel.bottom + gap
  }
  return {
    sports: panels.get('sports') ?? null,
    weeks: panels.get('weeks') ?? null,
    marks: panels.get('marks') ?? null,
    power: panels.get('power') ?? null,
    footerBaseline,
  }
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
 * One row per sport present in 2026, ordered by moving time (S8), reading as
 * a list: the icon, the sport name with its kilometres, a short share bar and
 * the counting caption — the same activity-count and share copy the DOM
 * replica prints, from the same i18n keys. The first entry is the most
 * practiced sport and carries the tag that says so.
 */
function drawSportsPanel(
  surface: SeasonCardSurface,
  sports: readonly SportRow[],
  panel: SeasonPanelLayout,
): void {
  const copy = t.stories['08-dorsal'].carnet
  const material = t.stories['06-material']
  const maxShare = sports.reduce((acc, row) => Math.max(acc, row.share), 0)
  const iconScale = ICON_SIZE / SPORT_ICON_VIEWBOX

  // The most practiced tag, stamped in accent across the panel's top edge.
  const tagText = copy.mostPracticedLabel.toUpperCase()
  const tagWidth = pillWidth(tagText, TAG_STAMP_SIZE, TAG_STAMP_LETTER_SPACING, TAG_STAMP_PAD)
  drawStickerPill(
    surface,
    tagText,
    CONTENT_X + tagWidth / 2,
    panel.top - TAG_STAMP_DROP,
    TAG_STAMP_SIZE,
    TAG_STAMP_LETTER_SPACING,
    TAG_STAMP_H,
    TAG_STAMP_PAD,
    TAG_STAMP_ROTATION,
  )

  for (const [index, row] of sports.entries()) {
    const top = panel.top + index * SPORT_ROW_H + (index === 0 ? 0 : SPORT_FIRST_EXTRA)

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

    const nameBaseline = top + SPORT_ROW_LEAD
    setFont(surface, '600', 26, FONT_SANS, '0px')
    surface.fillStyle = CardColours.ink
    surface.textAlign = 'left'
    surface.fillText(t.sports[row.sport], SPORT_NAME_X, nameBaseline)

    setFont(surface, '400', 22, FONT_MONO, '0px')
    surface.fillStyle = CardColours.ink
    surface.textAlign = 'right'
    surface.fillText(`${formatKilometres(row.distanceM)} km`, CONTENT_RIGHT, nameBaseline)

    setFont(surface, '400', NOTE_SIZE, FONT_MONO, NOTE_LETTER_SPACING)
    surface.fillStyle = CardColours.labelInk
    surface.textAlign = 'left'
    const unit = row.activityCount === 1 ? material.rowActivitySingular : material.rowActivityPlural
    const caption = `${formatNumber(row.activityCount)} ${unit} · ${formatNumber(
      Math.round(row.share * 100),
    )} %`
    surface.fillText(caption.toUpperCase(), SPORT_NAME_X, nameBaseline + SPORT_CAPTION_DROP)

    drawShareBar(
      surface,
      CONTENT_RIGHT - SPORT_BAR_WIDTH,
      top + SPORT_BAR_DROP,
      SPORT_BAR_WIDTH,
      row.share,
      maxShare,
      index === 0 ? CardColours.accent : CardColours.ink,
    )
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
  panel: SeasonPanelLayout,
): void {
  const copy = t.stories['08-dorsal'].carnet
  const rows: { label: string; value: string }[] = []
  const best = weeklyLoad.best
  if (best !== null) {
    rows.push({
      label: copy.bestWeekLabel,
      value: `${formatKilometres(best.distanceM)} km · ${monthDayText(best.monday.month, best.monday.day)}`,
    })
  }
  const streak = weeklyLoad.longestFulfilledStreak
  rows.push({
    label: copy.consecutiveLead,
    value: `${formatNumber(streak)} ${streak === 1 ? copy.weeksUnitSingular : copy.weeksUnit}`,
  })
  for (const [index, row] of rows.entries()) {
    drawLabelValueRow(
      surface,
      row.label,
      row.value,
      panel.top + ROW_LEAD + index * LINE_PITCH,
      WEEKS_VALUE_SIZE,
    )
  }
  setFont(surface, '400', NOTE_SIZE, FONT_MONO, NOTE_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(
    fulfilledWeeksSentence(MIN_SESSIONS_PER_WEEK),
    CONTENT_X,
    panel.top + ROW_LEAD + rows.length * LINE_PITCH,
  )
}

/** The season's best marks, in the same wording the dorsal prints. */
function drawMarksPanel(
  surface: CardSurface,
  markRows: readonly { label: string; value: string }[],
  panel: SeasonPanelLayout,
): void {
  const copy = t.stories['08-dorsal'].carnet
  setFont(surface, '700', MARKS_TITLE_SIZE, FONT_MONO, NOTE_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(copy.marksTitle.toUpperCase(), CONTENT_X, panel.top + ROW_LEAD)
  for (const [index, mark] of markRows.entries()) {
    const baseline = panel.top + ROW_LEAD + TITLE_TO_ROWS + index * LINE_PITCH
    setFont(surface, '400', MARKS_TEXT_SIZE, FONT_MONO, NOTE_LETTER_SPACING)
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
function drawPowerBar(surface: CardSurface, x: number, barsBase: number, height: number): void {
  if (height <= 0) {
    return
  }
  roundRectPath(
    surface,
    x,
    barsBase - height,
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
  panel: SeasonPanelLayout,
): void {
  const copy = t.stories['08-dorsal'].carnet
  const titleBaseline = panel.top + ROW_LEAD
  const valueBaseline = titleBaseline + POWER_VALUE_DROP
  const statLabelBaseline = valueBaseline + POWER_STAT_LABEL_DROP
  const captionBaseline = statLabelBaseline + POWER_CAPTION_DROP
  const barsTop = captionBaseline + POWER_BARS_DROP
  const barsBase = barsTop + POWER_BARS_HEIGHT
  const monthBaseline = barsBase + POWER_MONTH_LABEL_DROP

  setFont(surface, '700', POWER_TITLE_SIZE, FONT_MONO, NOTE_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(copy.powerTitle.toUpperCase(), CONTENT_X, titleBaseline)

  const stats: { label: string; x: number; value: number | null }[] = [
    { label: copy.weightedAvgPowerLabel, x: CONTENT_X, value: power.totals.bestWeightedAvgPowerW },
    { label: copy.maxPowerLabel, x: POWER_SECOND_STAT_X, value: power.totals.bestMaxPowerW },
  ]
  for (const stat of stats) {
    if (stat.value === null) {
      continue
    }
    setFont(surface, '400', POWER_VALUE_SIZE, FONT_DISPLAY, '0px')
    surface.fillStyle = CardColours.ink
    surface.textAlign = 'left'
    surface.fillText(`${formatNumber(Math.round(stat.value))} W`, stat.x, valueBaseline)
    setFont(surface, '400', POWER_STAT_LABEL_SIZE, FONT_MONO, POWER_STAT_LABEL_LETTER_SPACING)
    surface.fillStyle = CardColours.labelInk
    surface.fillText(stat.label.toUpperCase(), stat.x, statLabelBaseline)
  }

  setFont(surface, '400', NOTE_SIZE, FONT_MONO, NOTE_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(copy.powerEvolutionLabel.toUpperCase(), CONTENT_X, captionBaseline)
  surface.textAlign = 'right'
  surface.fillText(
    powerCoverageSentence(power.totals.sessionsWithPower, power.totals.activityCount).toUpperCase(),
    CONTENT_RIGHT,
    captionBaseline,
  )
  surface.textAlign = 'center'

  const barWidth = (CONTENT_W - POWER_BAR_GAP * 11) / 12
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
    const height = maxWatts > 0 ? (watts / maxWatts) * POWER_BARS_HEIGHT : 0
    const x = CONTENT_X + (month - 1) * (barWidth + POWER_BAR_GAP)
    surface.fillStyle = month === peakMonth ? CardColours.accent : CardColours.ink
    drawPowerBar(surface, x, barsBase, height)
  }

  setFont(surface, '400', POWER_MONTH_LABEL_SIZE, FONT_MONO, '0px')
  surface.fillStyle = CardColours.labelInk
  for (let month = 0; month < 12; month += 1) {
    surface.fillText(
      t.monthsAbbr[month] ?? '',
      CONTENT_X + month * (barWidth + POWER_BAR_GAP) + barWidth / 2,
      monthBaseline,
    )
  }
}

/**
 * Paints the whole season card: the field, the rotated plate and its holes,
 * the header, then the panels stacked on the computed layout — each one only
 * when its data exists — and the footer after the last panel's measured
 * bottom plus the fixed bottom padding.
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
  drawCardPins(surface)
  drawCardSpineHead(surface, copy.plate)

  surface.textBaseline = 'alphabetic'

  // The header: the card title and the athlete's name, under the spine head.
  setFont(surface, '400', TITLE_SIZE, FONT_DISPLAY, '0px')
  surface.fillStyle = CardColours.ink
  surface.textAlign = 'left'
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

  drawCardTearOff(surface, TEAR_Y)

  // The panels, stacked on the layout computed from the season's own data.
  const layout = seasonCardLayout(summary)
  const sports = summary.sportBreakdown?.sports ?? null
  if (layout.sports !== null && sports !== null && sports.length > 0) {
    drawSportsPanel(surface, sports, layout.sports)
  }
  if (layout.weeks !== null && summary.weeklyLoad !== null) {
    drawWeeksPanel(surface, summary.weeklyLoad, layout.weeks)
  }
  const marks = bibCardMarkRows(summary)
  if (layout.marks !== null && marks.length > 0) {
    drawMarksPanel(surface, marks, layout.marks)
  }
  if (layout.power !== null && summary.powerProfile !== null) {
    drawPowerPanel(surface, summary.powerProfile, layout.power)
  }

  // The footer: the app's own words and the season's card number.
  setFont(surface, '400', FOOTER_SIZE, FONT_MONO, FOOTER_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.textAlign = 'left'
  surface.fillText(copy.madeWith.toUpperCase(), CONTENT_X, layout.footerBaseline)
  surface.textAlign = 'right'
  surface.fillText(String(summary.bibCard.number), CONTENT_RIGHT, layout.footerBaseline)

  surface.restore()
}
