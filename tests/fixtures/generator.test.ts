import { parse } from 'papaparse'
import { describe, expect, it } from 'vitest'
import { generatePersonaCsv, PERSONAS } from '../../fixtures/generator'

import type { PersonaName } from '../../fixtures/generator'

const EXPECTED_HEADER: readonly string[] = [
  'ID de actividad',
  'Fecha de la actividad',
  'Nombre de la actividad',
  'Tipo de actividad',
  'Descripción de la actividad',
  'Tiempo transcurrido',
  'Distancia',
  'Frecuencia cardiaca máxima',
  'Esfuerzo Relativo',
  'Desplazamiento',
  'Nota privada de actividad',
  'Equipamiento de la actividad',
  'Nombre del archivo',
  'Peso del deportista',
  'Peso de la bicicleta',
  'Tiempo transcurrido',
  'Tiempo en movimiento',
  'Distancia',
  'Velocidad máxima',
  'Velocidad promedio',
  'Desnivel positivo',
  'Desnivel negativo',
  'Desnivel bajo',
  'Desnivel alto',
  'Pendiente máxima',
  'Pendiente promedio',
  'Pendiente positiva promedio',
  'Pendiente negativa promedio',
  'Cadencia máx.',
  'Cadencia promedio',
  'Frecuencia cardiaca máxima',
  'Frecuencia cardiaca promedio',
  'Vatios máx.',
  'Vatios promedio',
  'Calorías',
  'Temperatura máx.',
  'Temperatura promedio',
  'Esfuerzo Relativo',
  'Trabajo total',
  'Número de carreras',
  'Tiempo en ascenso',
  'Tiempo en descenso',
  'Otro tiempo',
  'Esfuerzo Percibido',
  'Tipo',
  'Hora de inicio',
  'Potencia promedio ponderada',
  'Recuento de potencia',
  'Usar Esfuerzo Percibido',
  'Esfuerzo Relativo percibido',
  'Desplazamiento',
  'Peso total levantado',
  'Desde la carga',
  'Distancia ajustada en pendientes',
  'Hora de observación meteorológica',
  'Condición meteorológica',
  'Temperatura meteorológica',
  'Temperatura aparente',
  'Punto de rocío',
  'Humedad',
  'Presión meteorológica',
  'Velocidad del viento',
  'Ráfaga de viento',
  'Dirección del viento',
  'Intensidad de precipitación',
  'Hora del amanecer',
  'Hora del atardecer',
  'Fase lunar',
  'Bicicleta',
  'Equipamiento',
  'Probabilidad de precipitación',
  'Tipo de precipitación',
  'Nubosidad',
  'Visibilidad meteorológica',
  'Índice UV',
  'Ozono meteorológico',
  'Recuento de saltos',
  'Grit total',
  'Flow promedio',
  'Denunciado',
  'Velocidad promedio durante el tiempo transcurrido',
  'Distancia en tierra',
  'Distancia recientemente explorada',
  'Distancia en rampas de tierra recientemente explorada',
  'Recuento de actividades',
  'Total de pasos',
  'Ahorro en carbono',
  'Largo de la piscina',
  'Carga de entrenamiento',
  'Intensidad',
  'Ritmo ajustado en pendientes promedio',
  'Tiempo cronometrado',
  'Ciclos en total',
  'Recuperación',
  'Con mascota',
  'Competición',
  'Carrera de larga distancia',
  'Por una causa',
  'Con niño/a',
  'Distancia en descenso',
  'Sets totales',
  'Total de repeticiones',
  'Multimedia',
  'Etiqueta',
]

const COL_KM = 6
const COL_METRES = 17
const COL_ELAPSED_INT = 5
const COL_ELAPSED_DEC = 15
const COL_MOVING = 16
const COL_DATE = 1
const COL_TYPE = 3
const COL_GEAR = 11

const DATE_PATTERN =
  /^(?:[1-9]|[12]\d|3[01]) (?:ene|feb|mar|abr|may|jun|jul|ago|sept|oct|nov|dic) \d{4}, (?:\d|1\d|2[0-3]):[0-5]\d:[0-5]\d$/

const METRES_PATTERN = /^\d+(\.\d+)?$/
const KM_PATTERN = /^\d+(,\d{2})?$/

function rowsOf(persona: PersonaName): string[][] {
  const parsed = parse<string[]>(generatePersonaCsv(persona), {
    header: false,
    skipEmptyLines: true,
  })
  return parsed.data
}

function wellFormedRows(persona: PersonaName): string[][] {
  return rowsOf(persona).filter((row) => row.length === 104)
}

const SEASON_YEARS_EXPECTED = Array.from({ length: 12 }, (_, i) => 2015 + i)

function yearOf(dateValue: string): number {
  const match = /^.* (\d{4}), /.exec(dateValue)
  if (match === null) {
    throw new Error(`unparseable activity date: ${dateValue}`)
  }
  return Number(match[1])
}

describe('fixtures/generator', () => {
  it('emits the header of docs/export-format.md: exactly 104 Spanish fields in order', () => {
    const rows = rowsOf('runner-es')
    expect(rows.length).toBeGreaterThan(1)
    expect(EXPECTED_HEADER).toHaveLength(104)
    expect(rows[0]).toEqual(EXPECTED_HEADER)
  })

  it('parses every row back to exactly 104 fields, except the deliberate broken-rows rows', () => {
    const cleanPersonas = PERSONAS.filter((persona) => persona !== 'broken-rows')
    for (const persona of cleanPersonas) {
      for (const row of rowsOf(persona)) {
        expect([persona, row.length]).toEqual([persona, 104])
      }
    }

    const broken = rowsOf('broken-rows').slice(1)
    const wrongFieldCount = broken.filter((row) => row.length !== 104)
    const garbageNumbers = broken.filter(
      (row) => row.length === 104 && !METRES_PATTERN.test(row[COL_METRES] ?? ''),
    )
    expect(wrongFieldCount).toHaveLength(1)
    expect(garbageNumbers).toHaveLength(1)
    expect(broken.length).toBeGreaterThan(wrongFieldCount.length + garbageNumbers.length)
  })

  it('writes every well-formed date as `d MMM yyyy, H:mm:ss` with Spanish abbreviated months', () => {
    for (const persona of PERSONAS) {
      for (const row of wellFormedRows(persona).slice(1)) {
        const dateValue = row[COL_DATE] ?? ''
        expect([persona, dateValue]).toEqual([persona, expect.stringMatching(DATE_PATTERN)])
      }
    }
  })

  it('renders September with the four-letter abbreviation `sept` somewhere in the long histories', () => {
    const longHistories = ['ten-years-history', 'cyclist', 'no-2026']
    const septDates = longHistories
      .flatMap((persona) => wellFormedRows(persona as PersonaName).slice(1))
      .filter((row) => (row[COL_DATE] ?? '').includes(' sept '))
    expect(septDates.length).toBeGreaterThan(0)
  })

  it('keeps index 17 (metres, dot, one decimal) equal to index 6 (km, comma) times 1000', () => {
    for (const persona of PERSONAS) {
      for (const row of wellFormedRows(persona).slice(1)) {
        const kmCell = row[COL_KM] ?? ''
        const metresCell = row[COL_METRES] ?? ''
        if (kmCell === '' || !KM_PATTERN.test(kmCell) || !METRES_PATTERN.test(metresCell)) {
          continue
        }
        expect(kmCell).toMatch(/,\d{2}$/)
        expect(metresCell).toMatch(/\.\d$/)
        const km = Number(kmCell.replaceAll(',', '.'))
        const metres = Number(metresCell)
        expect([persona, metres]).toEqual([persona, expect.closeTo(km * 1000, 1)])
      }
    }
  })

  it('never writes a moving time greater than the elapsed time, and echoes elapsed with `.0`', () => {
    for (const persona of PERSONAS) {
      let rowNumber = 0
      for (const row of wellFormedRows(persona).slice(1)) {
        rowNumber += 1
        const elapsed = Number(row[COL_ELAPSED_INT])
        const moving = Number((row[COL_MOVING] ?? '').replace(/\.0$/, ''))
        expect(moving, `${persona} row ${rowNumber}`).toBeLessThanOrEqual(elapsed)
        expect(row[COL_ELAPSED_DEC], `${persona} row ${rowNumber}`).toBe(
          `${row[COL_ELAPSED_INT]}.0`,
        )
      }
    }
  })

  it('is deterministic: the same persona generated twice is byte-identical', () => {
    for (const persona of PERSONAS) {
      expect(generatePersonaCsv(persona)).toBe(generatePersonaCsv(persona))
    }
  })

  it('writes zero rows of 2026 for no-2026', () => {
    const years = wellFormedRows('no-2026')
      .slice(1)
      .map((row) => yearOf(row[COL_DATE] ?? ''))
    expect(years.length).toBeGreaterThan(0)
    expect(years).not.toContain(2026)
    expect(new Set(years).size).toBeGreaterThan(1)
  })

  it('spans several years for every persona except no-2026 and few-activities', () => {
    for (const persona of PERSONAS) {
      if (persona === 'no-2026' || persona === 'few-activities') {
        continue
      }
      const years = new Set(
        wellFormedRows(persona)
          .slice(1)
          .map((row) => yearOf(row[COL_DATE] ?? '')),
      )
      expect(years.size).toBeGreaterThan(1)
    }
  })

  it('gives ten-years-history activity in every year of a long history, 2026 present', () => {
    const years = new Set(
      wellFormedRows('ten-years-history')
        .slice(1)
        .map((row) => yearOf(row[COL_DATE] ?? '')),
    )
    expect([...years].sort((a, b) => a - b)).toEqual(SEASON_YEARS_EXPECTED)
    expect(years.has(2026)).toBe(true)
  })

  it('gives few-activities exactly 3 rows in 2026', () => {
    const rows = rowsOf('few-activities').slice(1)
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      expect(yearOf(row[COL_DATE] ?? '')).toBe(2026)
    }
  })

  it('reproduces the exact in/out split of BRIEF 5.4 in year-boundaries', () => {
    const dates = wellFormedRows('year-boundaries')
      .slice(1)
      .map((row) => row[COL_DATE] ?? '')

    expect(dates.filter((date) => /^31 dic 2025, 23:30:/.test(date))).toHaveLength(1)
    expect(dates.filter((date) => /^1 ene 2026, 0:10:/.test(date))).toHaveLength(1)
    expect(dates.filter((date) => /^31 dic 2026, 23:50:/.test(date))).toHaveLength(1)
    expect(dates.filter((date) => /^28 mar 2026, /.test(date))).toHaveLength(1)
    expect(dates.filter((date) => /^29 mar 2026, /.test(date))).toHaveLength(1)
    expect(dates.filter((date) => /^24 oct 2026, /.test(date))).toHaveLength(1)
    expect(dates.filter((date) => /^25 oct 2026, /.test(date))).toHaveLength(1)

    const postSpringChange = dates.some((date) => /^29 mar 2026, 3:/.test(date))
    const postAutumnChange = dates.some((date) => /^25 oct 2026, 2:/.test(date))
    expect(postSpringChange).toBe(true)
    expect(postAutumnChange).toBe(true)

    expect(dates.filter((date) => yearOf(date) === 2026)).toHaveLength(6)
    expect(dates.filter((date) => yearOf(date) === 2025)).toHaveLength(3)
  })

  it('gives multisport at least three sports above 10 % of total moving time', () => {
    const movingByLabel = new Map<string, number>()
    for (const row of wellFormedRows('multisport').slice(1)) {
      const label = row[COL_TYPE] ?? ''
      const seconds = Number((row[COL_MOVING] ?? '0').replace(/\.0$/, ''))
      movingByLabel.set(label, (movingByLabel.get(label) ?? 0) + seconds)
    }
    const totalMoving = [...movingByLabel.values()].reduce((sum, seconds) => sum + seconds, 0)
    expect(totalMoving).toBeGreaterThan(0)
    const shareOf = (label: string) => (movingByLabel.get(label) ?? 0) / totalMoving
    expect(shareOf('Carrera')).toBeGreaterThan(0.1)
    expect(shareOf('Bicicleta')).toBeGreaterThan(0.1)
    expect(shareOf('Natación')).toBeGreaterThan(0.1)
  })

  it('never fills the gear column for no-gear, and fills it for runner-es and cyclist', () => {
    for (const row of wellFormedRows('no-gear').slice(1)) {
      expect(row[COL_GEAR]).toBe('')
    }
    for (const persona of ['runner-es', 'cyclist'] as const) {
      const gearCells = wellFormedRows(persona)
        .slice(1)
        .map((row) => row[COL_GEAR] ?? '')
      expect(gearCells.some((cell) => cell !== '')).toBe(true)
    }
  })
})
