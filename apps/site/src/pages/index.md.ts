import type { APIRoute } from 'astro';

import { readLlmsTxt } from '../lib/llms-source';

// The homepage as markdown for agents (ADR-0032): llms.txt is already its summary.
export const GET: APIRoute = async () =>
  new Response(await readLlmsTxt(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
