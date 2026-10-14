import { defineConfig } from 'astro/config';

// No @astrojs/react: Astro always emits a renderer's client entrypoint, which would put
// React's client runtime in dist/ (ADR-0016). The page renders React with react-dom/server.
export default defineConfig({
  site: 'https://svgworm.jmlweb.workers.dev',
  output: 'static',
  // Inline the small stylesheet: one request fewer.
  build: { inlineStylesheets: 'always' },
});
