import { createHash } from 'node:crypto'
import { compareCodeUnits } from './compare-code-units.ts'

export interface SourceFile {
  readonly path: string
  readonly content: Uint8Array
}

export class DuplicatePathError extends Error {
  readonly path: string

  constructor(path: string) {
    super(`Two input files normalize to the same path: ${path}`)
    this.name = 'DuplicatePathError'
    this.path = path
  }
}

// Same normalization the real pipeline needs before deriving ids (architecture.md).
export const normalizePath = (path: string): string => path.replaceAll('\\', '/').normalize('NFC')

const sha256Hex = (content: Uint8Array): string =>
  createHash('sha256').update(content).digest('hex')

/**
 * Placeholder for the real pipeline (TSK-011). It exercises the determinism rules that the
 * pipeline must keep: sort by code unit, hash content only, normalize paths and Unicode,
 * and fail loudly on collisions. The result is independent of input order, OS and locale.
 */
export const fingerprintFiles = (files: readonly SourceFile[]): string => {
  const entries = files
    .map((file) => ({ path: normalizePath(file.path), hash: sha256Hex(file.content) }))
    .toSorted((a, b) => compareCodeUnits(a.path, b.path))

  entries.forEach((entry, index) => {
    if (index > 0 && entries[index - 1]?.path === entry.path) {
      throw new DuplicatePathError(entry.path)
    }
  })

  return entries.map((entry) => `${entry.hash}  ${entry.path}\n`).join('')
}
