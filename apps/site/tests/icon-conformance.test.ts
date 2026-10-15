import { createIcon } from '@svgworm/react';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// The generated src/components/Icon.astro (ADR-0017) must render what createIcon renders.
// It is copied next to a fixture manifest with every delivery, because its manifest import is relative.
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
  await cp(
    join(root, 'src/components/Icon.astro'),
    join(scratch, 'src/components/Icon.astro'),
  );
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

const decode = (value: string): string =>
  value
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');

const normalizeStyle = (style: string): string =>
  decode(style)
    .split(';')
    .map((declaration) => declaration.replace(/\s*:\s*/, ':').trim())
    .filter((declaration) => declaration !== '')
    .toSorted()
    .join(';');

// Attribute order, entity style, self-closing slashes, whitespace and React 19's hoisted
// <link rel="preload"> (LRN-027) are not part of the contract; everything else is.
const normalize = (html: string): string =>
  html
    .replace(/<link rel="preload"[^>]*>/g, '')
    .replace(/<!--.*?-->/gs, '')
    // Dev-only attributes the Astro container adds to every element.
    .replace(/\sdata-astro-source-(?:file|loc)="[^"]*"/g, '')
    .replace(
      /<(\w+)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*\/?>/g,
      (_, tag: string, attrs: string) => {
        const pairs = [...attrs.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)]
          .map(
            ([, name = '', value = '']) =>
              [
                name,
                name === 'style' ? normalizeStyle(value) : decode(value),
              ] as const,
          )
          .toSorted(([a], [b]) => (a < b ? -1 : 1));
        return `<${tag}${pairs.map(([n, v]) => ` ${n}="${v}"`).join('')}>`;
      },
    )
    .replace(/>\s+</g, '><')
    .trim();

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
