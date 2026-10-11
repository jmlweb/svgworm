import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { toFileReference, type ManifestInput } from './manifest.ts';
import { emitManifestJson, emitModule, emitTypes } from './module.ts';

const sample = (name: string): string =>
  readFileSync(
    new URL(
      `../../../../../docs/samples/output-contract-v0.1/svgworm/${name}`,
      import.meta.url,
    ),
    'utf8',
  );

const input: ManifestInput = {
  sprite: toFileReference('icons.d907d82b.svg', '/icons'),
  stack: toFileReference('icons.stack.91bff0b3.svg', '/icons'),
  icons: [
    {
      name: 'brand/sunset',
      id: 'i-brand--sunset',
      viewBox: '0 0 24 24',
      color: 'multicolor',
      delivery: 'img',
    },
    {
      name: 'café',
      id: 'i-caf_e9_',
      viewBox: '0 0 24 24',
      color: 'mono',
      delivery: 'mask',
    },
    {
      name: 'home',
      id: 'i-home',
      viewBox: '0 0 24 24',
      color: 'mono',
      delivery: 'use',
    },
    {
      name: 'ui/check',
      id: 'i-ui--check',
      viewBox: '0 0 24 24',
      color: 'mono',
      delivery: 'use',
    },
  ],
};

describe('emit', () => {
  it('writes manifest.json exactly like the contract sample', () => {
    expect(emitManifestJson(input)).toBe(sample('manifest.json'));
  });

  it('writes icons.js exactly like the contract sample', () => {
    expect(emitModule(input)).toBe(sample('icons.js'));
  });

  it('writes icons.d.ts exactly like the contract sample', () => {
    expect(emitTypes(input.icons.map((icon) => icon.name))).toBe(
      sample('icons.d.ts'),
    );
  });

  it('keeps the caller order for integer-like names', () => {
    const json = emitManifestJson({
      ...input,
      icons: ['10', '2', 'a'].map((name) => ({
        name,
        id: 'i-x',
        viewBox: '0 0 1 1',
        color: 'mono' as const,
        delivery: 'use' as const,
      })),
    });
    expect(json.indexOf('"10"')).toBeLessThan(json.indexOf('"2"'));
    expect(json.indexOf('"2"')).toBeLessThan(json.indexOf('"a"'));
  });

  it('writes null for a file that has no icons', () => {
    const json = emitManifestJson({ ...input, stack: null });
    expect(json).toContain('"stack": null');
  });

  it('is valid JSON with LF endings and one trailing newline', () => {
    const json = emitManifestJson(input);
    expect(() => {
      JSON.parse(json);
    }).not.toThrow();
    expect(json.endsWith('}\n')).toBe(true);
    expect(json).not.toContain('\r');
  });

  it('builds urls from the normalized public path', () => {
    expect(toFileReference('a.svg', '').url).toBe('/a.svg');
    expect(toFileReference('a.svg', '/docs/icons').url).toBe(
      '/docs/icons/a.svg',
    );
  });
});
