import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// RFC 9727 API catalog for automated discovery. svgworm has no HTTP API, so the catalog
// describes the package through its config JSON Schema and its docs, and has no status link.
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));

type Target = { href: string; type?: string };
type Entry = { anchor: string } & Record<string, unknown>;

const readCatalog = async () =>
  JSON.parse(await readFile(`${publicDir}.well-known/api-catalog`, 'utf8')) as {
    linkset: Entry[];
  };

const isAbsolute = (url: string) => url.startsWith('https://');

describe('api-catalog', () => {
  it('is a linkset with an absolute anchor per entry', async () => {
    const { linkset } = await readCatalog();
    expect(linkset.length).toBeGreaterThan(0);
    for (const entry of linkset) expect(isAbsolute(entry.anchor)).toBe(true);
  });

  it('links each entry to a service-desc and a service-doc as target arrays', async () => {
    const { linkset } = await readCatalog();
    for (const entry of linkset) {
      for (const relation of ['service-desc', 'service-doc']) {
        const targets = entry[relation] as Target[];
        expect(Array.isArray(targets)).toBe(true);
        expect(targets.length).toBeGreaterThan(0);
        for (const { href } of targets) expect(isAbsolute(href)).toBe(true);
      }
    }
  });

  it('is served as application/linkset+json', async () => {
    const headers = await readFile(`${publicDir}_headers`, 'utf8');
    expect(headers).toMatch(
      /^\/\.well-known\/api-catalog\n\s+Content-Type: application\/linkset\+json$/m,
    );
  });
});

describe('homepage Link header', () => {
  it('points agents at the catalog, schema, docs and llms.txt (RFC 8288)', async () => {
    const headers = await readFile(`${publicDir}_headers`, 'utf8');
    const block = /^\/\n((?:\s+.+\n?)+)/m.exec(headers)?.[1] ?? '';
    const link = /^\s+Link: (.+)$/m.exec(block)?.[1] ?? '';
    for (const rel of [
      'api-catalog',
      'service-desc',
      'service-doc',
      'describedby',
    ])
      expect(link).toContain(`rel="${rel}"`);
  });
});
