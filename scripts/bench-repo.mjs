// Measure what svgworm does to a public repo's SVG icon folder (TSK-030, docs/posts).
//
//   node scripts/bench-repo.mjs --repo supabase/supabase --path apps/studio/public/img/icons
//   node scripts/bench-repo.mjs --repo calcom/cal.com --path apps/web/public/country-flag-icons --json
//
// Read-only on the target: a shallow, sparse clone into a temp folder, nothing sent back.
// Compares three states of the same files: the originals, svgo alone (multipass), and the
// svgworm sprite. Sizes are raw, gzip and brotli; "per-file" totals sum each file compressed on
// its own, which is what the browser downloads when each icon is its own request.
// Files svgworm rejects (it fails loudly by design) are excluded, listed with the reason, and the
// build is repeated. Run `pnpm build` first. The SVGs are never copied into this repo: many are
// third-party logos, so publish the numbers and this script, not the files.
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { promisify } from 'node:util';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const run = promisify(execFile);
const CLI = new URL('../packages/svgworm/bin/svgworm.js', import.meta.url)
  .pathname;

const { values } = parseArgs({
  options: {
    repo: { type: 'string' },
    path: { type: 'string' },
    ref: { type: 'string' },
    json: { type: 'boolean', default: false },
  },
});
if (!values.repo || !values.path) {
  throw new Error(
    'usage: bench-repo.mjs --repo <owner/name> --path <icon folder> [--ref <ref>] [--json]',
  );
}

const listSvgs = async (dir) =>
  (await readdir(dir, { recursive: true }))
    .filter((file) => file.endsWith('.svg'))
    .map((file) => file.replaceAll('\\', '/'))
    .toSorted();

const sizes = (buffers) => ({
  files: buffers.length,
  raw: buffers.reduce((sum, buf) => sum + buf.length, 0),
  gzip: buffers.reduce(
    (sum, buf) => sum + gzipSync(buf, { level: 9 }).length,
    0,
  ),
  brotli: buffers.reduce((sum, buf) => sum + brotliCompressSync(buf).length, 0),
});

const loadSvgo = async () => {
  // svgo is a dependency of the svgworm package, not of the repo root.
  const require = createRequire(
    new URL('../packages/svgworm/package.json', import.meta.url),
  );
  return import(pathToFileURL(require.resolve('svgo')).href);
};

const build = async (cwd, source) => {
  try {
    const { stdout } = await run(
      'node',
      [
        CLI,
        '--source',
        source,
        '--out-dir',
        'out',
        '--public-path',
        '/icons',
        '--module-dir',
        'mod',
        '--json',
      ],
      { cwd, maxBuffer: 64 * 1024 * 1024 },
    );
    return JSON.parse(stdout);
  } catch (error) {
    // The CLI exits 1 with the same JSON document on stdout when the build fails.
    if (error.stdout) return JSON.parse(error.stdout);
    throw error;
  }
};

const work = await mkdtemp(join(tmpdir(), 'svgworm-bench-'));
try {
  const clone = join(work, 'clone');
  await run('git', [
    'clone',
    '--quiet',
    '--depth',
    '1',
    '--filter=blob:none',
    '--sparse',
    ...(values.ref ? ['--branch', values.ref] : []),
    `https://github.com/${values.repo}.git`,
    clone,
  ]);
  await run('git', ['sparse-checkout', 'set', values.path], { cwd: clone });
  const commit = (
    await run('git', ['log', '-1', '--format=%H %cs'], { cwd: clone })
  ).stdout.trim();

  // svgworm only reads sources inside its working directory, so the icons are copied there.
  const cwd = join(work, 'run');
  const input = join(cwd, 'icons-in');
  await mkdir(cwd, { recursive: true });
  await cp(join(clone, values.path), input, { recursive: true });
  await run(
    'node',
    [
      '-e',
      'require(\'fs\').writeFileSync(\'package.json\',\'{"private":true,"type":"module"}\')',
    ],
    { cwd },
  );

  const everySvg = await listSvgs(input);
  const excluded = [];
  let result = await build(cwd, 'icons-in');
  // Each pass drops the files named in the errors; a handful of passes is enough in practice.
  for (let pass = 0; pass < 5 && !result.ok; pass++) {
    const bad = new Map(
      result.errors
        .filter((error) => error.file.startsWith('icons-in/'))
        .map((error) => [
          error.file.slice('icons-in/'.length),
          error.message.split('\n')[0],
        ]),
    );
    if (bad.size === 0)
      throw new Error(
        `build failed: ${result.errors[0]?.message ?? 'unknown'}`,
      );
    for (const [file, reason] of bad) {
      excluded.push({ file, reason });
      await rm(join(input, file));
    }
    result = await build(cwd, 'icons-in');
  }
  if (!result.ok) throw new Error('build still failing after excluding files');

  const kept = await listSvgs(input);
  const originals = await Promise.all(
    kept.map((file) => readFile(join(input, file))),
  );
  const { optimize } = await loadSvgo();
  const optimized = await Promise.all(
    kept.map(async (file) =>
      Buffer.from(
        optimize((await readFile(join(input, file))).toString('utf8'), {
          path: file,
          multipass: true,
        }).data,
      ),
    ),
  );
  const sprites = (await readdir(join(cwd, 'out'))).toSorted();
  const spriteFile = sprites.find((name) => !name.includes('stack'));
  const sprite = sizes([await readFile(join(cwd, 'out', spriteFile))]);

  const report = {
    repo: values.repo,
    path: values.path,
    commit,
    svgworm: (await run('node', [CLI, '--version'])).stdout.trim(),
    found: everySvg.length,
    excluded,
    icons: result.stats.icons,
    colors: { mono: result.stats.mono, multicolor: result.stats.multicolor },
    delivery: result.stats.delivery,
    originals: sizes(originals),
    svgoOnly: sizes(optimized),
    sprite: { ...sprite, requests: 1 },
  };

  const pct = (from, to) => `${String(Math.round((1 - to / from) * 100))}%`;
  if (values.json) console.log(JSON.stringify(report, null, 2));
  else {
    const row = (label, s, requests) =>
      `| ${label} | ${String(requests)} | ${String(s.raw)} | ${String(s.gzip)} | ${String(s.brotli)} |`;
    console.log(
      `${report.repo} @ ${commit}, ${report.path} (svgworm ${report.svgworm})`,
    );
    console.log(
      `${String(report.found)} SVGs found, ${String(report.icons)} built, ${String(excluded.length)} rejected`,
    );
    for (const { file, reason } of excluded)
      console.log(`  rejected ${file}: ${reason}`);
    console.log(
      `mono ${String(report.colors.mono)}, multicolor ${String(report.colors.multicolor)}\n`,
    );
    console.log(
      '| | Requests | Raw B | Gzip B | Brotli B |\n|---|---|---|---|---|',
    );
    console.log(row('Original', report.originals, report.originals.files));
    console.log(row('svgo only', report.svgoOnly, report.svgoOnly.files));
    console.log(row('svgworm sprite', report.sprite, 1));
    console.log(
      `\nsprite vs original: gzip -${pct(report.originals.gzip, report.sprite.gzip)}, brotli -${pct(report.originals.brotli, report.sprite.brotli)}; vs svgo only: gzip -${pct(report.svgoOnly.gzip, report.sprite.gzip)}`,
    );
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
