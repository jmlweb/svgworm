import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// The worked example (TSK-104) must show the committed files as they are, never a hand copy.
// The test reads them on its own, so a helper that drifts from the files cannot pass it.
const root = fileURLToPath(new URL('..', import.meta.url));

type ManifestEntry = { readonly id: string };
type Manifest = {
  readonly sprites: Record<
    string,
    { readonly stack: { readonly file: string } | null }
  >;
  readonly icons: Record<string, ManifestEntry & { readonly sprite: string }>;
};

type Component = Parameters<AstroContainer['renderToString']>[0];

const name = 'proof/agate';
// Stands in for the real <Icon> the landing page passes through the slot.
const rendered = '<img alt src="/icons/x.stack.svg#i-proof--agate">';

const unescapeHtml = (html: string) =>
  html
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&amp;', '&');

const codeBlocks = (html: string) =>
  [...html.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/g)].map(([, body]) =>
    unescapeHtml(body ?? ''),
  );

let html: string;
let source: string;
let stack: string;
let manifest: Manifest;
let previousCwd: string;

beforeAll(async () => {
  // The component reads from the site root, where Astro builds run. The root `pnpm test`
  // runs from the repo root, so move there for the render and back afterwards.
  previousCwd = process.cwd();
  process.chdir(root);
  source = await readFile(join(root, `icons/${name}.svg`), 'utf8');
  manifest = JSON.parse(
    await readFile(join(root, 'svgworm/manifest.json'), 'utf8'),
  ) as Manifest;
  const group = manifest.icons[name]?.sprite ?? '';
  const file = manifest.sprites[group]?.stack?.file ?? '';
  stack = await readFile(join(root, 'public/icons', file), 'utf8');
  // Imported dynamically and typed by hand: type-aware lint cannot see .astro types.
  const { default: WorkedExample } =
    (await import('../src/components/WorkedExample.astro')) as {
      default: Component;
    };
  const container = await AstroContainer.create();
  html = await container.renderToString(WorkedExample, {
    slots: { default: rendered },
  });
});

afterAll(() => {
  process.chdir(previousCwd);
});

describe('the worked example', () => {
  it('shows the raw source file as committed', () => {
    expect(codeBlocks(html)).toContain(source.trimEnd());
  });

  it('shows the entry from the built stack file, found by its manifest id', () => {
    const id = manifest.icons[name]?.id ?? '';
    const entry = codeBlocks(html).find((block) =>
      block.startsWith(`<svg id="${id}"`),
    );
    expect(entry).toBeDefined();
    expect(entry?.endsWith('</svg>')).toBe(true);
    expect(stack).toContain(entry);
  });

  it('shows the manifest entry as committed', () => {
    const shown = codeBlocks(html).find((block) =>
      block.startsWith(`"${name}": `),
    );
    expect(shown).toBe(
      `"${name}": ${JSON.stringify(manifest.icons[name], null, 2)}`,
    );
  });

  it('prints the markup the page rendered, and shows that same element', () => {
    expect(codeBlocks(html).at(-1)).toBe(
      `<Icon name="${name}" />\n// ${rendered}`,
    );
    expect(html).toContain(rendered);
  });

  it('labels every step with who writes it', () => {
    const labels = [
      ...html.matchAll(/class="step-label[^"]*"[^>]*>([^<]+)</g),
    ].map(([, label]) => label);
    expect(labels).toEqual([
      'you write',
      'svgworm generates',
      'svgworm generates',
      'you write',
    ]);
  });

  it('folds long blocks in <details> and needs no script', () => {
    expect(html).toContain('<details');
    expect(html).not.toContain('<script');
  });
});
