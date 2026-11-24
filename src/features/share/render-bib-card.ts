import type { YearSummary } from '../../core/model/year-summary'
import { formatNumber } from '../../shared/format'
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
 * The composition follows the `W8-Dorsal.dc.html` artboard: an orange field,
 * a rotated bone plate with four punched holes, a dark plate holding the
 * season label, the enormous bib number, the name, the archetype line, the
 * mini monthly profile as a filled silhouette, a dashed tear-off edge and the
 * three closing stats. The card carries no third-party brand (S4): the only
 * name on it is the app's own in "Hecho con Dorsal".
 */

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1920

/** Hex values mirrored from `src/shared/tokens/tokens.css` (canvas cannot read CSS variables). */
export const CardColours = {
  /** `--dorsal-fg` light / `--color-ink`: card lettering on bone (15.4:1). */
  ink: '#0f100d',
  /** `--dorsal-surface` light: the bone plate the card paints on. */
  bone: '#f2f0e9',
  /** `--dorsal-accent`: the field behind the card and the punched holes. */
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

const PLATE_HEIGHT = 64
const PLATE_INSET_X = 106
const PLATE_INNER_X = 24
const PLATE_TEXT_SIZE = 30
const PLATE_LETTER_SPACING = '4px'

const NUMBER_SIZE = 340
const NAME_SIZE = 46
const NAME_LETTER_SPACING = '11px'
const ARCHETYPE_SIZE = 30
const ARCHETYPE_LETTER_SPACING = '3px'

const CONTENT_X = 106
const CONTENT_W = CARD_W - 2 * CONTENT_X

const PROFILE_HEIGHT = 122
const PROFILE_BASE = 684

const DASH_LENGTH = 18
const DASH_GAP = 12
const DASH_THICKNESS = 6
const DIVIDER_Y = 740

const STAT_VALUE_SIZE = 60
const STAT_LABEL_SIZE = 27
const STAT_LABEL_LETTER_SPACING = '2px'
const STAT_VALUE_BASELINE = 804
const STAT_LABEL_BASELINE = 848

const FOOTER_SIZE = 27
const FOOTER_LETTER_SPACING = '3px'
const FOOTER_BASELINE = CARD_H - 60

const PLATE_Y = 50
const NUMBER_BASELINE = PLATE_Y + PLATE_HEIGHT + 260
const NAME_BASELINE = NUMBER_BASELINE + 74
const ARCHETYPE_BASELINE = NAME_BASELINE + 74

/** Quarter of a turn, for the rounded-corner arcs. */
const QUARTER = Math.PI / 2

const FONT_DISPLAY = '"Anton"'
const FONT_SANS = '"Inter"'
const FONT_MONO = '"JetBrains Mono"'

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
  surface.beginPath()
  surface.moveTo(x + radius, y)
  surface.arc(x + width - radius, y + radius, radius, 2 * -QUARTER, 0)
  surface.arc(x + width - radius, y + height - radius, radius, 0, QUARTER)
  surface.arc(x + radius, y + height - radius, radius, QUARTER, 2 * QUARTER)
  surface.arc(x + radius, y + radius, radius, 2 * QUARTER, 3 * QUARTER)
  surface.closePath()
}

/** The mini monthly profile as one filled silhouette, the W3 idea in miniature. */
function profilePath(surface: CardSurface, monthlyDistanceM: readonly number[]): void {
  const max = Math.max(...monthlyDistanceM)
  surface.beginPath()
  surface.moveTo(CONTENT_X, PROFILE_BASE)
  for (let month = 1; month <= 12; month += 1) {
    const distanceM = monthlyDistanceM[month - 1] ?? 0
    const y = PROFILE_BASE - (max > 0 ? (distanceM / max) * PROFILE_HEIGHT : 0)
    surface.lineTo(CONTENT_X + ((month - 1) * CONTENT_W) / 11, y)
  }
  surface.lineTo(CONTENT_X + CONTENT_W, PROFILE_BASE)
  surface.closePath()
  surface.fill()
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
 * its holes, then the lettering, one band per artboard block.
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

  // The dark season plate.
  const plateWidth = CARD_W - 2 * PLATE_INSET_X
  roundRectPath(surface, PLATE_INSET_X, PLATE_Y, plateWidth, PLATE_HEIGHT, 12)
  surface.fillStyle = CardColours.ink
  surface.fill()
  setFont(surface, '600', PLATE_TEXT_SIZE, FONT_MONO, PLATE_LETTER_SPACING)
  surface.fillStyle = CardColours.orange
  surface.textBaseline = 'middle'
  surface.textAlign = 'left'
  surface.fillText(
    copy.plate.toUpperCase(),
    PLATE_INSET_X + PLATE_INNER_X,
    PLATE_Y + PLATE_HEIGHT / 2,
  )
  surface.textAlign = 'right'
  surface.fillText(
    copy.plateKm,
    PLATE_INSET_X + plateWidth - PLATE_INNER_X,
    PLATE_Y + PLATE_HEIGHT / 2,
  )
  surface.textBaseline = 'alphabetic'

  // The bib number, the name and the archetype.
  const centerX = CARD_W / 2
  setFont(surface, '400', NUMBER_SIZE, FONT_DISPLAY, '0px')
  surface.fillStyle = CardColours.ink
  surface.textAlign = 'center'
  surface.fillText(String(summary.bibCard.number), centerX, NUMBER_BASELINE)

  setFont(surface, '700', NAME_SIZE, FONT_SANS, NAME_LETTER_SPACING)
  surface.fillStyle = CardColours.ink
  surface.fillText(bibCardNameText(name), centerX, NAME_BASELINE)

  const archetype = bibCardArchetypeText(summary)
  if (archetype !== null) {
    setFont(surface, '400', ARCHETYPE_SIZE, FONT_MONO, ARCHETYPE_LETTER_SPACING)
    surface.fillStyle = CardColours.labelInk
    surface.fillText(archetype, centerX, ARCHETYPE_BASELINE)
  }

  profilePath(surface, summary.bibCard.monthlyDistanceM)
  dashedDivider(surface)

  // The three closing stats.
  const statWidth = CONTENT_W / 3
  setFont(surface, '400', STAT_VALUE_SIZE, FONT_DISPLAY, '0px')
  surface.fillStyle = CardColours.ink
  for (const [index, row] of bibCardStatRows(summary).entries()) {
    const statX = CONTENT_X + statWidth * index + statWidth / 2
    surface.fillText(row.value, statX, STAT_VALUE_BASELINE)
  }
  setFont(surface, '400', STAT_LABEL_SIZE, FONT_MONO, STAT_LABEL_LETTER_SPACING)
  for (const [index, row] of bibCardStatRows(summary).entries()) {
    const statX = CONTENT_X + statWidth * index + statWidth / 2
    surface.fillText(row.label.toUpperCase(), statX, STAT_LABEL_BASELINE)
  }

  setFont(surface, '400', FOOTER_SIZE, FONT_MONO, FOOTER_LETTER_SPACING)
  surface.fillStyle = CardColours.labelInk
  surface.fillText(copy.madeWith.toUpperCase(), centerX, FOOTER_BASELINE)

  surface.restore()
}
