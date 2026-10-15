import { describe, expect, it } from 'vitest';

describe('license comments', () => {
  const symbol = {
    id: 'i-a',
    viewBox: '0 0 24 24',
    attributes: [],
    inner: '<path d="M0 0h1v1"/>',
  };

  it('writes each distinct license once before the root, sorted', () => {
    const text = assembleSprite(
      [symbol, { ...symbol, id: 'i-b' }],
      ['@license lucide-static v1.52.0 - ISC', '! Font Awesome Free 6.5.1'],
    );
    expect(text).toBe(
      '<!-- ! Font Awesome Free 6.5.1 -->\n' +
        '<!-- @license lucide-static v1.52.0 - ISC -->\n' +
        '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<symbol id="i-a" viewBox="0 0 24 24"><path d="M0 0h1v1"/></symbol>' +
        '<symbol id="i-b" viewBox="0 0 24 24"><path d="M0 0h1v1"/></symbol></svg>',
    );
  });

  it('never breaks the comment syntax', () => {
    const text = assembleStack([symbol], ['a -- b --> c']);
    expect(text.startsWith('<!-- a - - b - -> c -->\n<svg')).toBe(true);
  });

  it('writes nothing extra without licenses', () => {
    expect(assembleSprite([symbol], []).startsWith('<svg')).toBe(true);
  });
});

import { contentHash, spriteFileName, stackFileName } from './hash.ts';
import { assembleSprite, assembleStack, type SymbolMarkup } from './sprite.ts';

const home: SymbolMarkup = {
  id: 'i-home',
  viewBox: '0 0 24 24',
  attributes: [],
  inner: '<path fill="currentColor" d="M12 3 2 12h3v9h5v-6h4v6h5v-9h3z"/>',
};
const check: SymbolMarkup = {
  id: 'i-ui--check',
  viewBox: '0 0 24 24',
  attributes: [['fill', 'none']],
  inner: '<path d="M4 12l5 5L20 6"/>',
};

describe('contentHash', () => {
  it('is the first 8 hex characters of SHA-256', () => {
    expect(contentHash(new TextEncoder().encode('abc'))).toBe('ba7816bf');
  });

  it('depends on bytes only', () => {
    const bytes = new TextEncoder().encode('<svg/>');
    expect(contentHash(bytes)).toBe(contentHash(new Uint8Array(bytes)));
  });
});

describe('file names', () => {
  it('follows <group>.<hash>.svg and <group>.stack.<hash>.svg', () => {
    expect(spriteFileName('d907d82b')).toBe('icons.d907d82b.svg');
    expect(stackFileName('91bff0b3')).toBe('icons.stack.91bff0b3.svg');
  });
});

describe('assembleSprite', () => {
  it('writes one <symbol> per icon', () => {
    expect(assembleSprite([home, check])).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="i-home" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3 2 12h3v9h5v-6h4v6h5v-9h3z"/></symbol><symbol id="i-ui--check" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6"/></symbol></svg>',
    );
  });

  it('self-closes an empty symbol and escapes attribute values', () => {
    expect(
      assembleSprite([
        {
          id: 'i-a',
          viewBox: '0 0 1 1',
          attributes: [['data-x', 'a"b&c<']],
          inner: '',
        },
      ]),
    ).toContain(
      '<symbol id="i-a" viewBox="0 0 1 1" data-x="a&quot;b&amp;c&lt;"/>',
    );
  });
});

describe('assembleStack', () => {
  it('starts with the single :target rule and nests an <svg> per icon', () => {
    expect(assembleStack([home])).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg"><style>:root>svg{display:none}:root>svg:target{display:inline}</style><svg id="i-home" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3 2 12h3v9h5v-6h4v6h5v-9h3z"/></svg></svg>',
    );
  });
});
