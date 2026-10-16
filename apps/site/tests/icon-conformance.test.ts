import { createIcon } from '@svgworm/react';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { astroComponentContent } from '../../../packages/svgworm/src/cli/init/plan.ts';
import { normalize } from '../../../tests/conformance/normalize.ts';

// The Icon.astro that `svgworm init` writes today (ADR-0017) must render what createIcon
// renders. It comes from the template in plan.ts, not from a committed copy (RPT-008), and is
// written next to a fixture manifest with every delivery, because its manifest import is relative.
const generatedIcon = astroComponentContent(
  'src/components/Icon.astro',
  'svgworm',
);
const root = fileURLToPath(new URL('..', import.meta.url));
const scratch = join(root, 'tests/.generated');

type Component = Parameters<AstroContainer['renderToString']>[0];

let container: AstroContainer;
let AstroIcon: Component;
let ReactIcon: ReturnType<typeof createIcon>;

beforeAll(async () => {
  await rm(scratch, { recursive: true, force: true });
  await mkdir(join(scratch, 'src/components'), { recursive: true });
  await mkdir(join(scratch, 'svgworm'), { recursive: true });
  await writeFile(join(scratch, 'src/components/Icon.astro'), generatedIcon);
  await cp(
    join(root, 'tests/fixtures/icons.js'),
    join(scratch, 'svgworm/icons.js'),
  );
  const { manifest } = (await import(
    /* @vite-ignore */ pathToFileURL(join(scratch, 'svgworm/icons.js')).href
  )) as { manifest: Parameters<typeof createIcon>[0] };
  const module = (await import(
    /* @vite-ignore */ pathToFileURL(join(scratch, 'src/components/Icon.astro'))
      .href
  )) as { default: Component };
  AstroIcon = module.default;
  ReactIcon = createIcon(manifest);
  container = await AstroContainer.create();
});

afterAll(async () => {
  await rm(scratch, { recursive: true, force: true });
});

type Case = {
  readonly label: string;
  readonly name: string;
  readonly react: Record<string, unknown>;
  readonly astro: Record<string, unknown>;
};

const cases: readonly Case[] = [
  { label: 'use, defaults', name: 'home', react: {}, astro: {} },
  { label: 'use, other sprite', name: 'snail', react: {}, astro: {} },
  {
    label: 'use, title',
    name: 'home',
    react: { title: 'Home' },
    astro: { title: 'Home' },
  },
  {
    label: 'use, label, size, class and style',
    name: 'home',
    react: {
      label: 'Home',
      width: 32,
      height: 24,
      className: 'icon',
      style: { color: 'red' },
      'data-id': 'x',
    },
    astro: {
      label: 'Home',
      width: 32,
      height: 24,
      class: 'icon',
      style: 'color:red',
      'data-id': 'x',
    },
  },
  { label: 'use, viewBox origin not 0 0', name: 'flag', react: {}, astro: {} },
  { label: 'img, defaults', name: 'photo', react: {}, astro: {} },
  {
    label: 'img, label and class',
    name: 'photo',
    react: { label: 'Photo', className: 'icon' },
    astro: { label: 'Photo', class: 'icon' },
  },
  { label: 'mask, defaults', name: 'glyph', react: {}, astro: {} },
  {
    label: 'mask, title, size and style',
    name: 'glyph',
    react: { title: 'Glyph', width: 20, height: 20, style: { opacity: 0.5 } },
    astro: { title: 'Glyph', width: 20, height: 20, style: 'opacity:0.5' },
  },
  // Astro accepts object styles too (RPT-002): camelCase keys, bare numbers as px where
  // React adds them, unitless ones as they are, custom properties untouched.
  {
    label: 'mask, object style',
    name: 'glyph',
    react: {
      style: { opacity: 0.5, marginTop: 4, '--size': '2em', zIndex: 2 },
    },
    astro: {
      style: { opacity: 0.5, marginTop: 4, '--size': '2em', zIndex: 2 },
    },
  },
];

const renderAstro = (props: Record<string, unknown>) =>
  container.renderToString(AstroIcon, { props });

const renderReact = (props: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(ReactIcon as never, props));

describe("the site's Icon.astro", () => {
  it('is what svgworm init writes today', async () => {
    expect(
      await readFile(join(root, 'src/components/Icon.astro'), 'utf8'),
    ).toBe(generatedIcon);
  });
});

describe('Icon.astro matches createIcon', () => {
  it.each(cases)('$label', async ({ name, react, astro }) => {
    expect(normalize(await renderAstro({ name, ...astro }))).toBe(
      normalize(renderReact({ name, ...react })),
    );
  });

  it('keeps the contract the normalizer must not hide', async () => {
    const html = await renderAstro({ name: 'home' });
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain('href="/icons/icons.1a2b3c4d.svg#home-9c8d"');
    expect(html).not.toContain('<script');
  });

  it('gives the svg only the viewBox size; the symbol keeps the origin (ADR-0030)', async () => {
    expect(await renderAstro({ name: 'flag' })).toContain(
      'viewBox="0 0 512 341.333"',
    );
  });

  it.each(['nope', 'constructor'])(
    'throws on the unknown name "%s"',
    async (name) => {
      await expect(renderAstro({ name })).rejects.toThrow(/Unknown icon/);
      expect(() => renderReact({ name })).toThrow(/Unknown icon/);
    },
  );

  it('throws when the delivery needs a file the manifest lacks', async () => {
    await expect(renderAstro({ name: 'broken' })).rejects.toThrow(/stack file/);
    expect(() => renderReact({ name: 'broken' })).toThrow(/stack file/);
  });
});
