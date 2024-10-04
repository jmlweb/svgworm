import { defineConfig } from 'tsup';

export default defineConfig({
  entryPoints: ['src/cli.ts'],
  clean: true,
});
