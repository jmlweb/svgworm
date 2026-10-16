import type { APIRoute } from 'astro';

import { getCollection } from 'astro:content';

// /docs as markdown for agents (ADR-0032): every doc page with its description, in `order`.
export const GET: APIRoute = async ({ site }) => {
  const docs = (await getCollection('docs')).toSorted(
    (a, b) => a.data.order - b.data.order,
  );
  const list = docs.map(
    (doc) =>
      `- [${doc.data.title}](${new URL(`/docs/${doc.id}`, site).href}): ${doc.data.description}`,
  );
  return new Response(
    `# svgworm docs\n\n> Guides and reference for svgworm, typed SVG sprites for Next.js, Vite and Astro.\n\n${list.join('\n')}\n`,
    { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } },
  );
};
