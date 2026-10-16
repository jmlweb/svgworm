import react from '@vitejs/plugin-react';
import { svgworm } from 'svgworm/vite';
import { defineConfig } from 'vite';

// The app mounted at /app/, as scripts/check-base.mjs builds it. A fixed `base` needs the
// matching `publicPath` in the svgworm config: the plugin never derives it, and fails the
// build when it is missing (ADR-0033).
export default defineConfig({
  base: '/app/',
  plugins: [react(), svgworm({ configFile: 'svgworm.base.config.json' })],
});
