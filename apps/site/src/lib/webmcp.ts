// WebMCP (https://webmachinelearning.github.io/webmcp/): the docs as tools that an agent in the
// browser can call. Only the types this site uses are declared, because TypeScript has no lib
// for the API yet. The spec puts it on document.modelContext; Chrome's early preview used
// navigator.modelContext, so both are looked up.

export type ToolAnnotations = {
  readonly readOnlyHint?: boolean;
};

export type ModelContextTool = {
  readonly name: string;
  readonly title?: string;
  readonly description: string;
  readonly inputSchema: object;
  readonly annotations?: ToolAnnotations;
  readonly execute: (
    input: object,
    options: { readonly signal: AbortSignal },
  ) => Promise<unknown>;
};

export type ModelContext = {
  // Promise in the spec, synchronous in early Chrome builds.
  readonly registerTool: (
    tool: ModelContextTool,
    options?: { readonly signal?: AbortSignal },
  ) => unknown;
};

export type WithModelContext = { readonly modelContext?: ModelContext };

export type DocEntry = {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
};

export type SearchResult = DocEntry & { readonly snippet: string };

export type SiteToolsOptions = {
  /** Origin for doc URLs, so preview deployments link to themselves. */
  readonly origin: string;
  readonly signal: AbortSignal;
  readonly fetchText: (path: string) => Promise<string>;
  readonly navigate: (url: string) => void;
};

export class UnknownDocError extends Error {
  constructor(slug: string) {
    super(`Unknown doc "${slug}"`);
    this.name = 'UnknownDocError';
  }
}

export const findModelContext = (
  document: WithModelContext,
  navigator: WithModelContext,
): ModelContext | undefined => document.modelContext ?? navigator.modelContext;

const RULE = '\n\n---\n\n';
const SECTION_HEAD = /^# .+\n\nSource: \S*\/docs\/([^/\s]+)\/?\n\n/;

/**
 * Splits /llms-full.txt (src/pages/llms-full.txt.ts) into the markdown of each doc, by slug.
 * Sections are joined by horizontal rules, so a chunk without a section head is a rule inside
 * the previous doc's body.
 */
export const splitSections = (text: string): Map<string, string> => {
  const sections = new Map<string, string>();
  let current: string | undefined;
  for (const chunk of text.split(RULE)) {
    const head = SECTION_HEAD.exec(chunk);
    if (head?.[1]) {
      current = head[1];
      sections.set(current, chunk.slice(head[0].length));
    } else if (current) {
      sections.set(current, `${sections.get(current) ?? ''}${RULE}${chunk}`);
    }
  }
  return new Map(
    [...sections].map(([slug, body]) => [slug, body.trim()] as const),
  );
};

const SNIPPET_RADIUS = 120;

const snippetAround = (body: string, index: number): string => {
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(body.length, index + SNIPPET_RADIUS);
  return `${start > 0 ? '…' : ''}${body.slice(start, end).replaceAll(/\s+/g, ' ').trim()}${end < body.length ? '…' : ''}`;
};

const countOccurrences = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;

/** Case-insensitive term search; a title hit weighs more than a body hit. */
export const searchSections = (
  docs: readonly DocEntry[],
  sections: ReadonlyMap<string, string>,
  query: string,
  limit: number,
): SearchResult[] => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return docs
    .map((doc) => {
      const body = sections.get(doc.slug) ?? '';
      const title = doc.title.toLowerCase();
      const text = `${doc.description}\n${body}`.toLowerCase();
      const score = terms.reduce(
        (sum, term) =>
          sum +
          countOccurrences(title, term) * 10 +
          countOccurrences(text, term),
        0,
      );
      const firstHit = terms
        .map((term) => body.toLowerCase().indexOf(term))
        .filter((index) => index >= 0)
        .toSorted((a, b) => a - b)[0];
      const snippet =
        firstHit === undefined
          ? doc.description
          : snippetAround(body, firstHit);
      return { doc, score, snippet };
    })
    .filter(({ score }) => score > 0)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc, snippet }) => ({ ...doc, snippet }));
};

// MCP-style result: the spec serializes any value, and clients that follow MCP read content.
const textResult = (value: unknown) => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
});

export const registerSiteTools = async (
  context: ModelContext,
  docs: readonly DocEntry[],
  { origin, signal, fetchText, navigate }: SiteToolsOptions,
): Promise<void> => {
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc] as const));
  const urlOf = (slug: string) => new URL(`/docs/${slug}`, origin).href;
  const withUrl = (doc: DocEntry) => ({ ...doc, url: urlOf(doc.slug) });
  const docOf = (slug: unknown) => {
    const doc = typeof slug === 'string' ? bySlug.get(slug) : undefined;
    if (!doc) throw new UnknownDocError(String(slug));
    return doc;
  };

  let sections: Promise<Map<string, string>> | undefined;
  const loadSections = () => {
    sections ??= fetchText('/llms-full.txt').then(splitSections);
    sections.catch(() => {
      sections = undefined;
    });
    return sections;
  };

  const slugInput = {
    type: 'object',
    properties: {
      slug: {
        type: 'string',
        enum: docs.map((doc) => doc.slug),
        description: 'Doc slug, from list_docs.',
      },
    },
    required: ['slug'],
    additionalProperties: false,
  };

  const tools: ModelContextTool[] = [
    {
      name: 'list_docs',
      title: 'List svgworm docs',
      description:
        'List the svgworm documentation pages (setup guides for Next.js, Vite and Astro, the CLI, the config, troubleshooting) with their slug, title, description and URL.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => Promise.resolve(textResult(docs.map(withUrl))),
    },
    {
      name: 'get_doc',
      title: 'Read an svgworm doc',
      description:
        'Return the full markdown of one svgworm documentation page, by slug.',
      inputSchema: slugInput,
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const doc = docOf((input as { slug?: unknown }).slug);
        const markdown = (await loadSections()).get(doc.slug) ?? '';
        return textResult({ ...withUrl(doc), markdown });
      },
    },
    {
      name: 'search_docs',
      title: 'Search the svgworm docs',
      description:
        'Search the svgworm documentation for words (for example "crossOrigin", "watch", "Turbopack") and return the best matching pages with a snippet.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            minLength: 1,
            description: 'Words to find.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
            default: 5,
            description: 'Most results to return.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const { query, limit } = input as { query?: unknown; limit?: unknown };
        const results = searchSections(
          docs,
          await loadSections(),
          typeof query === 'string' ? query : '',
          typeof limit === 'number' ? Math.min(Math.max(limit, 1), 10) : 5,
        );
        return textResult(
          results.map((result) => ({ ...result, url: urlOf(result.slug) })),
        );
      },
    },
    {
      name: 'open_doc',
      title: 'Open an svgworm doc',
      description:
        'Navigate the browser tab to one svgworm documentation page, by slug.',
      inputSchema: slugInput,
      annotations: { readOnlyHint: false },
      execute: (input) => {
        const url = urlOf(docOf((input as { slug?: unknown }).slug).slug);
        navigate(url);
        return Promise.resolve(textResult({ opened: url }));
      },
    },
  ];

  await Promise.all(
    tools.map((tool) => context.registerTool(tool, { signal })),
  );
};
