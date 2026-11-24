import { t } from '../../shared/i18n'
import { CARD_HEIGHT, CARD_WIDTH, type BibCardInput, drawBibCard } from './render-bib-card'
import {
  SEASON_CARD_HEIGHT,
  SEASON_CARD_WIDTH,
  type SeasonCardInput,
  type SeasonCardSurface,
  drawSeasonCard,
} from './render-season-card'

/**
 * The browser side of both cards: fonts are awaited before the first pixel
 * (h11 decision 2 — a cold canvas would paint fallback faces and the bytes
 * would differ), the PNG is generated on demand (decision 6), and sharing is
 * a capability, not a promise (decision 5): `navigator.share` with the file
 * where the API exists, a download otherwise, the same PNG in both paths.
 * The bib card and the season card share this one plumbing and differ only in
 * their draw, size, file name and copy (odd/tasks/h11b-season-cards.md T8).
 */

/** The file name both bib-card paths use, so a shared and a downloaded card match. */
export const BIB_CARD_FILE_NAME = 'dorsal-2026.png'

/** The file name both season-card paths use, same contract as the bib card. */
export const SEASON_CARD_FILE_NAME = 'carnet-2026.png'

/**
 * Resolves once the three card families are really loaded. Both cards need
 * exactly these weight/size pairs. The explicit `load` calls warm them before
 * `ready`, because `document.fonts.ready` alone only promises that the fonts
 * *in use so far* have settled — a card drawn at the story's first open may
 * still race them.
 */
export async function ensureBibCardFonts(): Promise<void> {
  if (typeof document === 'undefined') {
    return
  }
  const fonts = document.fonts
  if (fonts === undefined) {
    return
  }
  await Promise.all([
    fonts.load('400 100px Anton'),
    fonts.load('700 16px Inter'),
    fonts.load('400 16px "JetBrains Mono"'),
    fonts.load('600 16px "JetBrains Mono"'),
  ])
  await fonts.ready
}

/** Draws a card into a PNG blob of exactly its declared 1080×1920. */
async function exportCardPng(
  width: number,
  height: number,
  name: string,
  draw: (context: CanvasRenderingContext2D) => void,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (context === null) {
    throw new Error(`the ${name} needs a 2D canvas context`)
  }
  draw(context)
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
  if (blob === null) {
    throw new Error(`the ${name} PNG could not be encoded`)
  }
  return blob
}

/** Draws the bib card into a PNG blob of exactly 1080×1920. */
export async function exportBibCardPng(input: BibCardInput): Promise<Blob> {
  await ensureBibCardFonts()
  return exportCardPng(CARD_WIDTH, CARD_HEIGHT, 'bib card', (context) =>
    drawBibCard(context, input),
  )
}

/** Draws the season card into a PNG blob of exactly 1080×1920. */
export async function exportSeasonCardPng(input: SeasonCardInput): Promise<Blob> {
  await ensureBibCardFonts()
  return exportCardPng(SEASON_CARD_WIDTH, SEASON_CARD_HEIGHT, 'season card', (context) =>
    drawSeasonCard(new SeasonCardCanvas(context), input),
  )
}

/**
 * `CanvasRenderingContext2D` satisfies the fill subset the bib card paints
 * with structurally, but not the whole `SeasonCardSurface`: the platform types
 * `strokeStyle` as the wider `string | CanvasGradient | CanvasPattern`, while
 * the sport icons need the string the card actually paints with. This adapter
 * keeps the delegation explicit instead of casting the context backwards: the
 * methods forward one to one, the state fields forward through getters and
 * setters, and `strokeStyle` remembers exactly the string that was set.
 */
class SeasonCardCanvas implements SeasonCardSurface {
  #strokeStyle = ''
  readonly #context: CanvasRenderingContext2D

  constructor(context: CanvasRenderingContext2D) {
    this.#context = context
  }

  save = (): void => this.#context.save()

  restore = (): void => this.#context.restore()

  translate = (x: number, y: number): void => this.#context.translate(x, y)

  rotate = (angle: number): void => this.#context.rotate(angle)

  scale = (x: number, y: number): void => this.#context.scale(x, y)

  beginPath = (): void => this.#context.beginPath()

  closePath = (): void => this.#context.closePath()

  moveTo = (x: number, y: number): void => this.#context.moveTo(x, y)

  lineTo = (x: number, y: number): void => this.#context.lineTo(x, y)

  bezierCurveTo = (x1: number, y1: number, x2: number, y2: number, x: number, y: number): void =>
    this.#context.bezierCurveTo(x1, y1, x2, y2, x, y)

  quadraticCurveTo = (x1: number, y1: number, x: number, y: number): void =>
    this.#context.quadraticCurveTo(x1, y1, x, y)

  arc = (x: number, y: number, radius: number, startAngle: number, endAngle: number): void =>
    this.#context.arc(x, y, radius, startAngle, endAngle)

  stroke = (): void => this.#context.stroke()

  fill = (): void => this.#context.fill()

  fillText = (text: string, x: number, y: number): void => this.#context.fillText(text, x, y)

  get fillStyle(): string | CanvasGradient | CanvasPattern {
    return this.#context.fillStyle
  }

  set fillStyle(value: string | CanvasGradient | CanvasPattern) {
    this.#context.fillStyle = value
  }

  get font(): string {
    return this.#context.font
  }

  set font(value: string) {
    this.#context.font = value
  }

  get textAlign(): CanvasTextAlign {
    return this.#context.textAlign
  }

  set textAlign(value: CanvasTextAlign) {
    this.#context.textAlign = value
  }

  get textBaseline(): CanvasTextBaseline {
    return this.#context.textBaseline
  }

  set textBaseline(value: CanvasTextBaseline) {
    this.#context.textBaseline = value
  }

  get letterSpacing(): string {
    return this.#context.letterSpacing
  }

  set letterSpacing(value: string) {
    this.#context.letterSpacing = value
  }

  get strokeStyle(): string {
    return this.#strokeStyle
  }

  set strokeStyle(value: string) {
    this.#strokeStyle = value
    this.#context.strokeStyle = value
  }

  get lineWidth(): number {
    return this.#context.lineWidth
  }

  set lineWidth(value: number) {
    this.#context.lineWidth = value
  }

  get lineJoin(): CanvasLineJoin {
    return this.#context.lineJoin
  }

  set lineJoin(value: CanvasLineJoin) {
    this.#context.lineJoin = value
  }

  get lineCap(): CanvasLineCap {
    return this.#context.lineCap
  }

  set lineCap(value: CanvasLineCap) {
    this.#context.lineCap = value
  }
}

/**
 * Whether this browser can really share a card with its file. The empty
 * file probe is the Web Share API contract for capability detection; a
 * security error in an unsupported context means no. Both cards share it,
 * since the capability does not depend on the card.
 */
export function canShareCardFiles(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return false
  }
  try {
    return navigator.canShare({ files: [] })
  } catch {
    return false
  }
}

/**
 * The action's label, decided at render time and always truthful about what
 * will happen in this browser (h11 decision 5). Each card keeps its own
 * wording, so the button never promises a share the browser cannot do.
 */
function cardActionLabel(shareText: string, downloadText: string): string {
  return canShareCardFiles() ? shareText : downloadText
}

/** The bib card's action label for this browser. */
export function bibCardActionLabel(): string {
  return cardActionLabel(t.stories['08-dorsal'].shareLabel, t.stories['08-dorsal'].downloadLabel)
}

/** The season card's action label for this browser. */
export function seasonCardActionLabel(): string {
  const carnet = t.stories['08-dorsal'].carnet
  return cardActionLabel(carnet.shareLabel, carnet.downloadLabel)
}

/** Shares a card as a file. A user cancellation is not an error. */
async function shareCardFile(blob: Blob, fileName: string, title: string): Promise<void> {
  const file = new File([blob], fileName, { type: 'image/png' })
  try {
    await navigator.share({
      files: [file],
      title,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }
    throw error
  }
}

/** Downloads a card the way the browser already does it for `blob:` links. */
function downloadCardFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

/** One card's action: share the file where possible, download otherwise. */
async function shareOrDownloadCard(blob: Blob, fileName: string, title: string): Promise<void> {
  if (canShareCardFiles()) {
    await shareCardFile(blob, fileName, title)
  } else {
    downloadCardFile(blob, fileName)
  }
}

/** The bib card's action: share the file where possible, download otherwise. */
export async function shareOrDownloadBibCard(input: BibCardInput): Promise<void> {
  await shareOrDownloadCard(
    await exportBibCardPng(input),
    BIB_CARD_FILE_NAME,
    t.stories['08-dorsal'].title,
  )
}

/** The season card's action: share the file where possible, download otherwise. */
export async function shareOrDownloadSeasonCard(input: SeasonCardInput): Promise<void> {
  const carnet = t.stories['08-dorsal'].carnet
  await shareOrDownloadCard(await exportSeasonCardPng(input), SEASON_CARD_FILE_NAME, carnet.title)
}
