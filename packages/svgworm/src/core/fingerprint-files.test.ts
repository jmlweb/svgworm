import { describe, expect, it } from 'vitest'
import { compareCodeUnits } from './compare-code-units.ts'
import { DuplicatePathError, fingerprintFiles, type SourceFile } from './fingerprint-files.ts'

const encode = (text: string): Uint8Array => new TextEncoder().encode(text)

const files: readonly SourceFile[] = [
  { path: 'icons/b.svg', content: encode('<svg id="b"/>') },
  { path: 'icons/B.svg', content: encode('<svg id="B"/>') },
  { path: 'icons/a.svg', content: encode('<svg id="a"/>') },
  { path: 'icons/\u00f1.svg', content: encode('<svg id="n"/>') },
  { path: 'z/icon.svg', content: encode('<svg id="z"/>') },
]

// Fixed-seed PRNG so a failure is reproducible.
const shuffle = <T>(items: readonly T[], seed: number): T[] => {
  const result = [...items]
  let state = seed
  for (let i = result.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    const j = state % (i + 1)
    ;[result[i], result[j]] = [result[j] as T, result[i] as T]
  }
  return result
}

describe('fingerprintFiles', () => {
  it('gives byte-identical output for any input order', () => {
    const expected = fingerprintFiles(files)
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(fingerprintFiles(shuffle(files, seed))).toBe(expected)
    }
    expect(fingerprintFiles(files.toReversed())).toBe(expected)
  })

  it('is stable across runs', () => {
    expect(fingerprintFiles(files)).toBe(fingerprintFiles(files))
  })

  it('sorts by code unit, not by locale', () => {
    const paths = fingerprintFiles(files)
      .trimEnd()
      .split('\n')
      .map((line) => line.slice(line.indexOf('  ') + 2))
    expect(paths).toEqual([
      'icons/B.svg',
      'icons/a.svg',
      'icons/b.svg',
      'icons/\u00f1.svg',
      'z/icon.svg',
    ])
  })

  it('treats separators and Unicode forms as the same path', () => {
    const nfc = [{ path: 'icons/\u00f1.svg', content: encode('x') }]
    const nfdWithBackslash = [{ path: 'icons\\n\u0303.svg', content: encode('x') }]
    expect(fingerprintFiles(nfdWithBackslash)).toBe(fingerprintFiles(nfc))
  })

  it('hashes content only', () => {
    const content = encode('<svg/>')
    const hashOf = (path: string): string | undefined =>
      fingerprintFiles([{ path, content }]).split('  ')[0]
    expect(hashOf('one/name.svg')).toBe(hashOf('other/place.svg'))
  })

  it('fails loudly when two files normalize to the same path', () => {
    const colliding = [
      { path: 'icons/\u00f1.svg', content: encode('a') },
      { path: 'icons/n\u0303.svg', content: encode('b') },
    ]
    expect(() => fingerprintFiles(colliding)).toThrow(DuplicatePathError)
  })
})

describe('compareCodeUnits', () => {
  it('orders uppercase before lowercase', () => {
    expect(['b', 'a', 'B', 'A'].toSorted(compareCodeUnits)).toEqual(['A', 'B', 'a', 'b'])
  })
})
