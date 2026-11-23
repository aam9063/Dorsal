import { describe, expect, it } from 'vitest'
import { ES_SPORT_KINDS_BY_LABEL, sportForEsLabel, type SportKind } from './index'

describe('ES sport map', () => {
  it('maps every documented Spanish label to its documented kind', () => {
    expect(sportForEsLabel('Carrera')).toBe<SportKind>('run')
    expect(sportForEsLabel('Bicicleta')).toBe<SportKind>('ride')
    expect(sportForEsLabel('Bicicleta virtual')).toBe<SportKind>('ride')
    expect(sportForEsLabel('Caminata')).toBe<SportKind>('walk')
    expect(sportForEsLabel('Senderismo')).toBe<SportKind>('hike')
    expect(sportForEsLabel('Natación')).toBe<SportKind>('swim')
    expect(ES_SPORT_KINDS_BY_LABEL).toEqual({
      Carrera: 'run',
      Bicicleta: 'ride',
      'Bicicleta virtual': 'ride',
      Caminata: 'walk',
      Senderismo: 'hike',
      Natación: 'swim',
    })
  })

  it('maps an invented label to other instead of throwing', () => {
    expect(sportForEsLabel('Entrenamiento con pesas')).toBe<SportKind>('other')
    expect(sportForEsLabel('Elíptica')).toBe<SportKind>('other')
    expect(sportForEsLabel('Totalmente inventado')).toBe<SportKind>('other')
    expect(sportForEsLabel('')).toBe<SportKind>('other')
  })
})
