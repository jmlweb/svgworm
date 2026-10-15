import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { emitLoader } from './loader.ts';
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

const injectDir = fileURLToPath(
  new URL('../__snapshots__/inject/', import.meta.url),
);
const injected: ManifestInput = {
  ...input,
  sprite: toFileReference(
    'icons.d907d82b.svg',
    'https://cdn.example.com/icons',
  ),
  stack: toFileReference(
    'icons.stack.91bff0b3.svg',
    'https://cdn.example.com/icons',
  ),
  inject: {
    spriteIntegrity: 'sha384-SPRITE',
    loader: {
      ...toFileReference(
        'icons.loader.0a1b2c3d.js',
        'https://cdn.example.com/icons',
      ),
      integrity: 'sha384-LOADER',
    },
  },
};

describe('emit: crossOrigin inject (ADR-0027)', () => {
  it('writes a version 2 manifest with integrity and the loader', async () => {
    const json = emitManifestJson(injected);
    await expect(json).toMatchFileSnapshot(`${injectDir}manifest.json`);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      version: 2,
      crossOrigin: 'inject',
      sprites: {
        icons: {
          sprite: { integrity: 'sha384-SPRITE' },
          stack: {
            url: 'https://cdn.example.com/icons/icons.stack.91bff0b3.svg',
          },
          loader: {
            file: 'icons.loader.0a1b2c3d.js',
            integrity: 'sha384-LOADER',
          },
        },
      },
    });
  });

  it('writes the same object in icons.js', () => {
    const module = emitModule(injected);
    expect(module).toContain('"version": 2');
    expect(module).toContain('"loader": {');
  });

  it('writes a null loader when no icon is in the sprite', () => {
    const json = emitManifestJson({
      ...injected,
      sprite: null,
      inject: { spriteIntegrity: null, loader: null },
    });
    expect(json).toContain('"sprite": null');
    expect(json).toContain('"loader": null');
  });

  it('types version 2 and the new fields', async () => {
    const types = emitTypes(
      input.icons.map((icon) => icon.name),
      { crossOrigin: 'inject' },
    );
    await expect(types).toMatchFileSnapshot(`${injectDir}icons.d.ts`);
    expect(types).toContain('readonly version: 2;');
    expect(types).toContain("readonly crossOrigin: 'inject';");
  });

  it('keeps default-mode types byte-identical', () => {
    expect(
      emitTypes(
        input.icons.map((icon) => icon.name),
        { crossOrigin: 'none' },
      ),
    ).toBe(sample('icons.d.ts'));
  });

  it('writes a loader with the sprite url and integrity baked in', async () => {
    const loader = emitLoader(
      'https://cdn.example.com/icons/icons.d907d82b.svg',
      'sha384-SPRITE',
    );
    await expect(loader).toMatchFileSnapshot(`${injectDir}loader.js`);
    expect(loader).toContain(
      '"https://cdn.example.com/icons/icons.d907d82b.svg"',
    );
    expect(loader).toContain('"sha384-SPRITE"');
    expect(loader.endsWith(';\n')).toBe(true);
    expect(loader).not.toContain('\r');
    expect(new TextEncoder().encode(loader).byteLength).toBeLessThan(2500);
  });
});
