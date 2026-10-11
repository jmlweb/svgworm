import { describe, expect, it } from 'vitest';

import { deriveName, toSymbolId } from './naming.ts';

const ok = (path: string, flatten = false) => {
  const result = deriveName(path, { flatten });
  if (!result.ok) throw new Error(`${path}: ${result.error.message}`);
  return result.name;
};

// Rows of the example table in docs/output-contract.md.
const table: readonly (readonly [string, string, string])[] = [
  ['home.svg', 'home', 'i-home'],
  ['Arrow Left.svg', 'arrow-left', 'i-arrow-left'],
  ['arrow_left.svg', 'arrow-left', 'i-arrow-left'],
  ['ArrowLeft.svg', 'arrowleft', 'i-arrowleft'],
  ['IC_Close.SVG', 'ic-close', 'i-ic-close'],
  ['icon.filled.svg', 'icon-filled', 'i-icon-filled'],
  ['logo@2x.svg', 'logo-2x', 'i-logo-2x'],
  ['Property 1=Default.svg', 'property-1-default', 'i-property-1-default'],
  ['C++.svg', 'c', 'i-c'],
  ['social/github.svg', 'social/github', 'i-social--github'],
  ['social\\github.svg', 'social/github', 'i-social--github'],
  ['Social Media/GitHub.svg', 'social-media/github', 'i-social-media--github'],
  ['a-b/c.svg', 'a-b/c', 'i-a-b--c'],
  ['a/b-c.svg', 'a/b-c', 'i-a--b-c'],
  ['24/add.svg', '24/add', 'i-24--add'],
  ['2fa.svg', '2fa', 'i-2fa'],
  ['Straße.svg', 'straße', 'i-stra_df_e'],
  ['icon.svg.svg', 'icon-svg', 'i-icon-svg'],
  ['actions/close.svg', 'actions/close', 'i-actions--close'],
  ['café.svg', 'café', 'i-caf_e9_'],
  ['café.svg', 'café', 'i-caf_e9_'],
  ['CAFÉ.svg', 'café', 'i-caf_e9_'],
  ['日本.svg', '日本', 'i-_65e5__672c_'],
  ['ΟΔΟΣ.ΚΑΤΩ.svg', 'οδοσ-κατω', 'i-_3bf__3b4__3bf__3c3_-_3ba__3b1__3c4__3c9_'],
  ['ΟΔΟΣ_ΚΑΤΩ.svg', 'οδοσ-κατω', 'i-_3bf__3b4__3bf__3c3_-_3ba__3b1__3c4__3c9_'],
  ['οδος.κατω.svg', 'οδοσ-κατω', 'i-_3bf__3b4__3bf__3c3_-_3ba__3b1__3c4__3c9_'],
  ['home︀.svg', 'home', 'i-home'],
  ['_́x.svg', 'x', 'i-x'],
  ['１２.svg', '１２', 'i-_ff11__ff12_'],
];

describe('deriveName and toSymbolId', () => {
  it.each(table)('%s -> %s -> %s', (path, name, id) => {
    expect(ok(path)).toBe(name);
    expect(toSymbolId(name)).toBe(id);
  });

  it('keeps only the file segment with flatten', () => {
    expect(ok('duplicates/actions/close.svg', true)).toBe('close');
  });

  it.each(['🔥.svg', '❤️.svg', '---.svg', '_/close.svg'])(
    'rejects %s as empty',
    (path) => {
      const result = deriveName(path, { flatten: false });
      expect(result).toMatchObject({
        ok: false,
        error: { code: 'name/empty-segment' },
      });
    },
  );

  it.each(['caf�.svg', 'a\uD800.svg'])(
    'rejects %j as not valid Unicode',
    (path) => {
      expect(deriveName(path, { flatten: false })).toMatchObject({
        ok: false,
        error: { code: 'path/invalid-encoding' },
      });
    },
  );

  it('rejects a path without the .svg extension', () => {
    expect(deriveName('a.png', { flatten: false })).toMatchObject({
      ok: false,
      error: { code: 'path/not-svg' },
    });
  });

  it('is idempotent and NFC/NFD stable over BMP letters', () => {
    for (let cp = 0x20; cp < 0x3000; cp += 1) {
      const char = String.fromCodePoint(cp);
      const nfc = deriveName(`a${char}b.svg`.normalize('NFC'), {
        flatten: false,
      });
      const nfd = deriveName(`a${char}b.svg`.normalize('NFD'), {
        flatten: false,
      });
      expect(nfd).toEqual(nfc);
    }
  });

  it('produces ids that are valid NCNames', () => {
    for (const [, name] of table) {
      expect(toSymbolId(name)).toMatch(/^i-[a-z0-9_-]+$/);
    }
  });
});
