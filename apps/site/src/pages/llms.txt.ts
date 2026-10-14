import type { APIRoute } from 'astro';

import { readLlmsTxt } from '../lib/llms-source';

export const GET: APIRoute = async () =>
  new Response(await readLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
