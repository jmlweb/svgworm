import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `base` stays a CLI flag (`vite build --base /app/`), so one config serves every mount point.
// svgworm needs the matching `--public-path /app/icons`; scripts/check-base.mjs does both.
export default defineConfig({
  plugins: [react()],
});
