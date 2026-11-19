/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default getViteConfig({
  // astro 7.4 sets the Vite root to the working directory: from the repository root, the
  // include below would also collect tests/conformance and run it twice at once.
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    name: 'site',
    include: ['tests/**/*.test.ts'],
  },
});
