import Papa from 'papaparse'

/**
 * Local file header of a zip archive. Strava's export is a `.zip`; the probe
 * reads the first bytes of the `File`, so a renamed archive is caught too.
 */
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04] as const

/**
 * Column count of the documented `activities.csv` header
 * (`docs/export-format.md`: 104 columns). The header check reads by index, so
 * only the count is probed here; column order is the reader's contract.
 */
export const EXPECTED_FIELD_COUNT = 104

/** How much of the start to read for the first row; any header fits well below it. */
const HEADER_PROBE_BYTES = 16 * 1024

export type StartViolation =
  { code: 'zipInsteadOfCsv'; message: string } | { code: 'notStrava'; message: string }

function firstFieldNumeric(row: readonly string[]): boolean {
  return /^\d+$/.test(row[0] ?? '')
}

/**
 * Decision about the first parsed row of the file. The documented export has a
 * 104-field header, so the first row must be either that header or a first
 * data row; anything else means the file is not an `activities.csv` export and
 * there is no parseable row to trust. `null` when the file passes.
 */
export function headerDecisionFor(firstRow: readonly string[] | undefined): StartViolation | null {
  if (firstRow === undefined) {
    return {
      code: 'notStrava',
      message: 'no header and no parseable row at all',
    }
  }
  if (firstRow.length === EXPECTED_FIELD_COUNT) {
    return null
  }
  const rounded = firstFieldNumeric(firstRow)
    ? 'the file has no header and its first row is not a parseable data row'
    : 'the first row looks like a header but has the wrong field count'
  return {
    code: 'notStrava',
    message: `${rounded}: ${String(firstRow.length)} fields, expected ${String(EXPECTED_FIELD_COUNT)}`,
  }
}

export function hasZipSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= ZIP_SIGNATURE.length &&
    ZIP_SIGNATURE.every((byte, index) => bytes[index] === byte)
  )
}

/**
 * Reads the start of the `File` before any parsing happens and reports the
 * failures only byte and header evidence can catch: the zip of the export
 * instead of the CSV, and a first row that is not the documented header nor a
 * parseable data row. `null` when the analysis may go on.
 */
export async function probeExportStart(file: Blob): Promise<StartViolation | null> {
  const signature = new Uint8Array(await file.slice(0, ZIP_SIGNATURE.length).arrayBuffer())
  if (hasZipSignature(signature)) {
    return {
      code: 'zipInsteadOfCsv',
      message: 'the file starts with the PK zip signature',
    }
  }
  const start = await file.slice(0, HEADER_PROBE_BYTES).text()
  const isTruncatedSlice = file.size > HEADER_PROBE_BYTES
  // A truncated slice could cut the first row in half, and a half row is not
  // evidence that the file is something else. Only a row the slice contains in
  // full is judged here.
  if (isTruncatedSlice && !start.includes('\n')) {
    return null
  }
  const parsed = Papa.parse<string[]>(start, { header: false, skipEmptyLines: 'greedy' })
  return headerDecisionFor(parsed.data[0])
}
