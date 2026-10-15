import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import {
  configSchema,
  getConfigJsonSchema,
  normalizePublicPath,
} from './schema.ts';

const parse = (input: unknown) => configSchema.safeParse(input);

describe('configSchema: sources', () => {
  it('accepts a folder as a string or as { dir, include, exclude }', () => {
    expect(
      parse({
        sources: [
          'icons',
          {
            dir: 'node_modules/lucide-static/icons',
            include: ['house.svg', 'arrow-*.svg'],
            exclude: ['arrow-big-*.svg'],
          },
        ],
      }).success,
    ).toBe(true);
  });

  it.each([
    [{ sources: [{ include: ['a.svg'] }] }, 'dir'],
    [{ sources: [{ dir: 'icons', include: 'a.svg' }] }, 'include'],
    [{ sources: [{ dir: 'icons', include: [] }] }, 'include'],
    [{ sources: [{ dir: 'icons', glob: ['a.svg'] }] }, 'glob'],
  ])('rejects %j', (input, key) => {
    const result = parse(input);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain(key);
  });
});

describe('normalizePublicPath', () => {
  it.each([
    ['/icons', '/icons'],
    ['/icons/', '/icons'],
    ['/docs/icons', '/docs/icons'],
    ['/', ''],
    ['/a-b_c/d.e', '/a-b_c/d.e'],
  ])('accepts %s as %j', (input, expected) => {
    expect(normalizePublicPath(input)).toEqual({ ok: true, value: expected });
  });

  it.each([
    'icons',
    './icons',
    '//cdn.example.com/icons',
    'https://cdn.example.com/icons',
    'http://x/icons',
    '/a//b',
    '//',
    '/a/./b',
    '/a/../b',
    '/a?x=1',
    '/a#frag',
    '/a\\b',
    '/a b',
    '/a%20b',
    '/café',
    '',
  ])('rejects %j', (input) => {
    expect(normalizePublicPath(input)).toMatchObject({ ok: false });
  });
});

describe('configSchema', () => {
  it('accepts a minimal config', () => {
    expect(parse({ sources: ['icons'] }).success).toBe(true);
  });

  it('accepts a full config', () => {
    const result = parse({
      $schema: './node_modules/svgworm/config.schema.json',
      sources: ['icons', 'brand'],
      outDir: 'public/icons',
      publicPath: '/icons',
      moduleDir: 'svgworm',
      flatten: true,
      color: [{ match: 'brand/**', color: 'preserve' }],
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['no sources', {}],
    ['empty sources', { sources: [] }],
    ['empty source string', { sources: [''] }],
    ['unknown key', { sources: ['a'], outDirr: 'x' }],
    ['wrong type', { sources: 'icons' }],
    [
      'bad color mode',
      { sources: ['a'], color: [{ match: 'a', color: 'red' }] },
    ],
    ['empty match', { sources: ['a'], color: [{ match: '', color: 'mono' }] }],
    ['bad publicPath', { sources: ['a'], publicPath: 'icons' }],
    ['not an object', 'sources'],
  ])('rejects %s', (_label, input) => {
    expect(parse(input).success).toBe(false);
  });

  it('names the offending key in the error path', () => {
    const result = parse({ sources: ['a'], publicPath: 'https://x/y' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['publicPath']);
  });
});

describe('published JSON Schema', () => {
  it('matches the committed svgworm.schema.json (run pnpm schema:generate)', async () => {
    const committed = await readFile(
      new URL('../../../svgworm.schema.json', import.meta.url),
      'utf8',
    );
    expect(JSON.parse(committed)).toEqual(getConfigJsonSchema());
  });

  it('accepts a minimal config and rejects unknown keys', () => {
    const schema = getConfigJsonSchema() as {
      required: string[];
      additionalProperties: boolean;
    };
    expect(schema.required).toEqual(['sources']);
    expect(schema.additionalProperties).toBe(false);
  });
});
