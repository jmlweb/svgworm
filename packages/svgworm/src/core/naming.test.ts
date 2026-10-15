import { describe, expect, it } from 'vitest';

import { caseFoldedSegments, deriveName, toSymbolId } from './naming.ts';

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
  ['cafe'.concat(String.fromCharCode(0x301), '.svg'), 'café', 'i-caf_e9_'],
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

describe('caseFoldedSegments', () => {
  const found = (path: string, flatten = false) =>
    caseFoldedSegments(path, { flatten }).map(({ kind, path: at, message }) => [
      kind,
      at,
      message,
    ]);

  it.each([
    [
      'ArrowLeft.svg',
      'ArrowLeft.svg',
      'ArrowLeft.svg',
      'arrowleft',
      'arrow-left.svg',
      'arrow-left',
    ],
    [
      'arrowRight.svg',
      'arrowRight.svg',
      'arrowRight.svg',
      'arrowright',
      'arrow-right.svg',
      'arrow-right',
    ],
    [
      'icons/HomeFilled.svg',
      'icons/HomeFilled.svg',
      'HomeFilled.svg',
      'homefilled',
      'home-filled.svg',
      'home-filled',
    ],
    [
      'ÉtatCivil.svg',
      'ÉtatCivil.svg',
      'ÉtatCivil.svg',
      'étatcivil',
      'état-civil.svg',
      'état-civil',
    ],
  ])(
    'warns for the file %s',
    (path, at, segment, folded, renamed, readable) => {
      expect(found(path)).toEqual([
        [
          'file',
          at,
          `letter case is not kept in names: file "${segment}" gives "${folded}"; rename it to ${renamed} for "${readable}"`,
        ],
      ]);
    },
  );

  it('warns once for a camelCase folder, at the folder path', () => {
    expect(found('brand/SocialMedia/x.svg')).toEqual([
      [
        'folder',
        'brand/SocialMedia',
        'letter case is not kept in names: folder "SocialMedia" gives "socialmedia"; rename it to social-media for "social-media"',
      ],
    ]);
  });

  it('reports a camelCase folder and a camelCase file separately', () => {
    expect(
      found('SocialMedia/GitHub.svg').map(([kind, at]) => [kind, at]),
    ).toEqual([
      ['folder', 'SocialMedia'],
      ['file', 'SocialMedia/GitHub.svg'],
    ]);
  });

  it.each([
    'home.svg',
    'IC_Close.SVG',
    'HOME.svg',
    'Arrow Left.svg',
    'ΟΔΟΣ.ΚΑΤΩ.svg',
    'Social Media/home.svg',
  ])('does not warn for %s', (path) => {
    expect(found(path)).toEqual([]);
  });

  it('ignores folders that do not reach the name with flatten', () => {
    expect(found('SocialMedia/x.svg', true)).toEqual([]);
    expect(found('social/GitHubMark.svg', true).map(([kind]) => kind)).toEqual([
      'file',
    ]);
  });

  it('suggests segments whose derived name is the promised one', () => {
    for (const path of [
      'ArrowLeft.svg',
      'SocialMedia/BrandX.svg',
      'aB/cD.svg',
    ]) {
      const renamed = path
        .split('/')
        .map((segment, index, all) => {
          const hit = caseFoldedSegments(path, { flatten: false }).find(
            (item) => item.path === all.slice(0, index + 1).join('/'),
          );
          return hit === undefined
            ? segment
            : (/rename it to (\S+) for/.exec(hit.message)?.[1] ?? '');
        })
        .join('/');
      const derived = deriveName(renamed, { flatten: false });
      expect(derived.ok).toBe(true);
      expect(caseFoldedSegments(renamed, { flatten: false })).toEqual([]);
      const promised = caseFoldedSegments(path, { flatten: false })
        .map((item) => /for "([^"]+)"$/.exec(item.message)?.[1])
        .at(-1);
      expect(derived.ok && derived.name.endsWith(promised ?? '')).toBe(true);
    }
  });
});
