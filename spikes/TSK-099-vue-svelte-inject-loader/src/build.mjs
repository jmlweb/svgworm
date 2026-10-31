// Builds the six apps of the matrix into out/. Spike code.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { HERE, OUT } from './shared.mjs';

const bin = (name) => join(HERE, 'node_modules/.bin', name);
const run = (cwd, command, args, env) => {
  console.log(`build ${cwd} ${env.SPIKE_OUT}`);
  execFileSync(command, args, { cwd: join(HERE, cwd), env: { ...process.env, ...env }, stdio: 'inherit' });
};
const only = process.env.APPS?.split(',');
const builds = [
  ['vue-spa', 'apps/vue-spa', bin('vite'), ['build'], {}],
  ['svelte-spa', 'apps/svelte-spa', bin('vite'), ['build'], {}],
  ['nuxt-ssr', 'apps/nuxt', bin('nuxt'), ['build'], { SPIKE_SSR: '1' }],
  ['nuxt-spa', 'apps/nuxt', bin('nuxt'), ['build'], { SPIKE_SSR: '0' }],
  ['sveltekit-ssr', 'apps/sveltekit', bin('vite'), ['build'], { VITE_SPIKE_SSR: '1' }],
  ['sveltekit-spa', 'apps/sveltekit', bin('vite'), ['build'], { VITE_SPIKE_SSR: '0' }],
];
for (const [name, cwd, command, args, env] of builds) {
  if (only && !only.includes(name)) continue;
  run(cwd, command, args, { ...env, SPIKE_OUT: join(OUT, name) });
}
