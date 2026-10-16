// Markdown for agents (ADR-0032). wrangler.jsonc runs this Worker first only for the pages
// (`/`, `/docs`, `/docs/*`); everything else is served as a plain asset. A request that prefers
// text/markdown gets the page's prebuilt .md file, every other one the HTML page. Both come from
// the ASSETS binding, so the _headers rules (CSP, HSTS, the homepage Link) stay on them.

type AssetsBinding = {
  readonly fetch: (input: Request | URL | string) => Promise<Response>;
};

export type Env = { readonly ASSETS: AssetsBinding };

const MARKDOWN_TYPE = 'text/markdown; charset=utf-8';
const DOC_PATH = /^\/docs\/([a-z0-9-]+)\/?$/;

const qualityOf = (accept: string, type: string): number | undefined => {
  const range = accept
    .split(',')
    .map((part) => part.trim().split(';'))
    .find(([mediaType]) => mediaType?.trim().toLowerCase() === type);
  if (!range) return undefined;
  const q = range
    .slice(1)
    .map((parameter) => parameter.trim().split('='))
    .find(([name]) => name?.toLowerCase() === 'q')?.[1];
  const value = q === undefined ? 1 : Number(q);
  return Number.isNaN(value) ? 0 : value;
};

/** True when Accept names text/markdown with q > 0 and at least the q of text/html. */
export const prefersMarkdown = (accept: string): boolean => {
  const markdown = qualityOf(accept, 'text/markdown') ?? 0;
  return markdown > 0 && markdown >= (qualityOf(accept, 'text/html') ?? 0);
};

/** The prebuilt markdown file for a page path, or undefined for anything that is not a page. */
export const markdownPathFor = (pathname: string): string | undefined => {
  if (pathname === '/') return '/index.md';
  if (pathname === '/docs' || pathname === '/docs/') return '/docs.md';
  const slug = DOC_PATH.exec(pathname)?.[1];
  return slug ? `/docs/${slug}.md` : undefined;
};

const withHeaders = (
  response: Response,
  headers: Readonly<Record<string, string>>,
): Response => {
  const copy = new Response(response.body, response);
  for (const [name, value] of Object.entries(headers))
    copy.headers.set(name, value);
  return copy;
};

// Workers load the module's default export, so this file is the one exception to named exports.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const markdownPath = markdownPathFor(url.pathname);
    if (!markdownPath) return env.ASSETS.fetch(request);

    const isRead = request.method === 'GET' || request.method === 'HEAD';
    if (isRead && prefersMarkdown(request.headers.get('Accept') ?? '')) {
      const markdown = await env.ASSETS.fetch(new URL(markdownPath, url));
      if (markdown.ok)
        return withHeaders(markdown, {
          'Content-Type': MARKDOWN_TYPE,
          Vary: 'Accept',
        });
    }
    return withHeaders(await env.ASSETS.fetch(request), { Vary: 'Accept' });
  },
};
