import react from '@vitejs/plugin-react';
import { svgworm } from 'svgworm/vite';
import { defineConfig } from 'vite';

// svgworm builds before `vite build` and rebuilds on icon changes in `vite dev` (ADR-0033).
// `base` stays a CLI flag (`vite build --base /app/`) so one config serves every mount point;
// the plugin prefixes it to the sprite URLs, so svgworm needs no matching --public-path.
export default defineConfig({
  plugins: [react(), svgworm()],
});
