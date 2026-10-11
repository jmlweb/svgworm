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
      'name "close" is produced by 3 files: icons/a/close.svg, icons/b/close.svg, other/close.svg',
    );
  });

  it('does not depend on input order', () => {
    const expected = findCollisions(entries);
    expect(findCollisions(entries.toReversed())).toEqual(expected);
  });

  it('treats NFC and NFD paths of the same name as a collision', () => {
    const errors = findCollisions([
      { name: 'café', path: 'a/café.svg' },
      { name: 'café', path: 'b/café.svg' },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain('a/café.svg, b/café.svg');
  });

  it('returns nothing when names are unique', () => {
    expect(findCollisions([{ name: 'a', path: 'a.svg' }])).toEqual([]);
  });
});
