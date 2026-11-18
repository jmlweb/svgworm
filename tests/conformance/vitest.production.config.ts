import { defineConfig } from 'vitest/config';

// The component tests again with Vue's production build, which handles render errors
// differently from its development build (TSK-103). Vue picks its build twice: `vue` from
// NODE_ENV when it loads, `@vue/server-renderer` from the Node export conditions. Vitest adds
// the development condition when the shell has no NODE_ENV=production, and the extra
// production condition wins because Vue's export maps list it first.
export default defineConfig({
  test: {
    name: 'conformance-production',
    include: ['tests/icon-conformance.test.ts'],
    env: { NODE_ENV: 'production' },
    execArgv: ['--conditions', 'production'],
  },
});
