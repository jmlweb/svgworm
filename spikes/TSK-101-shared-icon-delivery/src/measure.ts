// Counts the distinct non-blank lines (leading whitespace removed) that the generated Icon
// templates and createIcon share. Run from the repository root with Node 24 or later:
//   node spikes/TSK-101-shared-icon-delivery/src/measure.ts [outDir]
// With outDir, it also writes the rendered templates there, for a before/after `diff -r`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import {
  astroComponentContent,
  svelteComponentContent,
  svelteLoaderContent,
  vueComponentContent,
  vueLoaderContent,
} from '../../../packages/svgworm/src/cli/init/plan.ts';

const rendered = {
  'Icon.astro': astroComponentContent('src/components/Icon.astro', 'src/svgworm'),
  'Icon.vue': vueComponentContent('src/components/Icon.vue', 'src/svgworm'),
  'Icon.svelte': svelteComponentContent('src/components/Icon.svelte', 'src/svgworm'),
  'SvgwormLoader.vue': vueLoaderContent('src/components/SvgwormLoader.vue', 'src/svgworm'),
  'SvgwormLoader.svelte': svelteLoaderContent(
    'src/components/SvgwormLoader.svelte',
    'src/svgworm',
  ),
};

const outDir = process.argv[2];
if (outDir !== undefined) {
  mkdirSync(outDir, { recursive: true });
  for (const [file, content] of Object.entries(rendered)) {
    writeFileSync(`${outDir}/${file}`, content);
  }
}

const distinctLines = (text: string): Set<string> =>
  new Set(
    text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== ''),
  );

const sets = {
  astro: distinctLines(rendered['Icon.astro']),
  vue: distinctLines(rendered['Icon.vue']),
  svelte: distinctLines(rendered['Icon.svelte']),
  react: distinctLines(readFileSync('packages/react/src/create-icon.tsx', 'utf8')),
};

const intersect = (...groups: Set<string>[]): string[] =>
  [...groups[0]!].filter((line) => groups.every((group) => group.has(line))).toSorted();

const templates = intersect(sets.astro, sets.vue, sets.svelte);
const allFour = intersect(sets.astro, sets.vue, sets.svelte, sets.react);

for (const [name, set] of Object.entries(sets)) console.log(`${name}: ${set.size}`);
console.log(`common to the three templates: ${templates.length}`);
console.log(`common to all four: ${allFour.length}`);
console.log(allFour.join('\n'));
