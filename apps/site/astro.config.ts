import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// No @astrojs/react: Astro always emits a renderer's client entrypoint, which would put
// React's client runtime in dist/ (ADR-0016, LRN-033). Icons come from the generated
// src/components/Icon.astro (ADR-0017), so the page needs no React at all.
export default defineConfig({
  site: 'https://svgworm.com',
  output: 'static',
  // The stylesheet is about 25 KB and the docs are nine pages (TSK-052): as a hashed file under
  // /_astro/ it is fetched once and served immutable (public/_headers), instead of travelling
  // inline with every page. The first visit pays one same-origin request, which HTTP/2 makes
  // cheap; every docs navigation after it saves the 25 KB. 'auto' keeps inlining anything
  // under 4 KB.
  build: { inlineStylesheets: 'auto' },
  integrations: [sitemap()],
  // Shiki colors come from --astro-code-* custom properties (global.css), so docs code blocks
  // share the landing page's terminal palette instead of a stock theme.
  markdown: { shikiConfig: { theme: 'css-variables' } },
});
