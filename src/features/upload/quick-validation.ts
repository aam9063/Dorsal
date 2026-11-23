/** Upload limit documented in the upload copy (BRIEF §5.1: the reference export is 0.3 MB). */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export type QuickValidation =
  { kind: 'ok' } | { kind: 'extension' } | { kind: 'size'; sizeBytes: number }

/**
 * Quick validation on the main thread before the worker sees the file
 * (BRIEF §4.2): only what a `File` offers without reading it, its name and its
 * size. Everything that reads bytes happens in the worker.
 */
export function quickValidate(file: { name: string; size: number }): QuickValidation {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { kind: 'extension' }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { kind: 'size', sizeBytes: file.size }
  }
  return { kind: 'ok' }
}
