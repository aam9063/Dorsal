import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { EXPECTED_FIELD_COUNT, hasZipSignature, headerDecisionFor, probeExportStart } from './probe'

const ZIP_BYTES = [0x50, 0x4b, 0x03, 0x04] as const

/** A header line with exactly the documented column count. */
function headerLine(): string {
  const fields = ['ID de actividad']
  for (let index = 1; index < EXPECTED_FIELD_COUNT; index += 1) {
    fields.push(`Campo ${String(index + 1)}`)
  }
  return fields.join(',')
}

function firstRowOf(csvText: string): string[] | undefined {
  const parsed = Papa.parse<string[]>(csvText, { header: false, skipEmptyLines: 'greedy' })
  return parsed.data[0]
}

describe('zip signature probe', () => {
  it('recognises a file that starts with the PK zip signature', () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 20, 0, 1, 2])
    expect(hasZipSignature(bytes)).toBe(true)
  })

  it('does not flag CSV text or a shorter sequence', () => {
    const csvBytes = new TextEncoder().encode('ID de actividad,Fecha de la actividad')
    expect(hasZipSignature(csvBytes)).toBe(false)
    expect(hasZipSignature(new Uint8Array([0x50, 0x4b]))).toBe(false)
  })
})

describe('header decision over in-memory CSV text', () => {
  it('accepts a header with the documented column count', () => {
    const row = firstRowOf(headerLine())
    expect(headerDecisionFor(row)).toBeNull()
  })

  it('rejects a header-like first row with the wrong field count', () => {
    const row = firstRowOf('a,b,c\n1,2,3')
    const decision = headerDecisionFor(row)
    expect(decision?.code).toBe('notStrava')
    expect(decision?.message).toContain('3')
  })

  it('rejects a file with no header and no parseable row', () => {
    const row = firstRowOf('1,2,3\n4,5,6')
    const decision = headerDecisionFor(row)
    expect(decision?.code).toBe('notStrava')
    expect(decision?.message).toContain('3')
  })

  it('rejects an empty file, which yields no row at all', () => {
    const decision = headerDecisionFor(undefined)
    expect(decision?.code).toBe('notStrava')
  })
})

describe('start probe of a File', () => {
  it('passes a real header-only CSV through to the parser', async () => {
    const file = new File([`${headerLine()}\n`], 'activities.csv', { type: 'text/csv' })
    await expect(probeExportStart(file)).resolves.toBeNull()
  })

  it('flags a zip renamed to .csv by its bytes, not its name', async () => {
    const bytes = new Uint8Array([ZIP_BYTES[0], ZIP_BYTES[1], ZIP_BYTES[2], ZIP_BYTES[3], 0, 1])
    const file = new File([bytes], 'activities.csv', { type: 'text/csv' })
    const violation = await probeExportStart(file)
    expect(violation?.code).toBe('zipInsteadOfCsv')
  })

  it('flags a short non-export file as notStrava', async () => {
    const file = new File(['a,b\n1,2'], 'activities.csv', { type: 'text/csv' })
    const violation = await probeExportStart(file)
    expect(violation?.code).toBe('notStrava')
  })
})

describe('probeExportStart with a truncated slice', () => {
  it('does not call the file "not Strava" when the probe slice cuts its only row', async () => {
    const oneHugeRow = 'a'.repeat(20 * 1024)
    const file = new File([oneHugeRow], 'x.csv', { type: 'text/csv' })

    expect(await probeExportStart(file)).toBeNull()
  })
})
