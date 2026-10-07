// Run: node spikes/TSK-006-icon-naming/check.mjs
// Asserts the example table in docs/output-contract.md and prints it as Markdown.
import assert from 'node:assert/strict'
import { readdirSync, statSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildNames, deriveName, toSymbolId, internalId, NamingError } from './naming.mjs'

const NCNAME_ASCII = /^[A-Za-z_][A-Za-z0-9._-]*$/
const ERROR = Symbol('error')

const examples = [
  ['home.svg', {}, 'home'],
  ['arrow-left.svg', {}, 'arrow-left'],
  ['Arrow Left.svg', {}, 'arrow-left'],
  ['arrow_left.svg', {}, 'arrow-left'],
  ['ArrowLeft.svg', {}, 'arrowleft'],
  ['IC_Close.SVG', {}, 'ic-close'],
  ['icon.filled.svg', {}, 'icon-filled'],
  ['logo@2x.svg', {}, 'logo-2x'],
  ['Property 1=Default.svg', {}, 'property-1-default'],
  ['C++.svg', {}, 'c'],
  ['social/github.svg', {}, 'social/github'],
  ['social\\github.svg', {}, 'social/github'],
  ['Social Media/GitHub.svg', {}, 'social-media/github'],
  ['actions/close.svg', {}, 'actions/close'],
  ['arrows/close.svg', {}, 'arrows/close'],
  ['actions/close.svg', { flatten: true }, 'close'],
  ['a-b/c.svg', {}, 'a-b/c'],
  ['a/b-c.svg', {}, 'a/b-c'],
  ['24/add.svg', {}, '24/add'],
  ['2fa.svg', {}, '2fa'],
  ['café.svg'.normalize('NFC'), {}, 'café'],
  ['café.svg'.normalize('NFD'), {}, 'café'],
  ['CAFÉ.svg'.normalize('NFD'), {}, 'café'],
  ['日本.svg', {}, '日本'],
  ['Straße.svg', {}, 'straße'],
  ['constructor.svg', {}, 'constructor'],
  ['icon.svg.svg', {}, 'icon-svg'],
  ['ΟΔΟΣ.ΚΑΤΩ.svg', {}, 'οδοσ-κατω'],
  ['ΟΔΟΣ_ΚΑΤΩ.svg', {}, 'οδοσ-κατω'],
  ['οδος.κατω.svg', {}, 'οδοσ-κατω'],
  ['home\uFE00.svg', {}, 'home'],
  ['_\u0301x.svg', {}, 'x'],
  ['\u212A.svg', {}, 'k'],
  ['１２.svg', {}, '１２'],
  ['🔥.svg', {}, ERROR],
  ['❤\uFE0F.svg', {}, ERROR],
  ['\u0301.svg', {}, ERROR],
  ['caf\uFFFD.svg', {}, ERROR],
  ['---.svg', {}, ERROR],
  ['.svg', {}, ERROR],
  ['_/close.svg', {}, ERROR],
]

const rows = examples.map(([path, options, expected]) => {
  if (expected === ERROR) {
    assert.throws(() => deriveName(path, options), NamingError, path)
    return [path, options, 'error', '']
  }
  const name = deriveName(path, options)
  assert.equal(name, expected.normalize('NFC'), path)
  const id = toSymbolId(name)
  assert.match(id, NCNAME_ASCII, `${id} is not an ASCII NCName`)
  assert.match(id, /^i-[a-z0-9_-]+$/, 'symbol id alphabet')
  return [path, options, name, id]
})

// Injectivity: distinct names never share a symbol id.
const names = rows.filter((r) => r[3]).map((r) => r[2])
const ids = new Map(names.map((n) => [toSymbolId(n), n]))
assert.equal(ids.size, new Set(names).size, 'symbol id encoding is injective on examples')

// Internal ids (<symbolId>_<n>) never equal a symbol id or another icon's internal id.
const symbolIds = [...ids.keys()]
const internals = symbolIds.flatMap((sid) => [1, 2, 10].map((n) => internalId(sid, n)))
assert.equal(new Set(internals).size, internals.length, 'internal ids unique across icons')
assert.ok(internals.every((x) => !ids.has(x)), 'internal ids never equal a symbol id')
assert.ok(internals.every((x) => /^[A-Za-z_][A-Za-z0-9_-]*$/.test(x)), 'internal ids are CSS idents and NCNames without "."')

// Collisions are errors that list every file, regardless of input order.
const collide = (files, options) => {
  try {
    buildNames(files, options)
    assert.fail('expected a collision')
  } catch (e) {
    assert.ok(e instanceof AggregateError)
    return e.errors.map((x) => x.message)
  }
}
const caseDupes = [{ root: 'icons', path: 'Icon.svg' }, { root: 'icons', path: 'icon.svg' }]
assert.deepEqual(collide(caseDupes), collide([...caseDupes].reverse()))
const unicodeDupes = [
  { root: 'icons', path: 'café.svg'.normalize('NFC') },
  { root: 'icons', path: 'café.svg'.normalize('NFD') },
]
assert.equal(collide(unicodeDupes).length, 1)
assert.equal(collide([{ root: 'icons', path: 'home.svg' }, { root: 'icons', path: 'home\uFE00.svg' }]).length, 1)
const separatorDupes = [{ root: 'icons', path: 'arrow_left.svg' }, { root: 'icons', path: 'arrow-left.svg' }]
assert.equal(collide(separatorDupes).length, 1)

// Fixtures: duplicates and non-ascii folders, shuffled, plus an NFD copy of café.
const here = dirname(fileURLToPath(import.meta.url))
const fixtures = join(here, '..', '..', 'fixtures')
const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
const fixtureFiles = (sub) =>
  walk(join(fixtures, sub))
    .filter((f) => f.endsWith('.svg'))
    .map((f) => ({ root: `fixtures/${sub}`, path: relative(join(fixtures, sub), f) }))

const dupes = fixtureFiles('duplicates')
const nested = buildNames(dupes)
assert.deepEqual(nested.map((n) => n.name), ['actions/close', 'arrows/close'])
console.log('fixtures/duplicates flattened:', collide(dupes, { flatten: true }))

const nonAscii = fixtureFiles('non-ascii')
const a = buildNames(nonAscii)
const b = buildNames(
  [...nonAscii].reverse().map((f) => ({ ...f, path: f.path.normalize('NFD') })),
)
const strip = (list) => list.map(({ name, id }) => ({ name, id }))
assert.deepEqual(strip(a), strip(b), 'NFC and NFD sources, any order, give identical names and ids')
assert.notEqual(a[0].source, b[0].source, 'raw source paths differ: anything emitted from a path must be NFC-normalized too')
console.log('fixtures/non-ascii:', a.map(({ name, id }) => `${name} -> ${id}`).join(', '))

// Exhaustive: for every code point, NFC and NFD input agree, and the result is a fixed point.
let checked = 0
for (let c = 0; c <= 0x10ffff; c++) {
  if (c >= 0xd800 && c <= 0xdfff) continue
  const s = `a${String.fromCodePoint(c)}b`
  const run = (p) => { try { return deriveName(`${p}.svg`) } catch { return ERROR } }
  const nfc = run(s.normalize('NFC'))
  assert.equal(run(s.normalize('NFD')), nfc, `NFC/NFD differ at U+${c.toString(16)}`)
  if (nfc !== ERROR) assert.equal(run(nfc), nfc, `not idempotent at U+${c.toString(16)}`)
  checked++
}
console.log(`exhaustive: ${checked} code points, NFC = NFD and idempotent (Unicode ${process.versions.unicode})`)

const fmt = (o) => (o.flatten ? ' (flatten)' : '')
const show = (p) => (p.normalize('NFC') === p ? p : `${p.normalize('NFC')} (NFD bytes)`)
console.log('\n| Input (relative path) | Public name | Symbol id |\n|---|---|---|')
for (const [path, options, name, id] of rows) {
  console.log(`| \`${show(path)}\`${fmt(options)} | ${id ? `\`${name}\`` : name} | ${id ? `\`${id}\`` : ''} |`)
}
console.log('\nAll assertions passed.')
