import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// Content Signals (contentsignals.org): svgworm wants to be found and used by search engines
// and AI agents (AGENTS.md principle 10), so every category is allowed.
describe('robots.txt', () => {
  it('declares content signals for search, ai-input and ai-train', async () => {
    const robots = await readFile(
      new URL('../public/robots.txt', import.meta.url),
      'utf8',
    );
    expect(robots).toMatch(
      /^User-agent: \*\nContent-Signal: search=yes, ai-input=yes, ai-train=yes$/m,
    );
  });
});
