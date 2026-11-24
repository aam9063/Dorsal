import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/**
 * Column order of the Spanish `activities.csv` layout, verified against a
 * reference export and documented in `docs/export-format.md`. Columns are
 * always read by index because five header names appear twice.
 */
export const HEADER: readonly string[] = [
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

const COL = {
  activityId: 0,
  activityDate: 1,
  activityName: 2,
  activityType: 3,
  elapsedInt: 5,
  distanceKm: 6,
  heartRateMax: 7,
  relativeEffort: 8,
  gear: 11,
  elapsedDec: 15,
  movingTime: 16,
  distanceMetres: 17,
  elevationGain: 20,
  heartRateAvg: 31,
  maxPower: 32,
  avgPower: 33,
  weightedAvgPower: 46,
} as const

const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sept',
  'oct',
  'nov',
  'dic',
] as const

const ID_BASE = 823_456_000

export type PersonaName =
  | 'runner-es'
  | 'cyclist'
  | 'cyclist-power'
  | 'multisport'
  | 'no-gear'
  | 'few-activities'
  | 'ten-years-history'
  | 'no-2026'
  | 'year-boundaries'
  | 'broken-rows'
  | 'shoe-retired'
  | 'early-bird'
  | 'night-owl'
  | 'weekend-warrior'
  | 'methodical'
  | 'long-distance'
  | 'no-pulse'

export const PERSONAS: readonly PersonaName[] = [
  'runner-es',
  'cyclist',
  'cyclist-power',
  'multisport',
  'no-gear',
  'few-activities',
  'ten-years-history',
  'no-2026',
  'year-boundaries',
  'broken-rows',
  'shoe-retired',
  'early-bird',
  'night-owl',
  'weekend-warrior',
  'methodical',
  'long-distance',
  'no-pulse',
]

interface SportProfile {
  label: string
  namePool: readonly string[]
  movingSecRange: readonly [number, number]
  kmPerHourRange: readonly [number, number]
  hasDistance: boolean
  elevationChance: number
  elevationRange: readonly [number, number]
  heartRateChance: number
  heartRateMaxRange: readonly [number, number]
  effortChance: number
  effortFactorRange: readonly [number, number]
}

interface YearPlan {
  year: number
  sports: readonly { label: string; count: number }[]
}

interface PersonaConfig {
  seed: number
  years: readonly YearPlan[]
  gearPool: readonly string[]
  gearChanceByLabel: Readonly<Record<string, number>>
  forced: readonly ActivitySpec[]
  /**
   * Watts written for every activity of the persona; `undefined` leaves the
   * three power columns empty, which is every other persona, so the
   * power-present and the power-absent paths both have fixtures.
   */
  power?: PowerRange
}

/** Deterministic watt draws for a persona with a power meter. */
interface PowerRange {
  avgWRange: readonly [number, number]
  /** Added to the average to draw the per-activity maximum. */
  maxAboveAvg: readonly [number, number]
  /** Multiplies the average to draw the weighted average power. */
  weightedFactorRange: readonly [number, number]
}

interface ActivitySpec {
  id: number
  year: number
  month0: number
  day: number
  hour: number
  minute: number
  second: number
  label: string
  name: string
  elapsedSec: number
  movingSec: number
  /** Kilometres as an integer count of hundredths, so both distance cells stay exact. */
  distanceHundredths: number | null
  maxHeartRate: number | null
  avgHeartRate: number | null
  relativeEffort: number | null
  elevationGainM: number | null
  avgPowerW: number | null
  maxPowerW: number | null
  weightedAvgPowerW: number | null
  gear: string | null
}

const SPORT_PROFILES: Readonly<Record<string, SportProfile>> = {
  Carrera: {
    label: 'Carrera',
    namePool: [
      'Rodaje suave',
      'Series en pista',
      'Carrera, tirada larga',
      'Tempo por el río',
      'Carrera nocturna',
    ],
    movingSecRange: [1800, 5400],
    kmPerHourRange: [8, 15],
    hasDistance: true,
    elevationChance: 0.4,
    elevationRange: [10, 420],
    heartRateChance: 0.9,
    heartRateMaxRange: [165, 198],
    effortChance: 0.9,
    effortFactorRange: [0.6, 1.2],
  },
  Bicicleta: {
    label: 'Bicicleta',
    namePool: ['Salida en bici', 'Puerto de montaña', 'Ruta con el grupo', 'Rodillo en el salón'],
    movingSecRange: [2400, 10800],
    kmPerHourRange: [20, 38],
    hasDistance: true,
    elevationChance: 0.85,
    elevationRange: [60, 1600],
    heartRateChance: 0.85,
    heartRateMaxRange: [140, 186],
    effortChance: 0.9,
    effortFactorRange: [0.7, 1.6],
  },
  'Bicicleta virtual': {
    label: 'Bicicleta virtual',
    namePool: ['Ruta virtual de invierno', 'Series virtuales'],
    movingSecRange: [1800, 7200],
    kmPerHourRange: [24, 40],
    hasDistance: true,
    elevationChance: 0.5,
    elevationRange: [20, 300],
    heartRateChance: 0.85,
    heartRateMaxRange: [140, 186],
    effortChance: 0.9,
    effortFactorRange: [0.7, 1.6],
  },
  Caminata: {
    label: 'Caminata',
    namePool: ['Paseo de la tarde', 'Caminata al trabajo'],
    movingSecRange: [1200, 5400],
    kmPerHourRange: [4, 6],
    hasDistance: true,
    elevationChance: 0.2,
    elevationRange: [10, 250],
    heartRateChance: 0.4,
    heartRateMaxRange: [105, 140],
    effortChance: 0.6,
    effortFactorRange: [0.4, 0.9],
  },
  Senderismo: {
    label: 'Senderismo',
    namePool: ['Ruta al refugio', 'Travesía de la sierra'],
    movingSecRange: [3600, 14400],
    kmPerHourRange: [3.5, 5.5],
    hasDistance: true,
    elevationChance: 0.9,
    elevationRange: [200, 1200],
    heartRateChance: 0.7,
    heartRateMaxRange: [120, 165],
    effortChance: 0.8,
    effortFactorRange: [0.6, 1.3],
  },
  Natación: {
    label: 'Natación',
    namePool: ['Nado en la piscina', 'Series de natación'],
    movingSecRange: [1800, 4200],
    kmPerHourRange: [2.2, 3.6],
    hasDistance: true,
    elevationChance: 0,
    elevationRange: [0, 0],
    heartRateChance: 0.5,
    heartRateMaxRange: [145, 180],
    effortChance: 0.7,
    effortFactorRange: [0.7, 1.1],
  },
  Elíptica: {
    label: 'Elíptica',
    namePool: ['Elíptica suave', 'Elíptica de calentamiento'],
    movingSecRange: [1200, 3600],
    kmPerHourRange: [8, 12],
    hasDistance: true,
    elevationChance: 0,
    elevationRange: [0, 0],
    heartRateChance: 0.6,
    heartRateMaxRange: [120, 160],
    effortChance: 0.7,
    effortFactorRange: [0.5, 1],
  },
  'Entrenamiento con pesas': {
    label: 'Entrenamiento con pesas',
    namePool: ['Fuerza: tren superior', 'Fuerza: piernas'],
    movingSecRange: [900, 3600],
    kmPerHourRange: [0, 0],
    hasDistance: false,
    elevationChance: 0,
    elevationRange: [0, 0],
    heartRateChance: 0.2,
    heartRateMaxRange: [110, 160],
    effortChance: 0.5,
    effortFactorRange: [0.5, 1],
  },
  Entrenamiento: {
    label: 'Entrenamiento',
    namePool: ['Yoga de movilidad', 'Estiramientos'],
    movingSecRange: [900, 2700],
    kmPerHourRange: [0, 0],
    hasDistance: false,
    elevationChance: 0,
    elevationRange: [0, 0],
    heartRateChance: 0.2,
    heartRateMaxRange: [110, 160],
    effortChance: 0.4,
    effortFactorRange: [0.4, 0.9],
  },
}

function sportProfile(label: string): SportProfile {
  const profile = SPORT_PROFILES[label]
  if (profile === undefined) {
    throw new Error(`no sport profile for label ${label}`)
  }
  return profile
}

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function intBetween(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function floatBetween(rng: () => number, range: readonly [number, number]): number {
  return range[0] + rng() * (range[1] - range[0])
}

function poolItem(pool: readonly string[], index: number): string {
  const item = pool[index % pool.length]
  if (item === undefined) {
    throw new Error('name or gear pool must not be empty')
  }
  return item
}

function pickGear(rng: () => number, label: string, config: PersonaConfig): string | null {
  if (config.gearPool.length === 0) {
    return null
  }
  if (rng() >= (config.gearChanceByLabel[label] ?? 0)) {
    return null
  }
  return poolItem(config.gearPool, intBetween(rng, 0, config.gearPool.length - 1))
}

function forcedActivity(values: {
  year: number
  month0: number
  day: number
  hour: number
  minute: number
  second: number
  label: string
  name: string
  elapsedSec: number
  movingSec: number
  distanceHundredths: number | null
  maxHeartRate: number | null
  avgHeartRate: number | null
  relativeEffort: number | null
  elevationGainM: number | null
  avgPowerW?: number | null
  maxPowerW?: number | null
  weightedAvgPowerW?: number | null
  gear: string | null
}): ActivitySpec {
  return {
    id: 0,
    avgPowerW: null,
    maxPowerW: null,
    weightedAvgPowerW: null,
    ...values,
  }
}

const RUNNER_ES: PersonaConfig = {
  seed: 20260515,
  years: [
    {
      year: 2022,
      sports: [
        { label: 'Carrera', count: 34 },
        { label: 'Caminata', count: 8 },
        { label: 'Entrenamiento con pesas', count: 8 },
      ],
    },
    {
      year: 2023,
      sports: [
        { label: 'Carrera', count: 40 },
        { label: 'Caminata', count: 10 },
        { label: 'Elíptica', count: 4 },
        { label: 'Entrenamiento con pesas', count: 10 },
      ],
    },
    {
      year: 2024,
      sports: [
        { label: 'Carrera', count: 46 },
        { label: 'Caminata', count: 10 },
        { label: 'Entrenamiento con pesas', count: 10 },
      ],
    },
    {
      year: 2025,
      sports: [
        { label: 'Carrera', count: 52 },
        { label: 'Caminata', count: 12 },
        { label: 'Entrenamiento con pesas', count: 12 },
      ],
    },
    {
      year: 2026,
      sports: [
        { label: 'Carrera', count: 62 },
        { label: 'Caminata', count: 14 },
        { label: 'Bicicleta', count: 10 },
        { label: 'Entrenamiento con pesas', count: 14 },
      ],
    },
  ],
  gearPool: ['Zapatillas asfalto', 'Zapatillas de montaña', 'Cinta de correr del gimnasio'],
  gearChanceByLabel: { Carrera: 0.85, Bicicleta: 0.8 },
  forced: [],
}

const CYCLIST: PersonaConfig = {
  seed: 20260516,
  years: [
    {
      year: 2020,
      sports: [
        { label: 'Bicicleta', count: 40 },
        { label: 'Bicicleta virtual', count: 20 },
      ],
    },
    {
      year: 2021,
      sports: [
        { label: 'Bicicleta', count: 46 },
        { label: 'Bicicleta virtual', count: 22 },
      ],
    },
    {
      year: 2022,
      sports: [
        { label: 'Bicicleta', count: 50 },
        { label: 'Bicicleta virtual', count: 20 },
      ],
    },
    {
      year: 2023,
      sports: [
        { label: 'Bicicleta', count: 56 },
        { label: 'Bicicleta virtual', count: 22 },
      ],
    },
    {
      year: 2024,
      sports: [
        { label: 'Bicicleta', count: 60 },
        { label: 'Bicicleta virtual', count: 24 },
      ],
    },
    {
      year: 2025,
      sports: [
        { label: 'Bicicleta', count: 64 },
        { label: 'Bicicleta virtual', count: 24 },
      ],
    },
    {
      year: 2026,
      sports: [
        { label: 'Bicicleta', count: 74 },
        { label: 'Bicicleta virtual', count: 26 },
      ],
    },
  ],
  gearPool: ['BTT azul', 'Carretera negra', 'Grava naranja'],
  gearChanceByLabel: { Bicicleta: 0.9, 'Bicicleta virtual': 0.7 },
  forced: [],
}

const CYCLIST_POWER: PersonaConfig = {
  seed: 20260531,
  years: [
    {
      year: 2025,
      sports: [
        { label: 'Bicicleta', count: 30 },
        { label: 'Bicicleta virtual', count: 10 },
      ],
    },
    {
      year: 2026,
      sports: [
        { label: 'Bicicleta', count: 58 },
        { label: 'Bicicleta virtual', count: 26 },
      ],
    },
  ],
  gearPool: ['BTT azul', 'Carretera negra'],
  gearChanceByLabel: { Bicicleta: 0.9, 'Bicicleta virtual': 0.7 },
  power: {
    avgWRange: [170, 260],
    maxAboveAvg: [250, 900],
    weightedFactorRange: [0.92, 1.0],
  },
  forced: [
    forcedActivity({
      year: 2026,
      month0: 10,
      day: 12,
      hour: 10,
      minute: 5,
      second: 0,
      label: 'Bicicleta',
      name: 'Rodada con el medidor sin pilas',
      elapsedSec: 5400,
      movingSec: 5100,
      distanceHundredths: 4200,
      maxHeartRate: 178,
      avgHeartRate: 154,
      relativeEffort: 88,
      elevationGainM: 610,
      gear: 'Carretera negra',
    }),
    forcedActivity({
      year: 2026,
      month0: 10,
      day: 19,
      hour: 10,
      minute: 5,
      second: 0,
      label: 'Bicicleta',
      name: 'Rodillo sin medidor',
      elapsedSec: 4500,
      movingSec: 4200,
      distanceHundredths: 3100,
      maxHeartRate: 170,
      avgHeartRate: 148,
      relativeEffort: 71,
      elevationGainM: 0,
      gear: null,
    }),
  ],
}

const MULTISPORT: PersonaConfig = {
  seed: 20260517,
  years: [
    {
      year: 2024,
      sports: [
        { label: 'Carrera', count: 30 },
        { label: 'Bicicleta', count: 18 },
        { label: 'Natación', count: 14 },
        { label: 'Entrenamiento', count: 8 },
      ],
    },
    {
      year: 2025,
      sports: [
        { label: 'Carrera', count: 34 },
        { label: 'Bicicleta', count: 20 },
        { label: 'Natación', count: 16 },
        { label: 'Senderismo', count: 6 },
      ],
    },
    {
      year: 2026,
      sports: [
        { label: 'Carrera', count: 40 },
        { label: 'Bicicleta', count: 24 },
        { label: 'Natación', count: 18 },
        { label: 'Entrenamiento con pesas', count: 8 },
      ],
    },
  ],
  gearPool: ['Zapatillas grises', 'Bici de carretera'],
  gearChanceByLabel: { Carrera: 0.7, Bicicleta: 0.8 },
  forced: [],
}

const NO_GEAR: PersonaConfig = {
  seed: 20260518,
  years: Array.from({ length: 6 }, (_, i) => ({
    year: 2021 + i,
    sports: [
      { label: 'Carrera', count: 20 },
      { label: 'Caminata', count: 10 },
    ],
  })),
  gearPool: [],
  gearChanceByLabel: {},
  forced: [],
}

const FEW_ACTIVITIES: PersonaConfig = {
  seed: 20260519,
  years: [
    {
      year: 2026,
      sports: [
        { label: 'Carrera', count: 1 },
        { label: 'Bicicleta', count: 1 },
        { label: 'Senderismo', count: 1 },
      ],
    },
  ],
  gearPool: ['Zapatillas grises', 'Bici de carretera'],
  gearChanceByLabel: { Carrera: 0.5, Bicicleta: 0.5, Senderismo: 0.5 },
  forced: [],
}

const TEN_YEARS_HISTORY: PersonaConfig = {
  seed: 20260520,
  years: Array.from({ length: 12 }, (_, i) => {
    const count = 6 + i * 2
    const rides = Math.floor(count / 3)
    const walks = Math.floor(count / 6)
    return {
      year: 2015 + i,
      sports: [
        { label: 'Carrera', count: count - rides - walks },
        { label: 'Bicicleta', count: rides },
        { label: 'Caminata', count: walks },
      ],
    }
  }),
  gearPool: ['Zapatillas viejas', 'Bici urbana'],
  gearChanceByLabel: { Carrera: 0.25, Bicicleta: 0.35 },
  forced: [],
}

const NO_2026: PersonaConfig = {
  seed: 20260521,
  years: Array.from({ length: 8 }, (_, i) => ({
    year: 2018 + i,
    sports: [
      { label: 'Carrera', count: 12 },
      { label: 'Caminata', count: 6 },
      { label: 'Elíptica', count: 6 },
    ],
  })),
  gearPool: ['Zapatillas del gimnasio'],
  gearChanceByLabel: { Carrera: 0.3 },
  forced: [],
}

const YEAR_BOUNDARIES: PersonaConfig = {
  seed: 20260522,
  years: [
    { year: 2023, sports: [{ label: 'Carrera', count: 2 }] },
    { year: 2024, sports: [{ label: 'Carrera', count: 2 }] },
    { year: 2025, sports: [{ label: 'Carrera', count: 2 }] },
  ],
  gearPool: ['Zapatillas asfalto', 'Zapatillas de montaña', 'BTT azul'],
  gearChanceByLabel: { Carrera: 0.5, Bicicleta: 0.8 },
  forced: [
    forcedActivity({
      year: 2025,
      month0: 11,
      day: 31,
      hour: 23,
      minute: 30,
      second: 12,
      label: 'Carrera',
      name: 'Último rodaje del año',
      elapsedSec: 3600,
      movingSec: 3300,
      distanceHundredths: 575,
      maxHeartRate: 168,
      avgHeartRate: 149,
      relativeEffort: 48,
      elevationGainM: 64,
      gear: null,
    }),
    forcedActivity({
      year: 2026,
      month0: 0,
      day: 1,
      hour: 0,
      minute: 10,
      second: 47,
      label: 'Carrera',
      name: 'Primera del año',
      elapsedSec: 3600,
      movingSec: 3480,
      distanceHundredths: 610,
      maxHeartRate: 172,
      avgHeartRate: 151,
      relativeEffort: 52,
      elevationGainM: 58,
      gear: 'Zapatillas asfalto',
    }),
    forcedActivity({
      year: 2026,
      month0: 2,
      day: 28,
      hour: 10,
      minute: 15,
      second: 0,
      label: 'Bicicleta',
      name: 'Antes del cambio de hora',
      elapsedSec: 7200,
      movingSec: 6900,
      distanceHundredths: 4020,
      maxHeartRate: 176,
      avgHeartRate: 154,
      relativeEffort: 74,
      elevationGainM: 520,
      gear: 'BTT azul',
    }),
    forcedActivity({
      year: 2026,
      month0: 2,
      day: 29,
      hour: 3,
      minute: 30,
      second: 0,
      label: 'Bicicleta',
      name: 'Tras el cambio de hora de marzo',
      elapsedSec: 5400,
      movingSec: 5100,
      distanceHundredths: 2892,
      maxHeartRate: 181,
      avgHeartRate: 158,
      relativeEffort: 71,
      elevationGainM: 430,
      gear: 'BTT azul',
    }),
    forcedActivity({
      year: 2026,
      month0: 9,
      day: 24,
      hour: 9,
      minute: 0,
      second: 0,
      label: 'Carrera',
      name: 'Rodaje de mañana',
      elapsedSec: 4200,
      movingSec: 4080,
      distanceHundredths: 823,
      maxHeartRate: 191,
      avgHeartRate: 168,
      relativeEffort: 65,
      elevationGainM: 210,
      gear: 'Zapatillas de montaña',
    }),
    forcedActivity({
      year: 2026,
      month0: 9,
      day: 25,
      hour: 2,
      minute: 30,
      second: 0,
      label: 'Carrera',
      name: 'Tras el cambio de hora de octubre',
      elapsedSec: 4800,
      movingSec: 4620,
      distanceHundredths: 902,
      maxHeartRate: 193,
      avgHeartRate: 171,
      relativeEffort: 72,
      elevationGainM: 235,
      gear: null,
    }),
    forcedActivity({
      year: 2026,
      month0: 11,
      day: 31,
      hour: 23,
      minute: 50,
      second: 5,
      label: 'Carrera',
      name: 'Última del año',
      elapsedSec: 1800,
      movingSec: 1740,
      distanceHundredths: 356,
      maxHeartRate: 174,
      avgHeartRate: 152,
      relativeEffort: 27,
      elevationGainM: 30,
      gear: 'Zapatillas asfalto',
    }),
  ],
}

const BROKEN_ROWS: PersonaConfig = {
  seed: 20260523,
  years: [
    {
      year: 2023,
      sports: [
        { label: 'Carrera', count: 4 },
        { label: 'Caminata', count: 4 },
      ],
    },
    {
      year: 2024,
      sports: [
        { label: 'Carrera', count: 5 },
        { label: 'Caminata', count: 5 },
      ],
    },
    {
      year: 2025,
      sports: [
        { label: 'Carrera', count: 5 },
        { label: 'Caminata', count: 5 },
      ],
    },
    {
      year: 2026,
      sports: [
        { label: 'Carrera', count: 8 },
        { label: 'Bicicleta', count: 4 },
      ],
    },
  ],
  gearPool: ['Zapatillas desgastadas'],
  gearChanceByLabel: { Carrera: 0.2 },
  forced: [],
}

const SHOE_RETIREMENT_GEAR = 'Zapatillas Neón'
const SHOE_RETIREMENT_TRAIL_GEAR = 'Zapatillas de montaña'

function forcedRuns(values: {
  gear: string
  count: number
  kmHundredths: number
  movingSec: number
  elapsedSec: number
  hour: number
  minute: number
  month0: (index: number) => number
  day: (index: number) => number
}): ActivitySpec[] {
  return Array.from({ length: values.count }, (_, index) =>
    forcedActivity({
      year: 2026,
      month0: values.month0(index),
      day: values.day(index),
      hour: values.hour,
      minute: values.minute,
      second: 30,
      label: values.gear.includes('Bici') ? 'Bicicleta' : 'Carrera',
      name: 'Serie de material',
      elapsedSec: values.elapsedSec,
      movingSec: values.movingSec,
      distanceHundredths: values.kmHundredths,
      maxHeartRate: null,
      avgHeartRate: null,
      relativeEffort: null,
      elevationGainM: null,
      gear: values.gear,
    }),
  )
}

/**
 * Every 2026 run wears the same shoes and they cover well over 800 km in the
 * season, so the retirement warning of story 06 has a fixture that proves it
 * end to end; a trail pair and a gravel bike stay below the 800 km line so a
 * badge is never expected on them. Earlier years keep activities so the 2026
 * filter is still exercised.
 */
const SHOE_RETIREMENT: PersonaConfig = {
  seed: 20260524,
  years: [
    { year: 2024, sports: [{ label: 'Carrera', count: 14 }] },
    {
      year: 2025,
      sports: [
        { label: 'Carrera', count: 16 },
        { label: 'Caminata', count: 6 },
      ],
    },
    { year: 2026, sports: [{ label: 'Caminata', count: 5 }] },
  ],
  gearPool: [SHOE_RETIREMENT_GEAR],
  gearChanceByLabel: { Carrera: 0.6 },
  forced: [
    ...forcedRuns({
      gear: SHOE_RETIREMENT_GEAR,
      count: 24,
      kmHundredths: 1000,
      movingSec: 3600,
      elapsedSec: 3720,
      hour: 8,
      minute: 15,
      month0: (index) => index % 12,
      day: (index) => 3 + (index >= 12 ? 9 : 0),
    }),
    ...forcedRuns({
      gear: SHOE_RETIREMENT_GEAR,
      count: 16,
      kmHundredths: 3600,
      movingSec: 12960,
      elapsedSec: 13320,
      hour: 7,
      minute: 5,
      month0: (index) => index % 12,
      day: (index) => 9 + (index >= 12 ? 11 : 0),
    }),
    ...forcedRuns({
      gear: SHOE_RETIREMENT_TRAIL_GEAR,
      count: 8,
      kmHundredths: 1000,
      movingSec: 3600,
      elapsedSec: 3660,
      hour: 9,
      minute: 40,
      month0: (index) => index % 8,
      day: () => 21,
    }),
    ...forcedRuns({
      gear: 'Bici de gravel',
      count: 6,
      kmHundredths: 3600,
      movingSec: 7200,
      elapsedSec: 7500,
      hour: 11,
      minute: 20,
      month0: (index) => (index * 2) % 12,
      day: (index) => 16 + (index % 3),
    }),
  ],
}

/**
 * Calendar slots (0-based month, day of month) of every 2026 weekday used to
 * drive the archetype rules: they were derived once from the 2026 calendar
 * (2026-01-01 was a Thursday) and are literals, so every persona stays
 * deterministic and reproducible without reading the clock.
 */
const WEDNESDAYS_2026 = [
  { month0: 0, day: 7 },
  { month0: 0, day: 14 },
  { month0: 0, day: 21 },
  { month0: 0, day: 28 },
  { month0: 1, day: 4 },
  { month0: 1, day: 11 },
  { month0: 1, day: 18 },
  { month0: 1, day: 25 },
  { month0: 2, day: 4 },
  { month0: 2, day: 11 },
  { month0: 2, day: 18 },
  { month0: 2, day: 25 },
  { month0: 3, day: 1 },
  { month0: 3, day: 8 },
  { month0: 3, day: 15 },
  { month0: 3, day: 22 },
  { month0: 3, day: 29 },
  { month0: 4, day: 6 },
  { month0: 4, day: 13 },
  { month0: 4, day: 20 },
  { month0: 4, day: 27 },
  { month0: 5, day: 3 },
  { month0: 5, day: 10 },
  { month0: 5, day: 17 },
  { month0: 5, day: 24 },
  { month0: 6, day: 1 },
  { month0: 6, day: 8 },
  { month0: 6, day: 15 },
  { month0: 6, day: 22 },
  { month0: 6, day: 29 },
] as const

const FRIDAYS_2026 = [
  { month0: 0, day: 2 },
  { month0: 0, day: 9 },
  { month0: 0, day: 16 },
  { month0: 0, day: 23 },
  { month0: 0, day: 30 },
  { month0: 1, day: 6 },
  { month0: 1, day: 13 },
  { month0: 1, day: 20 },
  { month0: 1, day: 27 },
  { month0: 2, day: 6 },
  { month0: 2, day: 13 },
  { month0: 2, day: 20 },
  { month0: 2, day: 27 },
  { month0: 3, day: 3 },
  { month0: 3, day: 10 },
  { month0: 3, day: 17 },
  { month0: 3, day: 24 },
  { month0: 4, day: 1 },
  { month0: 4, day: 8 },
  { month0: 4, day: 15 },
  { month0: 4, day: 22 },
  { month0: 4, day: 29 },
  { month0: 5, day: 5 },
  { month0: 5, day: 12 },
  { month0: 5, day: 19 },
  { month0: 5, day: 26 },
  { month0: 6, day: 3 },
  { month0: 6, day: 10 },
  { month0: 6, day: 17 },
  { month0: 6, day: 24 },
] as const

const SATURDAYS_2026 = [
  { month0: 0, day: 3 },
  { month0: 0, day: 10 },
  { month0: 0, day: 17 },
  { month0: 0, day: 24 },
  { month0: 0, day: 31 },
  { month0: 1, day: 7 },
  { month0: 1, day: 14 },
  { month0: 1, day: 21 },
  { month0: 1, day: 28 },
  { month0: 2, day: 7 },
  { month0: 2, day: 14 },
  { month0: 2, day: 21 },
  { month0: 2, day: 28 },
  { month0: 3, day: 4 },
  { month0: 3, day: 11 },
  { month0: 3, day: 18 },
  { month0: 3, day: 25 },
  { month0: 4, day: 2 },
  { month0: 4, day: 9 },
  { month0: 4, day: 16 },
  { month0: 4, day: 23 },
  { month0: 4, day: 30 },
  { month0: 5, day: 6 },
  { month0: 5, day: 13 },
  { month0: 5, day: 20 },
  { month0: 5, day: 27 },
] as const

const SUNDAYS_2026 = [
  { month0: 0, day: 4 },
  { month0: 0, day: 11 },
  { month0: 0, day: 18 },
  { month0: 0, day: 25 },
  { month0: 1, day: 1 },
  { month0: 1, day: 8 },
  { month0: 1, day: 15 },
  { month0: 1, day: 22 },
  { month0: 2, day: 1 },
  { month0: 2, day: 8 },
  { month0: 2, day: 15 },
  { month0: 2, day: 22 },
  { month0: 2, day: 29 },
  { month0: 3, day: 5 },
  { month0: 3, day: 12 },
  { month0: 3, day: 19 },
  { month0: 3, day: 26 },
  { month0: 4, day: 3 },
  { month0: 4, day: 10 },
  { month0: 4, day: 17 },
  { month0: 4, day: 24 },
  { month0: 4, day: 31 },
  { month0: 5, day: 7 },
  { month0: 5, day: 14 },
  { month0: 5, day: 21 },
  { month0: 5, day: 28 },
] as const

/** The first Monday of 2026 is 5 January; one activity per selected Monday week. */
const MONDAYS_2026 = [
  { month0: 0, day: 5 },
  { month0: 0, day: 12 },
  { month0: 0, day: 19 },
  { month0: 0, day: 26 },
  { month0: 1, day: 2 },
  { month0: 1, day: 9 },
  { month0: 1, day: 16 },
  { month0: 1, day: 23 },
  { month0: 2, day: 2 },
  { month0: 2, day: 9 },
  { month0: 2, day: 16 },
  { month0: 2, day: 23 },
  { month0: 2, day: 30 },
  { month0: 3, day: 6 },
  { month0: 3, day: 13 },
  { month0: 3, day: 20 },
  { month0: 3, day: 27 },
  { month0: 4, day: 4 },
  { month0: 4, day: 11 },
  { month0: 4, day: 18 },
  { month0: 4, day: 25 },
  { month0: 5, day: 1 },
  { month0: 5, day: 8 },
  { month0: 5, day: 15 },
  { month0: 5, day: 22 },
  { month0: 5, day: 29 },
  { month0: 6, day: 6 },
  { month0: 6, day: 13 },
  { month0: 6, day: 20 },
  { month0: 6, day: 27 },
  { month0: 7, day: 3 },
  { month0: 7, day: 10 },
  { month0: 7, day: 17 },
  { month0: 7, day: 24 },
  { month0: 7, day: 31 },
  { month0: 8, day: 7 },
  { month0: 8, day: 14 },
  { month0: 8, day: 21 },
  { month0: 8, day: 28 },
  { month0: 9, day: 5 },
  { month0: 9, day: 12 },
  { month0: 9, day: 19 },
  { month0: 9, day: 26 },
  { month0: 10, day: 2 },
  { month0: 10, day: 9 },
  { month0: 10, day: 16 },
  { month0: 10, day: 23 },
  { month0: 10, day: 30 },
  { month0: 11, day: 7 },
  { month0: 11, day: 14 },
] as const

/** Month lengths of 2026 (a common year), to place the Mon–Thu weeks of the methodical persona. */
const DAYS_IN_MONTH_2026 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

function dayAfterMonday(
  month0: number,
  day: number,
  offset: number,
): { month0: number; day: number } {
  let value = day + offset
  let month = month0
  let monthLength = DAYS_IN_MONTH_2026[month] ?? 31
  while (value > monthLength) {
    value -= monthLength
    month += 1
    monthLength = DAYS_IN_MONTH_2026[month] ?? 31
  }
  return { month0: month, day: value }
}

/** Four runs per selected Monday week, so every week has exactly four active days. */
function methodicalWeekSlots(weeks: number): { month0: number; day: number }[] {
  return MONDAYS_2026.slice(0, weeks).flatMap(({ month0, day }) =>
    [0, 1, 2, 3].map((offset) => dayAfterMonday(month0, day, offset)),
  )
}

function archetypeRuns(values: {
  slots: readonly { month0: number; day: number }[]
  hour: number
  minute: number
  movingSec: number
  kmHundredths: number
  avgHeartRate: number | null
  maxHeartRate: number | null
}): ActivitySpec[] {
  return values.slots.map(({ month0, day }, index) =>
    forcedActivity({
      year: 2026,
      month0,
      day,
      hour: values.hour,
      minute: values.minute,
      second: 0,
      label: 'Carrera',
      name: poolItem(sportProfile('Carrera').namePool, index),
      elapsedSec: values.movingSec + 120,
      movingSec: values.movingSec,
      distanceHundredths: values.kmHundredths,
      maxHeartRate: values.maxHeartRate,
      avgHeartRate: values.avgHeartRate,
      relativeEffort: null,
      elevationGainM: null,
      gear: null,
    }),
  )
}

const PAST_YEARS_FOR_ARCHETYPES: readonly YearPlan[] = [
  { year: 2024, sports: [{ label: 'Carrera', count: 6 }] },
  { year: 2025, sports: [{ label: 'Carrera', count: 8 }] },
]

const ARCHETYPE_RUNNER: { movingSec: number; kmHundredths: number } = {
  movingSec: 3600,
  kmHundredths: 1050,
}

function noHeartRate(): { avgHeartRate: null; maxHeartRate: null } {
  return { avgHeartRate: null, maxHeartRate: null }
}

/**
 * One persona per archetype rule of BRIEF §6.1: its 2026 slots are chosen so a
 * specific rule wins in evaluation order. They are all forced activities on
 * fixed weekdays and hours, so the winner is provable from the calendar slots
 * and not a property of a random draw, and every persona spans several past
 * years so the 2026 filter is still exercised. `long-distance` also carries an
 * average heart rate on every activity but never a maximum, so story 07
 * renders with its peak block omitted; `no-pulse` carries no heart rate at
 * all, so story 07 is omitted, and its plain schedule makes it the fixture
 * where the fallback archetypes `steady` wins.
 */
const EARLY_BIRD: PersonaConfig = {
  seed: 20260525,
  years: PAST_YEARS_FOR_ARCHETYPES,
  gearPool: [],
  gearChanceByLabel: {},
  forced: archetypeRuns({
    slots: WEDNESDAYS_2026,
    hour: 6,
    minute: 30,
    ...ARCHETYPE_RUNNER,
    ...noHeartRate(),
  }),
}

const NIGHT_OWL: PersonaConfig = {
  seed: 20260526,
  years: PAST_YEARS_FOR_ARCHETYPES,
  gearPool: [],
  gearChanceByLabel: {},
  forced: archetypeRuns({
    slots: FRIDAYS_2026,
    hour: 22,
    minute: 30,
    ...ARCHETYPE_RUNNER,
    ...noHeartRate(),
  }),
}

const WEEKEND_WARRIOR: PersonaConfig = {
  seed: 20260527,
  years: PAST_YEARS_FOR_ARCHETYPES,
  gearPool: [],
  gearChanceByLabel: {},
  forced: archetypeRuns({
    slots: [...SATURDAYS_2026, ...SUNDAYS_2026],
    hour: 9,
    minute: 30,
    ...ARCHETYPE_RUNNER,
    ...noHeartRate(),
  }),
}

const METHODICAL: PersonaConfig = {
  seed: 20260528,
  years: PAST_YEARS_FOR_ARCHETYPES,
  gearPool: [],
  gearChanceByLabel: {},
  forced: archetypeRuns({
    slots: methodicalWeekSlots(13),
    hour: 10,
    minute: 0,
    ...ARCHETYPE_RUNNER,
    ...noHeartRate(),
  }),
}

const LONG_DISTANCE: PersonaConfig = {
  seed: 20260529,
  years: PAST_YEARS_FOR_ARCHETYPES,
  gearPool: [],
  gearChanceByLabel: {},
  forced: archetypeRuns({
    slots: MONDAYS_2026.slice(0, 20),
    hour: 11,
    minute: 0,
    movingSec: 6000,
    kmHundredths: 1750,
    avgHeartRate: 155,
    maxHeartRate: null,
  }),
}

const NO_PULSE: PersonaConfig = {
  seed: 20260530,
  years: PAST_YEARS_FOR_ARCHETYPES,
  gearPool: [],
  gearChanceByLabel: {},
  forced: archetypeRuns({
    slots: WEDNESDAYS_2026.slice(0, 20),
    hour: 11,
    minute: 0,
    ...ARCHETYPE_RUNNER,
    ...noHeartRate(),
  }),
}

const PERSONA_CONFIGS: Readonly<Record<PersonaName, PersonaConfig>> = {
  'runner-es': RUNNER_ES,
  cyclist: CYCLIST,
  'cyclist-power': CYCLIST_POWER,
  multisport: MULTISPORT,
  'no-gear': NO_GEAR,
  'few-activities': FEW_ACTIVITIES,
  'ten-years-history': TEN_YEARS_HISTORY,
  'no-2026': NO_2026,
  'year-boundaries': YEAR_BOUNDARIES,
  'broken-rows': BROKEN_ROWS,
  'shoe-retired': SHOE_RETIREMENT,
  'early-bird': EARLY_BIRD,
  'night-owl': NIGHT_OWL,
  'weekend-warrior': WEEKEND_WARRIOR,
  methodical: METHODICAL,
  'long-distance': LONG_DISTANCE,
  'no-pulse': NO_PULSE,
}

function formatDate(spec: ActivitySpec): string {
  const month = MONTHS[spec.month0]
  if (month === undefined) {
    throw new Error(`month index out of range: ${spec.month0}`)
  }
  const minute = String(spec.minute).padStart(2, '0')
  const second = String(spec.second).padStart(2, '0')
  return `${spec.day} ${month} ${spec.year}, ${spec.hour}:${minute}:${second}`
}

/** Kilometres with a comma as the decimal separator and exactly two decimals (`61,73`). */
function formatKm(hundredths: number): string {
  const units = Math.trunc(hundredths / 100)
  const decimals = String(hundredths % 100).padStart(2, '0')
  return `${units},${decimals}`
}

function rowFields(spec: ActivitySpec): string[] {
  const fields: string[] = new Array<string>(HEADER.length).fill('')
  fields[COL.activityId] = String(spec.id)
  fields[COL.activityDate] = formatDate(spec)
  fields[COL.activityName] = spec.name
  fields[COL.activityType] = spec.label
  fields[COL.elapsedInt] = String(spec.elapsedSec)
  fields[COL.elapsedDec] = `${spec.elapsedSec}.0`
  fields[COL.movingTime] = `${spec.movingSec}.0`
  if (spec.distanceHundredths !== null) {
    fields[COL.distanceKm] = formatKm(spec.distanceHundredths)
    fields[COL.distanceMetres] = `${spec.distanceHundredths * 10}.0`
  }
  if (spec.maxHeartRate !== null) {
    fields[COL.heartRateMax] = `${spec.maxHeartRate}.0`
  }
  if (spec.elevationGainM !== null) {
    fields[COL.elevationGain] = `${spec.elevationGainM}.0`
  }
  if (spec.gear !== null) {
    fields[COL.gear] = spec.gear
  }
  if (spec.relativeEffort !== null) {
    fields[COL.relativeEffort] = String(spec.relativeEffort)
  }
  if (spec.avgHeartRate !== null) {
    fields[COL.heartRateAvg] = `${spec.avgHeartRate}.0`
  }
  if (spec.maxPowerW !== null) {
    fields[COL.maxPower] = String(spec.maxPowerW)
  }
  if (spec.avgPowerW !== null) {
    fields[COL.avgPower] = String(spec.avgPowerW)
  }
  if (spec.weightedAvgPowerW !== null) {
    fields[COL.weightedAvgPower] = String(spec.weightedAvgPowerW)
  }
  return fields
}

function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

function serializeRows(rows: readonly (readonly string[])[]): string {
  return `${rows.map((row) => row.map(csvField).join(',')).join('\n')}\n`
}

function generateActivities(config: PersonaConfig): ActivitySpec[] {
  const rng = mulberry32(config.seed)
  const specs: ActivitySpec[] = []
  for (const yearPlan of config.years) {
    for (const sportPlan of yearPlan.sports) {
      const profile = sportProfile(sportPlan.label)
      for (let index = 0; index < sportPlan.count; index += 1) {
        const movingSec = intBetween(rng, ...profile.movingSecRange)
        const activity: ActivitySpec = {
          id: 0,
          avgPowerW: null,
          maxPowerW: null,
          weightedAvgPowerW: null,
          year: yearPlan.year,
          month0: Math.min(11, Math.trunc((index / sportPlan.count) * 12)),
          day: 1 + intBetween(rng, 0, 27),
          hour: intBetween(rng, 6, 22),
          minute: intBetween(rng, 0, 59),
          second: intBetween(rng, 0, 59),
          label: profile.label,
          name: poolItem(profile.namePool, index),
          elapsedSec: movingSec + (profile.hasDistance ? intBetween(rng, 0, 600) : 0),
          movingSec,
          distanceHundredths: profile.hasDistance
            ? Math.max(
                1,
                Math.round((movingSec * floatBetween(rng, profile.kmPerHourRange) * 100) / 3600),
              )
            : null,
          maxHeartRate:
            rng() < profile.heartRateChance ? intBetween(rng, ...profile.heartRateMaxRange) : null,
          avgHeartRate: null,
          relativeEffort:
            rng() < profile.effortChance
              ? Math.max(
                  1,
                  Math.round((movingSec / 60) * floatBetween(rng, profile.effortFactorRange)),
                )
              : null,
          elevationGainM:
            rng() < profile.elevationChance ? intBetween(rng, ...profile.elevationRange) : null,
          gear: pickGear(rng, profile.label, config),
        }
        activity.avgHeartRate =
          activity.maxHeartRate === null ? null : activity.maxHeartRate - intBetween(rng, 8, 25)
        if (config.power !== undefined) {
          const avgW = intBetween(rng, ...config.power.avgWRange)
          activity.avgPowerW = avgW
          activity.maxPowerW = avgW + intBetween(rng, ...config.power.maxAboveAvg)
          activity.weightedAvgPowerW = Number(
            (avgW * floatBetween(rng, config.power.weightedFactorRange)).toFixed(1),
          )
        }
        specs.push(activity)
      }
    }
  }
  for (const forced of config.forced) {
    specs.push(forced)
  }
  specs.sort((a, b) => sortKey(b) - sortKey(a))
  return specs.map((spec, index) => ({ ...spec, id: ID_BASE - index }))
}

function sortKey(spec: ActivitySpec): number {
  return (
    (spec.year * 10000 + (spec.month0 + 1) * 100 + spec.day) * 1_000_000 +
    spec.hour * 10000 +
    spec.minute * 100 +
    spec.second
  )
}

function corruptAdditionalRows(specs: readonly ActivitySpec[]): readonly string[][] {
  const shortRowSource = specs.find((spec) => spec.year === 2024)
  const garbageSource = specs.find((spec) => spec.year === 2025 && spec.distanceHundredths !== null)
  if (shortRowSource === undefined || garbageSource === undefined) {
    throw new Error('broken-rows config must include 2024 and 2025 rows with distance')
  }
  const shortRow = rowFields({ ...shortRowSource, name: 'Fila con columnas de menos' }).slice(
    0,
    103,
  )
  const garbageRow = rowFields({ ...garbageSource, name: 'Fila con un dato roto' })
  garbageRow[COL.distanceMetres] = 'n/a'
  return [shortRow, garbageRow]
}

/**
 * Returns the CSV text of one synthetic persona, following
 * `docs/export-format.md` byte for byte. Pure and deterministic: the same
 * persona always yields the same text (fixed seeds, no ambient clock).
 */
export function generatePersonaCsv(persona: PersonaName): string {
  const config = PERSONA_CONFIGS[persona]
  const specs = generateActivities(config)
  const dataRows: readonly (readonly string[])[] =
    persona === 'broken-rows'
      ? [...specs.map(rowFields), ...corruptAdditionalRows(specs)]
      : specs.map(rowFields)
  return serializeRows([HEADER, ...dataRows])
}

function isDirectRun(): boolean {
  const entry = process.argv[1]
  return entry !== undefined && pathToFileURL(entry).href === import.meta.url
}

async function main(outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true })
  for (const persona of PERSONAS) {
    const file = path.join(outDir, `${persona}.csv`)
    await writeFile(file, generatePersonaCsv(persona), 'utf8')
    process.stdout.write(`wrote ${file}\n`)
  }
}

if (isDirectRun()) {
  const outIndex = process.argv.indexOf('--out')
  const outDir =
    outIndex !== -1
      ? process.argv[outIndex + 1]
      : path.resolve(import.meta.dirname, '..', 'generated')
  if (outDir === undefined) {
    process.stderr.write('usage: tsx fixtures/generator/index.ts [--out <dir>]\n')
    process.exitCode = 1
  } else {
    await main(outDir)
  }
}
