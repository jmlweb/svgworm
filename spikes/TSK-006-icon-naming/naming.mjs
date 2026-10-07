// Throwaway prototype for TSK-006 / ADR-0007. Evidence, not product code.
// Implements the naming rules in docs/output-contract.md ("Icon naming").

const SVG_EXTENSION = /\.svg$/i
// A run starts with a non-letter/mark/number or a default-ignorable code point
// (variation selectors, ZWJ, bidi controls) and swallows marks that follow it,
// so no segment can start with, or consist only of, combining marks.
const SEPARATOR_RUN = /(?:^\p{M}|[^\p{L}\p{M}\p{N}]|\p{Default_Ignorable_Code_Point})(?:[^\p{L}\p{N}]|\p{Default_Ignorable_Code_Point})*/gu
const REPLACEMENT_CHAR = '\uFFFD'
const SYMBOL_ID_PREFIX = 'i-'

export class NamingError extends Error {
  constructor(reason, file) {
    super(`${file}: ${reason}`)
    this.reason = reason
    this.file = file
  }
}

const normalizeSegment = (segment) =>
  segment
    .normalize('NFC')
    .toLowerCase()
    .normalize('NFC')
    .replaceAll('ς', 'σ')
    .replace(SEPARATOR_RUN, '-')
    .replace(/^-+|-+$/g, '')

// relativePath: path relative to its source root, any separator.
export const deriveName = (relativePath, { flatten = false } = {}) => {
  if (relativePath.includes(REPLACEMENT_CHAR)) {
    throw new NamingError('file name is not valid Unicode (undecodable bytes or lone surrogates)', relativePath)
  }
  const posix = relativePath.replaceAll('\\', '/')
  const rawSegments = posix.split('/').filter((s) => s !== '' && s !== '.')
  const file = rawSegments.at(-1) ?? ''
  if (!SVG_EXTENSION.test(file)) throw new NamingError('not an .svg file', relativePath)
  const withoutExt = [...rawSegments.slice(0, -1), file.replace(SVG_EXTENSION, '')]
  const kept = flatten ? withoutExt.slice(-1) : withoutExt
  const segments = kept.map(normalizeSegment)
  const emptyIndex = segments.findIndex((s) => s === '')
  if (emptyIndex !== -1) {
    throw new NamingError(`segment "${kept[emptyIndex]}" is empty after normalization`, relativePath)
  }
  return segments.join('/')
}

const encodeChar = (ch) => {
  if (ch === '/') return '--'
  if (/^[a-z0-9-]$/.test(ch)) return ch
  return `_${ch.codePointAt(0).toString(16)}_`
}

export const toSymbolId = (name) => SYMBOL_ID_PREFIX + [...name].map(encodeChar).join('')

export const internalId = (symbolId, ordinal) => `${symbolId}_${ordinal}`

// Code point order (= UTF-8 byte order), never locale or UTF-16 order.
export const compareNames = (a, b) => {
  const ca = [...a].map((c) => c.codePointAt(0))
  const cb = [...b].map((c) => c.codePointAt(0))
  for (let i = 0; i < Math.min(ca.length, cb.length); i++) {
    if (ca[i] !== cb[i]) return ca[i] - cb[i]
  }
  return ca.length - cb.length
}

// files: [{ root, path }] where path is relative to root. Returns sorted
// [{ name, id, files }] or throws an AggregateError with every problem.
export const buildNames = (files, options = {}) => {
  const errors = []
  const byName = new Map()
  for (const f of files) {
    try {
      const name = deriveName(f.path, options)
      byName.set(name, [...(byName.get(name) ?? []), `${f.root}/${f.path}`])
    } catch (e) {
      errors.push(e)
    }
  }
  const collisions = [...byName.entries()]
    .filter(([, sources]) => sources.length > 1)
    .map(([name, sources]) => new NamingError(`name "${name}" collides: ${[...sources].sort(compareNames).join(', ')}`, name))
  const all = [...errors, ...collisions].sort((a, b) => compareNames(a.file.normalize('NFC'), b.file.normalize('NFC')))
  if (all.length > 0) throw new AggregateError(all, `${all.length} naming error(s)`)
  return [...byName.entries()]
    .map(([name, [source]]) => ({ name, id: toSymbolId(name), source }))
    .sort((a, b) => compareNames(a.name, b.name))
}
