import type { SportKind } from '../../core/model'

/** Width of the icon viewBox in path units; every path is authored inside `0..24`. */
export const SPORT_ICON_VIEWBOX = 24

/** Default stroke weight, expressed in target pixels, not viewBox units. */
export const SPORT_ICON_STROKE_WIDTH = 1.75

export type PathCommand =
  | { readonly kind: 'move'; readonly x: number; readonly y: number }
  | { readonly kind: 'line'; readonly x: number; readonly y: number }
  | {
      readonly kind: 'cubic'
      readonly x1: number
      readonly y1: number
      readonly x2: number
      readonly y2: number
      readonly x: number
      readonly y: number
    }
  | {
      readonly kind: 'quadratic'
      readonly x1: number
      readonly y1: number
      readonly x: number
      readonly y: number
    }
  | { readonly kind: 'close' }

export type Bounds = {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}

export type SportIconContext = {
  save(): void
  restore(): void
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void
  quadraticCurveTo(x1: number, y1: number, x: number, y: number): void
  closePath(): void
  stroke(): void
  translate(x: number, y: number): void
  scale(x: number, y: number): void
  lineWidth: number
  strokeStyle: string
  lineJoin: CanvasLineJoin
  lineCap: CanvasLineCap
}

export type DrawSportIconOptions = {
  readonly x: number
  readonly y: number
  readonly size: number
  readonly color: string
  /** Stroke weight in target pixels. Defaults to {@link SPORT_ICON_STROKE_WIDTH}. */
  readonly strokeWidth?: number
}

const CURVE_KAPPA = 0.5522847498

function num(value: number): string {
  return String(Math.round(value * 1000) / 1000)
}

/** A closed circle as four cubic segments, so no arc command is needed. */
function circle(cx: number, cy: number, r: number): string {
  const k = CURVE_KAPPA * r
  const left = num(cx - r)
  const right = num(cx + r)
  const top = num(cy - r)
  const bottom = num(cy + r)
  const centerX = num(cx)
  const centerY = num(cy)
  return [
    `M${centerX} ${top}`,
    `C${num(cx + k)} ${top} ${right} ${num(cy - k)} ${right} ${centerY}`,
    `C${right} ${num(cy + k)} ${num(cx + k)} ${bottom} ${centerX} ${bottom}`,
    `C${num(cx - k)} ${bottom} ${left} ${num(cy + k)} ${left} ${centerY}`,
    `C${left} ${num(cy - k)} ${num(cx - k)} ${top} ${centerX} ${top}`,
    'Z',
  ].join(' ')
}

const SHOE_SOLE = 'M2.6 18.3 H16.2 C18.9 18.3 20.4 17.4 21.4 15.3'
const SHOE_BODY =
  'M2.6 18.3 V16.4 C2.6 15.7 3.1 15.1 3.8 14.9 L9.4 13.4 C10.6 13.1 11.3 12.4 11.6 11.9 L13.9 8.1'
const SHOE_TOE = 'M13.9 8.1 C15.4 8.6 16.6 9.6 17.7 10.8 C19 12.2 20.2 13.6 21.4 15.3'

const ICONS: Record<SportKind, readonly string[]> = {
  run: [
    SHOE_SOLE,
    SHOE_BODY,
    SHOE_TOE,
    'M7.1 14.1 V12.5',
    'M7.1 12.5 C7.1 11.9 7.6 11.5 8.2 11.6 L9.6 11.9',
    'M12.4 10.9 L14 12.1',
    'M14.2 13.2 L15.8 14.4',
  ],
  ride: [
    circle(6.2, 16.2, 3.6),
    circle(18.2, 16.2, 3.6),
    'M6.2 16.2 L10.6 10.4 L15 10.4 L18.2 16.2',
    'M10.6 10.4 L12.6 16.2 L15 10.4',
    'M8.7 10.4 H10.9',
    'M14.7 10.4 H16.6',
  ],
  swim: [
    circle(7.4, 7.4, 1.7),
    'M7.4 9.1 C9.2 11.4 11.6 12.2 14 11.4 C15.8 10.8 17 9.4 17.6 7.8',
    'M2.6 16.6 C4.1 15.4 5.6 15.4 7.1 16.6 C8.6 17.8 10.1 17.8 11.6 16.6 C13.1 15.4 14.6 15.4 16.1 16.6 C17.6 17.8 19.1 17.8 20.6 16.6',
    'M2.6 19.7 C4.1 18.5 5.6 18.5 7.1 19.7 C8.6 20.9 10.1 20.9 11.6 19.7 C13.1 18.5 14.6 18.5 16.1 19.7 C17.6 20.9 19.1 20.9 20.6 19.7',
  ],
  walk: [
    circle(12, 4.8, 1.8),
    'M12 6.6 V12',
    'M12 12 L9.6 17.4',
    'M12 12 L14.4 17.4',
    'M12 8.4 L9.4 10.6',
    'M12 8.4 L14.6 10.6',
  ],
  hike: ['M2.6 19.4 L9 8.4 L13 15 L15.8 10.4 L21.4 19.4 Z', 'M7.6 11 L9 8.4 L10.4 11'],
  other: [circle(12, 12, 7), circle(12, 12, 3.2)],
}

const ARITY: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4, Z: 0 }

function tokenize(d: string): string[] {
  const tokens: string[] = []
  const pattern = /[MmLlHhVvCcQqZz]|-?(?:\d+\.?\d*|\.\d+)/g
  let index = 0
  let match: RegExpExecArray | null = pattern.exec(d)
  while (match !== null) {
    if (!/^\s*$/.test(d.slice(index, match.index))) {
      throw new Error(`Unexpected path data near "${d.slice(index, match.index + 1)}"`)
    }
    tokens.push(match[0])
    index = match.index + match[0].length
    match = pattern.exec(d)
  }
  if (!/^\s*$/.test(d.slice(index))) {
    throw new Error(`Unexpected path data near "${d.slice(index)}"`)
  }
  return tokens
}

/**
 * Parses the subset of SVG path data the icons use (`M L H V C Q Z`, absolute and relative)
 * into absolute commands. Anything outside that subset throws, so a malformed icon fails in
 * tests instead of drawing nothing on the card.
 */
export function parsePathData(d: string): readonly PathCommand[] {
  const tokens = tokenize(d)
  const commands: PathCommand[] = []
  let cursorX = 0
  let cursorY = 0
  let startX = 0
  let startY = 0
  let index = 0
  let letter: string | undefined

  const takeNumber = (): number => {
    const token = tokens[index]
    if (token === undefined || ARITY[token.toUpperCase()] !== undefined) {
      throw new Error(`Expected a number in path data "${d}"`)
    }
    index += 1
    const value = Number(token)
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid number "${token}" in path data "${d}"`)
    }
    return value
  }

  while (index < tokens.length) {
    const token = tokens[index]
    if (token === undefined) {
      break
    }
    const isLetter = ARITY[token.toUpperCase()] !== undefined
    if (isLetter) {
      letter = token
      index += 1
    } else if (letter === undefined) {
      throw new Error(`Path data "${d}" must start with a command`)
    }
    const command = letter
    if (command === undefined) {
      throw new Error(`Path data "${d}" must start with a command`)
    }
    const upper = command.toUpperCase()
    const relative = command !== upper
    if (upper === 'Z') {
      commands.push({ kind: 'close' })
      cursorX = startX
      cursorY = startY
      letter = undefined
      continue
    }
    const arity = ARITY[upper]
    if (arity === undefined) {
      throw new Error(`Unsupported command "${command}" in path data "${d}"`)
    }
    const values: number[] = []
    for (let taken = 0; taken < arity; taken += 1) {
      values.push(takeNumber())
    }
    const originX = relative ? cursorX : 0
    const originY = relative ? cursorY : 0
    if (upper === 'M') {
      const x = originX + (values[0] ?? 0)
      const y = originY + (values[1] ?? 0)
      commands.push({ kind: 'move', x, y })
      cursorX = x
      cursorY = y
      startX = x
      startY = y
      letter = relative ? 'l' : 'L'
      continue
    }
    if (upper === 'L') {
      const x = originX + (values[0] ?? 0)
      const y = originY + (values[1] ?? 0)
      commands.push({ kind: 'line', x, y })
      cursorX = x
      cursorY = y
      continue
    }
    if (upper === 'H') {
      const x = originX + (values[0] ?? 0)
      commands.push({ kind: 'line', x, y: cursorY })
      cursorX = x
      continue
    }
    if (upper === 'V') {
      const y = originY + (values[0] ?? 0)
      commands.push({ kind: 'line', x: cursorX, y })
      cursorY = y
      continue
    }
    if (upper === 'C') {
      const x1 = originX + (values[0] ?? 0)
      const y1 = originY + (values[1] ?? 0)
      const x2 = originX + (values[2] ?? 0)
      const y2 = originY + (values[3] ?? 0)
      const x = originX + (values[4] ?? 0)
      const y = originY + (values[5] ?? 0)
      commands.push({ kind: 'cubic', x1, y1, x2, y2, x, y })
      cursorX = x
      cursorY = y
      continue
    }
    const x1 = originX + (values[0] ?? 0)
    const y1 = originY + (values[1] ?? 0)
    const x = originX + (values[2] ?? 0)
    const y = originY + (values[3] ?? 0)
    commands.push({ kind: 'quadratic', x1, y1, x, y })
    cursorX = x
    cursorY = y
  }
  return commands
}

/** The authored subpaths for a sport, each one a string of path data inside the viewBox. */
export function sportIconPaths(sport: SportKind): readonly string[] {
  return ICONS[sport]
}

/**
 * Conservative bounds of an icon: endpoints plus control points of every subpath.
 * Used to centre an icon in its slot without hardcoding per-sport offsets.
 */
export function measureSportIcon(sport: SportKind): Bounds {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  const include = (x: number, y: number): void => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  for (const d of sportIconPaths(sport)) {
    for (const command of parsePathData(d)) {
      if (command.kind === 'move' || command.kind === 'line') {
        include(command.x, command.y)
      } else if (command.kind === 'cubic') {
        include(command.x1, command.y1)
        include(command.x2, command.y2)
        include(command.x, command.y)
      } else if (command.kind === 'quadratic') {
        include(command.x1, command.y1)
        include(command.x, command.y)
      }
    }
  }
  return { minX, minY, maxX, maxY }
}

/**
 * Draws one sport icon into a canvas 2D context, monochrome and stroked.
 * The stroke weight is expressed in target pixels, so an icon keeps its weight at any size.
 */
export function drawSportIcon(
  ctx: SportIconContext,
  sport: SportKind,
  options: DrawSportIconOptions,
): void {
  const strokeWidth = options.strokeWidth ?? SPORT_ICON_STROKE_WIDTH
  const scale = options.size / SPORT_ICON_VIEWBOX
  if (scale <= 0 || !Number.isFinite(scale)) {
    throw new Error(`Invalid icon size ${options.size}`)
  }
  ctx.save()
  ctx.translate(options.x, options.y)
  ctx.scale(scale, scale)
  ctx.strokeStyle = options.color
  ctx.lineWidth = strokeWidth / scale
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (const d of sportIconPaths(sport)) {
    ctx.beginPath()
    for (const command of parsePathData(d)) {
      if (command.kind === 'move') {
        ctx.moveTo(command.x, command.y)
      } else if (command.kind === 'line') {
        ctx.lineTo(command.x, command.y)
      } else if (command.kind === 'cubic') {
        ctx.bezierCurveTo(command.x1, command.y1, command.x2, command.y2, command.x, command.y)
      } else if (command.kind === 'quadratic') {
        ctx.quadraticCurveTo(command.x1, command.y1, command.x, command.y)
      } else {
        ctx.closePath()
      }
    }
    ctx.stroke()
  }
  ctx.restore()
}
