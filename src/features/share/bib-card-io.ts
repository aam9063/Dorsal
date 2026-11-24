import { t } from '../../shared/i18n'
import { CARD_HEIGHT, CARD_WIDTH, drawBibCard, type BibCardInput } from './render-bib-card'

/**
 * The browser side of the card: fonts are awaited before the first pixel
 * (h11 decision 2 — a cold canvas would paint fallback faces and the bytes
 * would differ), the PNG is generated on demand (decision 6), and sharing is
 * a capability, not a promise (decision 5): `navigator.share` with the file
 * where the API exists, a download otherwise, the same PNG in both paths.
 */

/** The file name both paths use, so a shared and a downloaded card match. */
export const BIB_CARD_FILE_NAME = 'dorsal-2026.png'

/**
 * Resolves once the three card families are really loaded. The explicit
 * `load` calls warm the exact weight/size pairs before `ready`, because
 * `document.fonts.ready` alone only promises that the fonts *in use so far*
 * have settled — a card drawn at the story's first open may still race them.
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

/** Draws the card into a PNG blob of exactly 1080×1920. */
export async function exportBibCardPng(input: BibCardInput): Promise<Blob> {
  await ensureBibCardFonts()
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const context = canvas.getContext('2d')
  if (context === null) {
    throw new Error('the bib card needs a 2D canvas context')
  }
  drawBibCard(context, input)
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
  if (blob === null) {
    throw new Error('the bib card PNG could not be encoded')
  }
  return blob
}

/**
 * Whether this browser can really share the card with its file. The empty
 * file probe is the Web Share API contract for capability detection; a
 * security error in an unsupported context means no.
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
 * will happen in this browser (h11 decision 5).
 */
export function bibCardActionLabel(): string {
  return canShareCardFiles()
    ? t.stories['08-dorsal'].shareLabel
    : t.stories['08-dorsal'].downloadLabel
}

/** Shares the card as a file. A user cancellation is not an error. */
async function shareCardBlob(blob: Blob): Promise<void> {
  const file = new File([blob], BIB_CARD_FILE_NAME, { type: 'image/png' })
  try {
    await navigator.share({
      files: [file],
      title: t.stories['08-dorsal'].title,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }
    throw error
  }
}

/** Downloads the card the way the browser already does it for `blob:` links. */
function downloadCardBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = BIB_CARD_FILE_NAME
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

/** The story's one action: share the file where possible, download otherwise. */
export async function shareOrDownloadBibCard(input: BibCardInput): Promise<void> {
  const blob = await exportBibCardPng(input)
  if (canShareCardFiles()) {
    await shareCardBlob(blob)
  } else {
    downloadCardBlob(blob)
  }
}
