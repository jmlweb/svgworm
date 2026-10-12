import { describe, expect, it } from 'vitest';

import type { BuildEvent } from '../events.ts';

import { compile, type SourceInput } from '../compile.ts';
import { createTransformCache } from './cache.ts';

const svg = (d: string): Uint8Array =>
  new TextEncoder().encode(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}"/></svg>`,
  );

const source = (name: string, d = 'M0 0h24v24H0z'): SourceInput => ({
  path: `icons/${name}.svg`,
  relativePath: `${name}.svg`,
  content: svg(d),
});

const options = { flatten: false, publicPath: '/icons', color: [] };

const cachedNames = (events: readonly BuildEvent[]): readonly string[] =>
  events.flatMap((event) =>
    event.type === 'icon' && event.fromCache ? [event.name] : [],
  );

describe('transform cache (ADR-0015)', () => {
  it('reuses transforms for unchanged content and gives byte-identical output', () => {
    const cache = createTransformCache();
    const sources = [source('a'), source('b', 'M1 1h10v10z')];
    const first = compile(sources, { ...options, cache });
    const events: BuildEvent[] = [];
    const second = compile(sources, { ...options, cache }, (event) =>
      events.push(event),
    );
    if (!first.ok || !second.ok) throw new Error('compile failed');
    expect(cachedNames(events)).toEqual(['a', 'b']);
    expect(second.files).toEqual(first.files);
    expect(cache.size()).toBe(2);
  });

  it('re-transforms a changed file, keeps the others, and drops entries of removed files', () => {
    const cache = createTransformCache();
    compile([source('a'), source('b'), source('c')], { ...options, cache });
    const events: BuildEvent[] = [];
    const result = compile(
      [source('a'), source('b', 'M2 2h5v5z')],
      { ...options, cache },
      (event) => events.push(event),
    );
    expect(result.ok).toBe(true);
    expect(cachedNames(events)).toEqual(['a']);
    // a, new b; c and the old b were swept.
    expect(cache.size()).toBe(2);
  });

  it('keys on the color mode and the name, not only on the bytes', () => {
    const cache = createTransformCache();
    compile([source('a')], { ...options, cache });
    const events: BuildEvent[] = [];
    compile(
      [source('a')],
      { ...options, color: [{ match: 'a', color: 'preserve' }], cache },
      (event) => events.push(event),
    );
    expect(cachedNames(events)).toEqual([]);
    const renamed: BuildEvent[] = [];
    compile(
      [{ ...source('a'), path: 'icons/b.svg', relativePath: 'b.svg' }],
      {
        ...options,
        cache,
      },
      (event) => renamed.push(event),
    );
    expect(cachedNames(renamed)).toEqual([]);
  });

  it('caches failures too, so a broken file is not re-parsed on every rebuild', () => {
    const cache = createTransformCache();
    const broken: SourceInput = {
      path: 'icons/x.svg',
      relativePath: 'x.svg',
      content: new TextEncoder().encode('<svg'),
    };
    const first = compile([broken], { ...options, cache });
    const second = compile([broken], { ...options, cache });
    expect(first.ok).toBe(false);
    expect(second).toEqual(first);
    expect(cache.size()).toBe(1);
  });

  it('never reports fromCache without a cache', () => {
    const events: BuildEvent[] = [];
    compile([source('a')], options, (event) => events.push(event));
    compile([source('a')], options, (event) => events.push(event));
    expect(cachedNames(events)).toEqual([]);
  });
});
