// TSK-099 spike: compile one icon in crossOrigin "inject" mode with the built core, point it at
// the local "CDN", and write the files `svgworm init` generates (Icon and SvgwormLoader, from the
// built plan.js) into every app. Spike code: evidence, not product.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { compile } from '../../../packages/svgworm/dist/index.js';
import { emitLoader } from '../../../packages/svgworm/dist/core/emit/loader.js';
import {
  svelteComponentContent,
  svelteLoaderContent,
  vueComponentContent,
  vueLoaderContent,
} from '../../../packages/svgworm/dist/cli/init/plan.js';
import { CDN_ORIGIN, HERE, OUT } from './shared.mjs';

const sri = (text) => `sha384-${createHash('sha384').update(text).digest('base64')}`;
const FIXTURE = 'mono-fill/figma-export.svg';
const content = await readFile(join(HERE, '../../fixtures', FIXTURE));
const PLACEHOLDER = 'https://cdn.invalid';
const result = compile([{ path: `fixtures/${FIXTURE}`, relativePath: FIXTURE, content }], {
  flatten: true,
  publicPath: `${PLACEHOLDER}/icons`,
  crossOrigin: 'inject',
  color: [],
});
if (!result.ok) throw new Error(JSON.stringify(result.errors));
const file = (name) => result.files.find((entry) => entry.name === name);
const sprite = result.files.find((entry) => entry.name.endsWith('.svg'));
const oldLoader = result.files.find((entry) => entry.name.includes('.loader.'));
// The core bakes the sprite URL into the loader: rebuild it for the local CDN origin.
const loader = emitLoader(`${CDN_ORIGIN}/icons/${sprite.name}`, sri(sprite.content));
const rewrite = (text) =>
  text.replaceAll(PLACEHOLDER, CDN_ORIGIN).replaceAll(sri(oldLoader.content), sri(loader));

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, 'cdn/icons'), { recursive: true });
await writeFile(join(OUT, 'cdn/icons', sprite.name), sprite.content);
await writeFile(join(OUT, 'cdn/icons', oldLoader.name), loader);

// Controls, to show the check can fail: CONTROL=no-loader renders no loader tag;
// CONTROL=no-integrity drops the integrity pin; CONTROL=src-first moves src before integrity and crossorigin in the generated loader.
const control = (text) => {
  if (process.env.CONTROL === 'no-loader') {
    return text.includes('<svelte:head>')
      ? text.replace(/<svelte:head>[^]*<\/svelte:head>/, '')
      : text.replace(/loaders\.map\([^]*?\),\n    \),/, '[],');
  }
  if (process.env.CONTROL === 'no-integrity') {
    return text.replace(/\s+integrity(: loader\.integrity,|=\{loader\.integrity\})/, '');
  }
  if (process.env.CONTROL === 'src-first') {
    return text
      .replace(/(\s+)src: loader\.url,/, '')
      .replace("crossorigin: 'anonymous',", "src: loader.url,\n        crossorigin: 'anonymous',")
      .replace(/(\s+)src=\{loader\.url\}/, '')
      .replace('crossorigin="anonymous"', 'src={loader.url}\n      crossorigin="anonymous"');
  }
  return text;
};

const targets = [
  { dir: 'apps/vue-spa/src/generated', vue: true },
  { dir: 'apps/nuxt/app/generated', vue: true },
  { dir: 'apps/svelte-spa/src/generated', vue: false },
  { dir: 'apps/sveltekit/src/lib', vue: false },
];
for (const { dir, vue } of targets) {
  const at = join(HERE, dir);
  await rm(at, { recursive: true, force: true });
  await mkdir(at, { recursive: true });
  await writeFile(join(at, 'icons.js'), rewrite(file('icons.js').content));
  await writeFile(join(at, 'icons.d.ts'), rewrite(file('icons.d.ts').content));
  const ext = vue ? 'vue' : 'svelte';
  const componentContent = vue ? vueComponentContent : svelteComponentContent;
  const loaderContent = vue ? vueLoaderContent : svelteLoaderContent;
  await writeFile(join(at, `Icon.${ext}`), componentContent(`${dir}/Icon.${ext}`, dir));
  await writeFile(
    join(at, `SvgwormLoader.${ext}`),
    control(loaderContent(`${dir}/SvgwormLoader.${ext}`, dir)),
  );
}
console.log(`prepared ${sprite.name} and ${oldLoader.name} for ${CDN_ORIGIN}`);
