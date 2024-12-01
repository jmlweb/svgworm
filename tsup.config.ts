import { defineConfig } from 'tsup';

export default defineConfig({
  entryPoints: ['src2/cli.ts'],
  clean: true,
  format: ['esm'],
});
