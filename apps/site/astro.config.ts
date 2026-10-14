import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// No @astrojs/react: Astro always emits a renderer's client entrypoint, which would put
// React's client runtime in dist/ (ADR-0016, LRN-033). Icons come from the generated
// src/components/Icon.astro (ADR-0017), so the page needs no React at all.
export default defineConfig({
  site: 'https://svgworm.com',
  output: 'static',
  // Inline the small stylesheet: one request fewer.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
});
