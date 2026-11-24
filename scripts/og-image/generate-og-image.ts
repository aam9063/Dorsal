/**
 * Generates the social preview and the PNG icon set by screenshotting
 * self-contained HTML artboards with Playwright, so the images use the same
 * self-hosted families (`@fontsource`, embedded as data URLs) and the same
 * palette as the app (`src/shared/tokens/tokens.css`): the social preview
 * cannot drift from the product and no third-party artwork enters the repo
 * (odd/tasks/h12-launch-hardening.md decision 5).
 *
 * The copy comes from `src/shared/i18n/`, never retyped. Every output is
 * checked against the PNG header before it is written, so a wrong-size render
 * fails loudly instead of shipping. Targets: `og` (public/og-image.png at
 * exactly 1200×630), `icons` (icon-192, icon-512 and apple-touch-icon), `all`
 * (the default). The generator is idempotent: same inputs, same files.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { t } from '../../src/shared/i18n'

type Target = 'og' | 'icons' | 'all'

const TARGETS: readonly Target[] = ['og', 'icons', 'all']

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..', '..')
const publicDir = path.join(rootDir, 'public')

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const ICON_SIZES = [192, 512] as const
const APPLE_TOUCH_ICON_SIZE = 180

interface FontSpec {
  family: string
  weight: string
  /** Path from the repo root of the self-hosted woff2 shipped by @fontsource. */
  file: string
}

const FONTS: readonly FontSpec[] = [
  {
    family: 'Anton',
    weight: '400',
    file: 'node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2',
  },
  {
    family: 'Inter',
    weight: '400',
    file: 'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2',
  },
  {
    family: 'Inter',
    weight: '600',
    file: 'node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2',
  },
  {
    family: 'Inter',
    weight: '700',
    file: 'node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2',
  },
  {
    family: 'JetBrains Mono',
    weight: '400',
    file: 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',
  },
  {
    family: 'JetBrains Mono',
    weight: '600',
    file: 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2',
  },
]

/** Palette mirrored from `src/shared/tokens/tokens.css` (CSS cannot be read here). */
const COLOURS = {
  ink: '#0f100d',
  bone: '#f2f0e9',
  orange: '#fc5200',
  boneMuted: '#c9c8bf',
  labelInk: '#5e5f58',
} as const

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Fails loudly if the rendered PNG is not exactly the requested size. */
function assertPngSize(png: Buffer, width: number, height: number, label: string): void {
  const signatureMatches = PNG_SIGNATURE.every((byte, index) => png[index] === byte)
  const ihdrWidth = png.readUInt32BE(16)
  const ihdrHeight = png.readUInt32BE(20)
  if (!signatureMatches || ihdrWidth !== width || ihdrHeight !== height) {
    throw new Error(
      `${label} is not ${width}×${height}: the PNG header reports ${ihdrWidth}×${ihdrHeight}` +
        `${signatureMatches ? '' : ' and is not a valid PNG'}`,
    )
  }
}

/** Embeds the @fontsource woff2 files as data URLs so the artboard is self-contained. */
async function fontFaces(specs: readonly FontSpec[]): Promise<string> {
  const faces = await Promise.all(
    specs.map(async ({ family, weight, file }) => {
      const woff2 = await readFile(path.join(rootDir, file))
      return [
        '@font-face {',
        `  font-family: '${family}';`,
        `  font-style: normal;`,
        `  font-weight: ${weight};`,
        `  src: url(data:font/woff2;base64,${woff2.toString('base64')}) format('woff2');`,
        '}',
      ].join('\n')
    }),
  )
  return faces.join('\n')
}

/** Renders an artboard and writes its PNG, refusing anything but the exact size. */
async function renderPng(
  html: string,
  loadSpecs: readonly string[],
  width: number,
  height: number,
  outFile: string,
): Promise<void> {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width, height } })
    await page.setContent(html, { waitUntil: 'load' })
    await page.evaluate(
      async (families) => {
        await Promise.all(families.map((family) => document.fonts.load(family)))
        await document.fonts.ready
      },
      [...loadSpecs],
    )
    const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width, height } })
    assertPngSize(png, width, height, outFile)
    await writeFile(outFile, png)
  } finally {
    await browser.close()
  }
}

interface OgCopy {
  name: string
  eyebrow: string
  promise: string
  season: string
  chip: string
  chipNumber: string
}

/** Copy resolved from the app's own strings — the artboard retypes nothing. */
function ogCopy(): OgCopy {
  return {
    name: t.brand.name,
    eyebrow: t.landing.eyebrow,
    promise: `${t.brand.tagline} en un dorsal`,
    season: t.landing.card.seasonLabel,
    chip: t.landing.cta,
    chipNumber: t.brand.chip,
  }
}

/** The 1200×630 artboard: ink field, orange accent, and the card's geometry as a hint. */
function ogArtboardHtml(faces: string, copy: OgCopy): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <style>
      ${faces}
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        width: ${OG_WIDTH}px;
        height: ${OG_HEIGHT}px;
      }
      .board {
        position: relative;
        width: ${OG_WIDTH}px;
        height: ${OG_HEIGHT}px;
        overflow: hidden;
        background: ${COLOURS.ink};
      }
      .plate {
        position: absolute;
        top: -90px;
        right: -44px;
        width: 470px;
        height: 900px;
        background: ${COLOURS.bone};
        border-radius: 36px;
        transform: rotate(-6deg);
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .holes {
        margin-top: 122px;
        width: 68%;
        display: flex;
        justify-content: space-between;
      }
      .hole {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: ${COLOURS.orange};
      }
      .band {
        margin-top: 54px;
        width: calc(100% - 96px);
        padding: 17px 22px;
        border-radius: 14px;
        background: ${COLOURS.ink};
        color: ${COLOURS.orange};
        font: 600 21px 'JetBrains Mono';
        letter-spacing: 4px;
        display: flex;
        justify-content: space-between;
      }
      .number {
        margin-top: 40px;
        font: 400 200px 'Anton';
        line-height: 1;
        color: ${COLOURS.ink};
      }
      .tear {
        margin-top: 52px;
        width: calc(100% - 96px);
        border-top: 4px dashed ${COLOURS.labelInk};
      }
      .yard {
        position: absolute;
        left: 84px;
        top: 104px;
        width: 640px;
      }
      .eyebrow {
        font: 600 20px 'JetBrains Mono';
        letter-spacing: 5px;
        text-transform: uppercase;
        color: ${COLOURS.orange};
      }
      .name {
        margin-top: 26px;
        font: 400 170px 'Anton';
        line-height: 0.92;
        text-transform: uppercase;
        color: ${COLOURS.bone};
      }
      .promise {
        margin-top: 32px;
        max-width: 590px;
        font: 600 40px 'Inter';
        line-height: 1.18;
        color: ${COLOURS.boneMuted};
      }
      .chip {
        display: inline-block;
        margin-top: 36px;
        padding: 14px 26px;
        border-radius: 999px;
        background: ${COLOURS.orange};
        color: ${COLOURS.ink};
        font: 700 19px 'JetBrains Mono';
        letter-spacing: 2px;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <div class="board">
      <div class="plate">
        <div class="holes">
          <div class="hole"></div>
          <div class="hole"></div>
        </div>
        <div class="band">
          <span>${copy.season}</span>
          <span>${copy.chipNumber}</span>
        </div>
        <div class="number">${copy.chipNumber}</div>
        <div class="tear"></div>
      </div>
      <div class="yard">
        <div class="eyebrow">${copy.eyebrow}</div>
        <div class="name">${copy.name}</div>
        <div class="promise">${copy.promise}</div>
        <span class="chip">${copy.chip}</span>
      </div>
    </div>
  </body>
</html>`
}

/**
 * The square icon artboard: an orange field and the bone bib plate with two
 * punched holes and the chip number, legible from 180 px down.
 */
function iconArtboardHtml(faces: string, size: number, chipNumber: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <style>
      ${faces}
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      .board {
        width: ${size}px;
        height: ${size}px;
        background: ${COLOURS.orange};
        display: grid;
        place-items: center;
        overflow: hidden;
      }
      .plate {
        width: 70%;
        height: 86%;
        background: ${COLOURS.bone};
        border-radius: ${Math.round(size * 0.12)}px;
        transform: rotate(-5deg);
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .holes {
        margin-top: ${Math.round(size * 0.11)}px;
        width: 60%;
        display: flex;
        justify-content: space-between;
      }
      .hole {
        width: ${Math.round(size * 0.05)}px;
        height: ${Math.round(size * 0.05)}px;
        border-radius: 50%;
        background: ${COLOURS.orange};
      }
      .number {
        margin-top: ${Math.round(size * 0.09)}px;
        font: 400 ${Math.round(size * 0.33)}px 'Anton';
        line-height: 1;
        color: ${COLOURS.ink};
      }
    </style>
  </head>
  <body>
    <div class="board">
      <div class="plate">
        <div class="holes">
          <div class="hole"></div>
          <div class="hole"></div>
        </div>
        <div class="number">${chipNumber}</div>
      </div>
    </div>
  </body>
</html>`
}

async function generateOg(): Promise<void> {
  const copy = ogCopy()
  const faces = await fontFaces(FONTS)
  const loadSpecs = [
    '400 100px Anton',
    '400 16px Inter',
    '600 16px Inter',
    '700 16px Inter',
    '400 16px "JetBrains Mono"',
    '600 16px "JetBrains Mono"',
  ]
  const outFile = path.join(publicDir, 'og-image.png')
  await renderPng(ogArtboardHtml(faces, copy), loadSpecs, OG_WIDTH, OG_HEIGHT, outFile)
  console.log(`og:image: wrote ${outFile} at ${OG_WIDTH}×${OG_HEIGHT}`)
}

async function generateIcons(): Promise<void> {
  const faces = await fontFaces(FONTS.filter(({ family }) => family === 'Anton'))
  const outputs = [
    ...ICON_SIZES.map((size) => [size, path.join(publicDir, `icon-${size}.png`)] as const),
    [APPLE_TOUCH_ICON_SIZE, path.join(publicDir, 'apple-touch-icon.png')] as const,
  ]
  for (const [size, outFile] of outputs) {
    await renderPng(
      iconArtboardHtml(faces, size, t.brand.chip),
      ['400 100px Anton'],
      size,
      size,
      outFile,
    )
    console.log(`icons: wrote ${outFile} at ${size}×${size}`)
  }
}

function parseTarget(argv: readonly string[]): Target {
  const requested = argv[2] ?? 'all'
  const target = TARGETS.find((candidate) => candidate === requested)
  if (target === undefined) {
    throw new Error(`unknown target '${requested}': expected one of ${TARGETS.join(', ')}, all`)
  }
  return target
}

async function main(): Promise<void> {
  const target = parseTarget(process.argv)
  if (target === 'og' || target === 'all') {
    await generateOg()
  }
  if (target === 'icons' || target === 'all') {
    await generateIcons()
  }
}

await main()
