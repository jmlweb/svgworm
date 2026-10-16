import { describe, expect, it } from 'vitest';

import worker, { markdownPathFor, prefersMarkdown } from '../worker/index';

// ADR-0032: pages answer `Accept: text/markdown` with their prebuilt .md file.
describe('prefersMarkdown', () => {
  it.each([
    ['text/markdown', true],
    ['text/markdown, text/html', true],
    ['text/html;q=0.9, text/markdown', true],
    ['text/html, text/markdown;q=0.5', false],
    ['text/markdown;q=0', false],
    ['text/html,application/xhtml+xml,*/*;q=0.8', false],
    ['*/*', false],
    ['', false],
  ])('%j → %s', (accept, expected) => {
    expect(prefersMarkdown(accept)).toBe(expected);
  });
});

describe('markdownPathFor', () => {
  it.each([
    ['/', '/index.md'],
    ['/docs', '/docs.md'],
    ['/docs/', '/docs.md'],
    ['/docs/cli', '/docs/cli.md'],
    ['/docs/cli/', '/docs/cli.md'],
    ['/docs/cli/extra', undefined],
    ['/docs/../_headers', undefined],
    ['/icons/sprite.svg', undefined],
  ])('%s → %s', (pathname, expected) => {
    expect(markdownPathFor(pathname)).toBe(expected);
  });
});

const assets = {
  '/index.md': '# svgworm\n',
  '/docs/cli/': '<!doctype html><title>CLI</title>',
  '/docs/cli.md': '# CLI reference\n',
} as Record<string, string>;

// Stands in for the ASSETS binding: serves the map above, with the header a _headers rule adds.
const env = {
  ASSETS: {
    fetch: (input: Request | URL | string) => {
      const { pathname } = new URL(
        input instanceof Request ? input.url : input,
      );
      const body = assets[pathname];
      return Promise.resolve(
        body === undefined
          ? new Response('not found', { status: 404 })
          : new Response(body, {
              headers: {
                'Content-Type': pathname.endsWith('.md')
                  ? 'application/octet-stream'
                  : 'text/html; charset=utf-8',
                'Content-Security-Policy': "default-src 'self'",
              },
            }),
      );
    },
  },
};

const get = (path: string, accept: string, method = 'GET') =>
  worker.fetch(
    new Request(`https://svgworm.com${path}`, {
      method,
      headers: { Accept: accept },
    }),
    env,
  );

describe('worker', () => {
  it('serves the markdown file as text/markdown, keeping asset headers', async () => {
    const response = await get('/docs/cli/', 'text/markdown');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'text/markdown; charset=utf-8',
    );
    expect(response.headers.get('Vary')).toBe('Accept');
    expect(response.headers.get('Content-Security-Policy')).toBe(
      "default-src 'self'",
    );
    expect(await response.text()).toBe('# CLI reference\n');
  });

  it('serves the homepage markdown', async () => {
    expect(await (await get('/', 'text/markdown')).text()).toBe('# svgworm\n');
  });

  it('keeps HTML for browsers, with Vary: Accept', async () => {
    const response = await get('/docs/cli/', 'text/html,*/*;q=0.8');
    expect(response.headers.get('Content-Type')).toBe(
      'text/html; charset=utf-8',
    );
    expect(response.headers.get('Vary')).toBe('Accept');
    expect(await response.text()).toContain('<title>CLI</title>');
  });

  it('falls back to HTML when a page has no markdown file', async () => {
    const response = await get('/docs/nope/', 'text/markdown');
    expect(response.status).toBe(404);
  });

  it('only negotiates GET and HEAD', async () => {
    const response = await get('/docs/cli/', 'text/markdown', 'POST');
    expect(response.headers.get('Content-Type')).toBe(
      'text/html; charset=utf-8',
    );
  });
});
