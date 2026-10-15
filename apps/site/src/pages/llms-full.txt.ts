import type { APIRoute } from 'astro';

import { getCollection } from 'astro:content';

import { readLlmsTxt } from '../lib/llms-source';

// llms.txt plus the full text of every doc page, in `order`, for agents that want one fetch.
export const GET: APIRoute = async ({ site }) => {
  const docs = (await getCollection('docs')).toSorted(
    (a, b) => a.data.order - b.data.order,
  );
  const sections = docs.map(
    (doc) =>
      `# ${doc.data.title}\n\nSource: ${new URL(`/docs/${doc.id}`, site).href}\n\n${(doc.body ?? '').trim()}`,
  );
  const index = (await readLlmsTxt()).trim();
  return new Response([index, ...sections].join('\n\n---\n\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
