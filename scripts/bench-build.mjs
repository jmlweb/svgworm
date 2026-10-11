// Times compile() on 1,000 in-memory icons made by cycling the valid fixtures under unique
// names (R-50). Needs `pnpm build` first. Prints one JSON document.
// Usage: node scripts/bench-build.mjs [iconCount] [runs]
import { readdir, readFile } from 'node:fs/promises';
import { arch, cpus, platform } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile } from '../packages/svgworm/dist/index.js';

const iconCount = Number(process.argv[2] ?? 1000);
const runs = Number(process.argv[3] ?? 5);
const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

const entries = await readdir(fixturesDir, {
  recursive: true,
  withFileTypes: true,
});
const fixtures = (
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
      .map(async (entry) => {
        const absolute = join(entry.parentPath, entry.name);
        return {
          relativePath: relative(fixturesDir, absolute).replaceAll('\\', '/'),
          content: await readFile(absolute),
        };
      }),
  )
).filter(
  (fixture) =>
    !fixture.relativePath.startsWith('invalid/') &&
    fixture.relativePath !== 'style/unscopable-media.svg',
);

const sources = Array.from({ length: iconCount }, (_, index) => {
  const fixture = fixtures[index % fixtures.length];
  const relativePath = `set-${String(index)}/${fixture.relativePath}`;
  return {
    path: `bench/${relativePath}`,
    relativePath,
    content: fixture.content,
  };
});

const options = { flatten: false, publicPath: '/icons', color: [] };
const timeOnce = () => {
  const started = performance.now();
  const result = compile(sources, options);
  const elapsed = performance.now() - started;
  if (!result.ok) {
    throw new Error(
      `Benchmark input failed: ${JSON.stringify(result.errors.slice(0, 3))}`,
    );
  }
  return elapsed;
};

timeOnce(); // warmup: JIT and svgo plugin setup
const samples = Array.from({ length: runs }, timeOnce).toSorted(
  (a, b) => a - b,
);
const percentile = (fraction) =>
  samples[
    Math.min(samples.length - 1, Math.ceil(fraction * samples.length) - 1)
  ];

process.stdout.write(
  `${JSON.stringify(
    {
      icons: iconCount,
      runs,
      medianMs: Math.round(percentile(0.5)),
      p95Ms: Math.round(percentile(0.95)),
      node: process.version,
      machine: `${platform()} ${arch()} ${cpus()[0]?.model ?? 'unknown'} x${String(cpus().length)}`,
    },
    null,
    2,
  )}\n`,
);
