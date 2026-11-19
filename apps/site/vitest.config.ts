/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default getViteConfig({
  // Without an explicit root, the Vite root follows the working directory: from the repository
  // root, the include below also collected tests/conformance and ran it twice at once.
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    name: 'site',
    include: ['tests/**/*.test.ts'],
  },
});
