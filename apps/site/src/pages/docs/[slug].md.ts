import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';

import { getCollection } from 'astro:content';

// Each doc page as markdown for agents (ADR-0032), from the same source as its HTML page.
export const getStaticPaths = (async () =>
  (await getCollection('docs')).map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ entry: CollectionEntry<'docs'> }> = ({
  props: { entry },
  site,
}) =>
  new Response(
    `# ${entry.data.title}\n\n> ${entry.data.description}\n\nSource: ${new URL(`/docs/${entry.id}`, site).href}\n\n${(entry.body ?? '').trim()}\n`,
    { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } },
  );
