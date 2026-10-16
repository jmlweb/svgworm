import react from '@vitejs/plugin-react';
import { svgworm } from 'svgworm/vite';
import { defineConfig } from 'vite';

// svgworm builds before `vite build` and rebuilds on icon changes in `vite dev` (ADR-0033).
// The app is served at `/`. A fixed `base` needs the matching `publicPath` in the svgworm
// config, or the plugin fails the build: see vite.base.config.ts.
export default defineConfig({
  plugins: [react(), svgworm()],
});
