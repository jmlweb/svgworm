import { describe, expect, it, vi } from 'vitest';

import {
  type ModelContext,
  type ModelContextTool,
  findModelContext,
  registerSiteTools,
  searchSections,
  splitSections,
} from '../src/lib/webmcp';

const docs = [
  { slug: 'nextjs', title: 'Next.js', description: 'Set up in Next.js.' },
  { slug: 'cli', title: 'CLI', description: 'Every command and flag.' },
];

// The same shape src/pages/llms-full.txt.ts builds: the llms.txt index, then one section per
// doc, joined by horizontal rules. The CLI body has a rule of its own on purpose.
const llmsFull = [
  '# svgworm\n\n> Typed SVG sprites.',
  '# Next.js\n\nSource: https://svgworm.com/docs/nextjs\n\nRun `svgworm init` in a Next.js app.',
  '# CLI\n\nSource: https://svgworm.com/docs/cli\n\nThe `watch` command rebuilds on change.',
  'More about exit codes after a rule.',
].join('\n\n---\n\n');

type Result = { content: [{ type: 'text'; text: string }] };

const parse = (result: unknown) =>
  JSON.parse((result as Result).content[0].text) as unknown;

const fakeContext = () => {
  const tools = new Map<string, ModelContextTool>();
  const signals: AbortSignal[] = [];
  const context: ModelContext = {
    registerTool: (tool, options) => {
      tools.set(tool.name, tool);
      if (options?.signal) signals.push(options.signal);
    },
  };
  return { context, tools, signals };
};

const setup = async () => {
  const { context, tools, signals } = fakeContext();
  const controller = new AbortController();
  const fetchText = vi.fn(() => Promise.resolve(llmsFull));
  const navigate = vi.fn();
  await registerSiteTools(context, docs, {
    origin: 'https://preview.example',
    signal: controller.signal,
    fetchText,
    navigate,
  });
  const run = (name: string, input: object = {}) =>
    tools.get(name)?.execute(input, { signal: controller.signal });
  return { tools, signals, controller, fetchText, navigate, run };
};

describe('splitSections', () => {
  it('maps each doc slug to its markdown, keeping rules inside a body', () => {
    const sections = splitSections(llmsFull);
    expect([...sections.keys()]).toEqual(['nextjs', 'cli']);
    expect(sections.get('cli')).toBe(
      'The `watch` command rebuilds on change.\n\n---\n\nMore about exit codes after a rule.',
    );
  });
});

describe('searchSections', () => {
  it('ranks title matches first and returns a snippet around the match', () => {
    const results = searchSections(
      docs,
      splitSections(llmsFull),
      'cli exit',
      5,
    );
    expect(results.map((result) => result.slug)).toEqual(['cli']);
    expect(results[0]?.snippet).toContain('exit codes');
  });

  it('returns nothing for a blank query', () => {
    expect(searchSections(docs, splitSections(llmsFull), '  ', 5)).toEqual([]);
  });
});

describe('findModelContext', () => {
  const registerTool = () => undefined;

  it('prefers document.modelContext (the spec) over navigator.modelContext', () => {
    const fromDocument = { registerTool };
    expect(
      findModelContext(
        { modelContext: fromDocument },
        { modelContext: { registerTool } },
      ),
    ).toBe(fromDocument);
  });

  it('falls back to navigator.modelContext and returns undefined without the API', () => {
    const fromNavigator = { registerTool };
    expect(findModelContext({}, { modelContext: fromNavigator })).toBe(
      fromNavigator,
    );
    expect(findModelContext({}, {})).toBeUndefined();
  });
});

describe('registerSiteTools', () => {
  it('registers the docs tools with JSON Schema inputs and one abort signal', async () => {
    const { tools, signals, controller } = await setup();
    expect([...tools.keys()]).toEqual([
      'list_docs',
      'get_doc',
      'search_docs',
      'open_doc',
    ]);
    for (const tool of tools.values()) {
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.inputSchema).toMatchObject({ type: 'object' });
    }
    expect(tools.get('get_doc')?.inputSchema).toMatchObject({
      properties: { slug: { enum: ['nextjs', 'cli'] } },
      required: ['slug'],
    });
    expect(signals).toHaveLength(4);
    expect(signals.every((signal) => signal === controller.signal)).toBe(true);
  });

  it('marks every tool but open_doc read-only', async () => {
    const { tools } = await setup();
    expect(
      [...tools.values()].map((tool) => [
        tool.name,
        tool.annotations?.readOnlyHint,
      ]),
    ).toEqual([
      ['list_docs', true],
      ['get_doc', true],
      ['search_docs', true],
      ['open_doc', false],
    ]);
  });

  it('lists docs with URLs on the current origin', async () => {
    const { run } = await setup();
    expect(parse(await run('list_docs'))).toEqual([
      { ...docs[0], url: 'https://preview.example/docs/nextjs' },
      { ...docs[1], url: 'https://preview.example/docs/cli' },
    ]);
  });

  it('reads one doc as markdown and fetches llms-full.txt once', async () => {
    const { run, fetchText } = await setup();
    await run('get_doc', { slug: 'cli' });
    expect(parse(await run('get_doc', { slug: 'nextjs' }))).toEqual({
      ...docs[0],
      url: 'https://preview.example/docs/nextjs',
      markdown: 'Run `svgworm init` in a Next.js app.',
    });
    expect(fetchText).toHaveBeenCalledOnce();
    expect(fetchText).toHaveBeenCalledWith('/llms-full.txt');
  });

  it('rejects an unknown slug', async () => {
    const { run } = await setup();
    await expect(run('get_doc', { slug: 'nope' })).rejects.toThrow(
      'Unknown doc "nope"',
    );
  });

  it('searches the docs', async () => {
    const { run } = await setup();
    expect(parse(await run('search_docs', { query: 'watch' }))).toEqual([
      expect.objectContaining({
        slug: 'cli',
        url: 'https://preview.example/docs/cli',
      }),
    ]);
  });

  it('navigates to a doc page', async () => {
    const { run, navigate } = await setup();
    await run('open_doc', { slug: 'cli' });
    expect(navigate).toHaveBeenCalledWith('https://preview.example/docs/cli');
  });
});
