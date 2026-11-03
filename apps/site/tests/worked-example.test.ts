import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

// The worked example (TSK-104) must show the committed files as they are, never a hand copy.
// The test reads them on its own, so a helper that drifts from the files cannot pass it.
const root = fileURLToPath(new URL('..', import.meta.url));

type ManifestEntry = { readonly id: string };
type Manifest = {
  readonly sprites: Record<
    string,
    { readonly sprite: { readonly file: string } | null }
  >;
  readonly icons: Record<string, ManifestEntry & { readonly sprite: string }>;
};

type Component = Parameters<AstroContainer['renderToString']>[0];

const terminalComment = '// <svg><use href="/icons/x.svg#i-terminal"/></svg>';

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
let sprite: string;
let manifest: Manifest;

beforeAll(async () => {
  source = await readFile(join(root, 'icons/terminal.svg'), 'utf8');
  manifest = JSON.parse(
    await readFile(join(root, 'svgworm/manifest.json'), 'utf8'),
  ) as Manifest;
  const group = manifest.icons.terminal?.sprite ?? '';
  const file = manifest.sprites[group]?.sprite?.file ?? '';
  sprite = await readFile(join(root, 'public/icons', file), 'utf8');
  // Imported dynamically and typed by hand: type-aware lint cannot see .astro types.
  const { default: WorkedExample } =
    (await import('../src/components/WorkedExample.astro')) as {
      default: Component;
    };
  const container = await AstroContainer.create();
  html = await container.renderToString(WorkedExample, {
    props: { terminalComment },
  });
});

describe('the worked example', () => {
  it('shows the raw icons/terminal.svg as committed', () => {
    expect(codeBlocks(html)).toContain(source.trimEnd());
  });

  it('shows the terminal <symbol> from the built sprite, found by its manifest id', () => {
    const id = manifest.icons.terminal?.id ?? '';
    const symbol = codeBlocks(html).find((block) =>
      block.startsWith(`<symbol id="${id}"`),
    );
    expect(symbol).toBeDefined();
    expect(symbol?.endsWith('</symbol>')).toBe(true);
    expect(sprite).toContain(symbol);
  });

  it('shows manifest.icons.terminal as committed', () => {
    const shown = codeBlocks(html).find((block) =>
      block.startsWith('"terminal": '),
    );
    expect(shown).toBe(
      `"terminal": ${JSON.stringify(manifest.icons.terminal, null, 2)}`,
    );
  });

  it('ends with the Icon usage and the markup it renders', () => {
    expect(codeBlocks(html).at(-1)).toBe(
      `<Icon name="terminal" />\n${terminalComment}`,
    );
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
