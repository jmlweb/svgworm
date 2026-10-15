import { describe, expect, it } from 'vitest';

import { findCollisions } from './collisions.ts';

const entries = [
  { name: 'close', path: 'icons/b/close.svg' },
  { name: 'home', path: 'icons/home.svg' },
  { name: 'close', path: 'icons/a/close.svg' },
  { name: 'close', path: 'other/close.svg' },
];

describe('findCollisions', () => {
  it('returns one error per colliding name that lists every file', () => {
    const errors = findCollisions(entries);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: 'name/collision',
      file: 'icons/a/close.svg',
    });
    expect(errors[0]?.message).toBe(
      'name "close" is produced by 3 files: icons/a/close.svg, icons/b/close.svg, other/close.svg. Fix: rename one of the files or folders',
    );
  });

  it('says to turn flatten off when the files sit in different folders', () => {
    const [error] = findCollisions(entries, { flatten: true });
    expect(error?.message).toMatch(
      /Fix: rename one of the files, or turn flatten off so the folder names stay in the icon names$/,
    );
  });

  it('says to rename when the files sit in the same folder', () => {
    const [error] = findCollisions(
      [
        { name: 'arrow-left', path: 'icons/arrow_left.svg' },
        { name: 'arrow-left', path: 'icons/arrow-left.svg' },
      ],
      { flatten: true },
    );
    expect(error?.message).toMatch(/Fix: rename one of the files$/);
  });

  it('does not depend on input order', () => {
    const expected = findCollisions(entries);
    expect(findCollisions(entries.toReversed())).toEqual(expected);
  });

  it('treats NFC and NFD paths of the same name as a collision and shows them as found', () => {
    const errors = findCollisions([
      { name: 'café', path: 'a/café.svg' },
      { name: 'café', path: `b/${'café'.normalize('NFD')}.svg` },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain('a/caf\u00e9.svg, b/cafe\u0301.svg');
  });

  it('returns nothing when names are unique', () => {
    expect(findCollisions([{ name: 'a', path: 'a.svg' }])).toEqual([]);
  });
});
