import { describe, expect, it } from 'vitest'
import type { SportKind } from '../../core/model'
import {
  SPORT_ICON_STROKE_WIDTH,
  SPORT_ICON_VIEWBOX,
  drawSportIcon,
  measureSportIcon,
  parsePathData,
  sportIconPaths,
  type SportIconContext,
} from './sport-icons'

const SPORTS: readonly SportKind[] = ['run', 'ride', 'swim', 'walk', 'hike', 'other']

type Called = { readonly name: string; readonly args: readonly number[] }

function recordingContext() {
  const calls: Called[] = []
  const devicePoints: Array<{ x: number; y: number }> = []
  let translateX = 0
  let translateY = 0
  let scaleX = 1
  let scaleY = 1
  const record = (x: number, y: number): void => {
    devicePoints.push({ x: translateX + x * scaleX, y: translateY + y * scaleY })
  }
  const ctx: SportIconContext = {
    lineWidth: 0,
    strokeStyle: '',
    lineJoin: 'miter',
    lineCap: 'butt',
    save(): void {
      calls.push({ name: 'save', args: [] })
    },
    restore(): void {
      calls.push({ name: 'restore', args: [] })
    },
    beginPath(): void {
      calls.push({ name: 'beginPath', args: [] })
    },
    moveTo(x: number, y: number): void {
      calls.push({ name: 'moveTo', args: [x, y] })
      record(x, y)
    },
    lineTo(x: number, y: number): void {
      calls.push({ name: 'lineTo', args: [x, y] })
      record(x, y)
    },
    bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void {
      calls.push({ name: 'bezierCurveTo', args: [x1, y1, x2, y2, x, y] })
      record(x1, y1)
      record(x2, y2)
      record(x, y)
    },
    quadraticCurveTo(x1: number, y1: number, x: number, y: number): void {
      calls.push({ name: 'quadraticCurveTo', args: [x1, y1, x, y] })
      record(x1, y1)
      record(x, y)
    },
    closePath(): void {
      calls.push({ name: 'closePath', args: [] })
    },
    stroke(): void {
      calls.push({ name: 'stroke', args: [] })
    },
    translate(x: number, y: number): void {
      calls.push({ name: 'translate', args: [x, y] })
      translateX += x * scaleX
      translateY += y * scaleY
    },
    scale(x: number, y: number): void {
      calls.push({ name: 'scale', args: [x, y] })
      scaleX *= x
      scaleY *= y
    },
  }
  return { ctx, calls, devicePoints }
}

describe('sportIconPaths', () => {
  it('gives every sport at least one non-empty subpath', () => {
    for (const sport of SPORTS) {
      const paths = sportIconPaths(sport)
      expect(paths.length, sport).toBeGreaterThan(0)
      for (const d of paths) {
        expect(d.trim().length, sport).toBeGreaterThan(0)
      }
    }
  })

  it('keeps every authored coordinate inside the viewBox', () => {
    for (const sport of SPORTS) {
      const bounds = measureSportIcon(sport)
      expect(bounds.minX, sport).toBeGreaterThanOrEqual(0)
      expect(bounds.minY, sport).toBeGreaterThanOrEqual(0)
      expect(bounds.maxX, sport).toBeLessThanOrEqual(SPORT_ICON_VIEWBOX)
      expect(bounds.maxY, sport).toBeLessThanOrEqual(SPORT_ICON_VIEWBOX)
      expect(bounds.maxX, sport).toBeGreaterThan(bounds.minX)
      expect(bounds.maxY, sport).toBeGreaterThan(bounds.minY)
    }
  })
})

describe('parsePathData', () => {
  it('resolves relative commands against the current point', () => {
    expect(parsePathData('M10 10 h5 v-5 l-2 -2')).toEqual([
      { kind: 'move', x: 10, y: 10 },
      { kind: 'line', x: 15, y: 10 },
      { kind: 'line', x: 15, y: 5 },
      { kind: 'line', x: 13, y: 3 },
    ])
  })

  it('treats the pairs after a moveto as lines and closes back to the subpath start', () => {
    expect(parsePathData('M2 3 4 5 Z')).toEqual([
      { kind: 'move', x: 2, y: 3 },
      { kind: 'line', x: 4, y: 5 },
      { kind: 'close' },
    ])
  })

  it('throws on data outside the supported subset', () => {
    expect(() => parsePathData('M0 0 A4 4 0 1 1 8 8')).toThrow(
      /Unexpected path data|Unsupported command/,
    )
    expect(() => parsePathData('0 0 L4 4')).toThrow(/must start with a command/)
    expect(() => parsePathData('M0 0 L4')).toThrow(/Expected a number/)
    expect(() => parsePathData('M0 0 X4 4')).toThrow(/Unexpected path data/)
  })
})

describe('drawSportIcon', () => {
  it('maps the viewBox into the requested box and keeps the stroke weight in target pixels', () => {
    const { ctx, calls, devicePoints } = recordingContext()
    drawSportIcon(ctx, 'ride', { x: 40, y: 90, size: 48, color: '#111111' })

    expect(calls[0]).toEqual({ name: 'save', args: [] })
    expect(calls[1]).toEqual({ name: 'translate', args: [40, 90] })
    expect(calls[2]).toEqual({ name: 'scale', args: [2, 2] })
    expect(ctx.strokeStyle).toBe('#111111')
    expect(ctx.lineWidth).toBeCloseTo(SPORT_ICON_STROKE_WIDTH / 2, 10)
    expect(calls.filter((call) => call.name === 'stroke')).toHaveLength(
      sportIconPaths('ride').length,
    )
    expect(calls.filter((call) => call.name === 'beginPath')).toHaveLength(
      sportIconPaths('ride').length,
    )
    expect(calls.at(-1)).toEqual({ name: 'restore', args: [] })
    for (const point of devicePoints) {
      expect(point.x).toBeGreaterThanOrEqual(40)
      expect(point.y).toBeGreaterThanOrEqual(90)
      expect(point.x).toBeLessThanOrEqual(40 + 48)
      expect(point.y).toBeLessThanOrEqual(90 + 48)
    }
  })

  it('keeps every sport inside the box at the smallest and largest sizes the cards use', () => {
    for (const size of [16, 96]) {
      for (const sport of SPORTS) {
        const { ctx, devicePoints } = recordingContext()
        drawSportIcon(ctx, sport, { x: 7, y: 11, size, color: '#000000' })
        expect(devicePoints.length, sport).toBeGreaterThan(0)
        for (const point of devicePoints) {
          expect(point.x, `${sport}@${size}`).toBeGreaterThanOrEqual(7)
          expect(point.y, `${sport}@${size}`).toBeGreaterThanOrEqual(11)
          expect(point.x, `${sport}@${size}`).toBeLessThanOrEqual(7 + size)
          expect(point.y, `${sport}@${size}`).toBeLessThanOrEqual(11 + size)
        }
      }
    }
  })

  it('honours an explicit stroke weight and rejects a degenerate size', () => {
    const { ctx } = recordingContext()
    drawSportIcon(ctx, 'run', { x: 0, y: 0, size: 24, color: '#000000', strokeWidth: 3 })
    expect(ctx.lineWidth).toBeCloseTo(3, 10)
    expect(() => drawSportIcon(ctx, 'run', { x: 0, y: 0, size: 0, color: '#000000' })).toThrow(
      /Invalid icon size/,
    )
  })
})
