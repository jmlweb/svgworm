// Measures when the sprite and stack requests start, and how often they are fetched, with and
// without <link rel="preload"> hints, in Chromium, Firefox and WebKit (JS disabled).
// Spike code: evidence, not product.
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium, firefox, webkit } from 'playwright';

import { compile } from '../../../packages/svgworm/dist/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '../../../fixtures');
const RESULTS = join(HERE, '../results');
const REPS = Number(process.env.REPS ?? 3);
const ONLY = process.env.ENGINES?.split(',');
// The <head> is flushed at once; <body> follows after BODY_DELAY. The render-blocking stylesheet
// answers after CSS_DELAY, so first layout (and with it the <use> and mask fetches) waits for it.
const BODY_DELAY = 300;
const CSS_DELAY = 800;
const CHROMIUM_CONSOLE_WAIT = 3500;
const IMMUTABLE = 'public, max-age=31536000, immutable';

// --- Real svgworm output: every valid fixture, compiled by the built core ---

const entries = await readdir(FIXTURES, { recursive: true, withFileTypes: true });
const sources = await Promise.all(
  entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
    .map(async (entry) => {
      const absolute = join(entry.parentPath, entry.name);
      const relativePath = relative(FIXTURES, absolute).replaceAll('\\', '/');
      return { path: `fixtures/${relativePath}`, relativePath, content: await readFile(absolute) };
    })
);
const result = compile(
  sources.filter(
    (source) => !source.relativePath.startsWith('invalid/') && source.relativePath !== 'style/unscopable-media.svg',
  ),
  { flatten: false, publicPath: '/icons', color: [] },
);
if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));

const { manifest } = result;
const ASSETS = new Map(
  result.files.filter((file) => file.target === 'outDir').map((file) => [`/icons/${file.name}`, file.content]),
);
const SPRITE = manifest.sprite.url;
const STACK = manifest.stack.url;
const icons = Object.values(manifest.icons);
const byDelivery = (delivery, count) => icons.filter((icon) => icon.delivery === delivery).slice(0, count);
const USE = byDelivery('use', 3);
const IMG = byDelivery('img', 2);
const MASK = byDelivery('mask', 2);

// --- Pages ---

const cell = {
  use: (icon) =>
    `<svg width="48" height="48" viewBox="${icon.viewBox}" focusable="false" aria-hidden="true"><use href="${SPRITE}#${icon.id}"></use></svg>`,
  img: (icon) => `<img src="${STACK}#${icon.id}" width="48" height="48" alt="">`,
  mask: (icon) =>
    `<span aria-hidden="true" style="display:inline-block;width:48px;height:48px;background-color:currentColor;mask:url(&quot;${STACK}#${icon.id}&quot;) center / contain no-repeat"></span>`,
};

// Which files each page needs, so a hint is only emitted for files the page uses.
const PAGES = {
  use: { targets: [SPRITE], cells: [...USE.map(cell.use)] },
  stack: { targets: [STACK], cells: [...IMG.map(cell.img), ...MASK.map(cell.mask)] },
  all: { targets: [SPRITE, STACK], cells: [...USE.map(cell.use), ...IMG.map(cell.img), ...MASK.map(cell.mask)] },
};

// The first icon id for a target, for the fragment variant (React 19 emits the <img> src as is).
const firstId = (target) => (target === SPRITE ? USE[0].id : IMG[0].id);

const VARIANTS = {
  none: null,
  image: (url) => `<link rel="preload" href="${url}" as="image">`,
  'image-type': (url) => `<link rel="preload" href="${url}" as="image" type="image/svg+xml">`,
  'image-cors': (url) => `<link rel="preload" href="${url}" as="image" crossorigin>`,
  fetch: (url) => `<link rel="preload" href="${url}" as="fetch">`,
  'fetch-cors': (url) => `<link rel="preload" href="${url}" as="fetch" crossorigin>`,
  'image-fragment': (url) => `<link rel="preload" href="${url}#${firstId(url)}" as="image">`,
};

const padding = `<!-- ${'x'.repeat(2048)} -->`;
const text = '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);

const pageParts = ({ page, variant, position }) => {
  const { targets, cells } = PAGES[page];
  const hints = VARIANTS[variant] ? targets.map(VARIANTS[variant]).join('') : '';
  const head =
    `<!doctype html><html><head><meta charset="utf-8"><title>${page} ${variant} ${position}</title>` +
    (position === 'head' ? hints : '') +
    `<link rel="stylesheet" href="/slow.css">${padding}</head>`;
  const body = `<body><h1>${page}</h1>${text}${position === 'inline' ? hints : ''}<div>${cells.join('')}</div></body></html>`;
  return { head, body };
};

// --- Server: logs every request with its arrival time relative to the page request ---

const serve = (port, state) =>
  new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      const now = performance.now();
      if (url.pathname === '/page') {
        state.t0 = now;
        state.log = [];
        const { head, body } = pageParts(Object.fromEntries(url.searchParams));
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        res.write(head);
        await sleep(BODY_DELAY);
        res.end(body);
        return;
      }
      state.log?.push({
        path: url.pathname,
        at: Math.round(now - state.t0),
        dest: req.headers['sec-fetch-dest'] ?? null,
        mode: req.headers['sec-fetch-mode'] ?? null,
      });
      if (url.pathname === '/slow.css') {
        await sleep(CSS_DELAY);
        res.writeHead(200, { 'content-type': 'text/css', 'cache-control': 'no-store' });
        res.end('body { font: 16px sans-serif; color: #b03a2e }');
        return;
      }
      const asset = ASSETS.get(url.pathname);
      if (!asset) return res.writeHead(404).end();
      await sleep(state.scenario.assetDelay);
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': state.scenario.header });
      res.end(asset);
    });
    server.listen(port, () => resolve(server));
  });

// --- Matrix ---

const CASES = [
  ...Object.keys(PAGES).flatMap((page) =>
    Object.keys(VARIANTS).flatMap((variant) =>
      variant === 'none'
        ? [{ page, variant, position: 'none' }]
        : ['head', 'inline'].map((position) => ({ page, variant, position })),
    ),
  ),
];
// "slow": every asset answers ASSET_DELAY late, so a preload from <head> is still in flight when
// the body arrives, as on a real network. Only head hints, which are the ones that can win time.
const ASSET_DELAY = 600;
const SCENARIOS = {
  'no-store': { header: 'no-store', assetDelay: 0, cases: CASES },
  immutable: { header: IMMUTABLE, assetDelay: 0, cases: CASES },
  'immutable-slow': {
    header: IMMUTABLE,
    assetDelay: ASSET_DELAY,
    cases: CASES.filter((testCase) => testCase.position !== 'inline'),
  },
};

const median = (values) => {
  const sorted = values.toSorted((a, b) => a - b);
  return sorted.length === 0 ? null : sorted[Math.floor((sorted.length - 1) / 2)];
};

const runEngine = async (name, launcher, port) => {
  const state = { log: null, t0: 0, scenario: SCENARIOS['no-store'] };
  const server = await serve(port, state);
  const probe = await launcher.launch();
  const version = probe.version();
  await probe.close();
  const rows = [];
  for (const [cacheName, scenario] of Object.entries(SCENARIOS)) {
    state.scenario = scenario;
    for (const testCase of scenario.cases) {
      const runs = [];
      for (let rep = 0; rep < REPS; rep += 1) {
        // A fresh persistent profile per load. A new context in a shared browser is not cold
        // (Firefox shares its in-memory image cache across contexts), and Playwright's WebKit has
        // no HTTP cache at all in an ephemeral context, which would fake double downloads.
        const profile = await mkdtemp(join(tmpdir(), 'tsk-039-'));
        const context = await launcher.launchPersistentContext(profile, { javaScriptEnabled: false });
        const page = context.pages()[0] ?? (await context.newPage());
        const warnings = [];
        const seen = [];
        page.on('console', (message) => {
          if (/preload/i.test(message.text())) warnings.push(message.text().replace(/http:\/\/localhost:\d+/g, ''));
        });
        page.on('request', (request) => {
          const { pathname } = new URL(request.url());
          if (pathname.startsWith('/icons/')) seen.push({ path: pathname, type: request.resourceType() });
        });
        const query = new URLSearchParams(testCase);
        await page.goto(`http://localhost:${port}/page?${query}`, { waitUntil: 'load' });
        await sleep(name === 'chromium' && rep === 0 && testCase.variant !== 'none' ? CHROMIUM_CONSOLE_WAIT : 500);
        await context.close();
        await rm(profile, { recursive: true, force: true });
        runs.push({ log: state.log.filter((entry) => entry.path.startsWith('/icons/')), warnings, seen });
        state.log = null;
      }
      for (const target of PAGES[testCase.page].targets) {
        const perRun = runs.map((run) => {
          const hits = run.log.filter((entry) => entry.path === target);
          return {
            count: hits.length,
            start: hits[0]?.at ?? null,
            requests: hits.map((hit) => `${hit.dest ?? '-'}/${hit.mode ?? '-'}@${hit.at}`),
            types: run.seen.filter((entry) => entry.path === target).map((entry) => entry.type),
          };
        });
        const counts = perRun.map((run) => run.count);
        rows.push({
          engine: name,
          cache: cacheName,
          ...testCase,
          target: target === SPRITE ? 'sprite' : 'stack',
          count: median(counts),
          countStable: counts.every((count) => count === counts[0]),
          counts,
          start: median(perRun.map((run) => run.start).filter((start) => start !== null)),
          requests: perRun[0].requests,
          playwrightTypes: perRun[0].types,
          warnings: [...new Set(runs.flatMap((run) => run.warnings))],
        });
      }
      process.stdout.write(`${name} ${cacheName} ${testCase.page}/${testCase.variant}/${testCase.position}\n`);
    }
  }
  server.close();
  return { version, rows };
};

const ENGINES = { chromium, firefox, webkit };
const selected = Object.entries(ENGINES).filter(([name]) => !ONLY || ONLY.includes(name));
const results = await Promise.all(selected.map(([name, launcher], index) => runEngine(name, launcher, 4390 + index)));

// --- Verdicts against the no-hint baseline of the same engine, cache, page and target ---

const key = (row) => `${row.engine}|${row.cache}|${row.page}|${row.target}`;
const rows = results.flatMap((entry) => entry.rows);
const baselines = new Map(rows.filter((row) => row.variant === 'none').map((row) => [key(row), row]));
const verdict = (row) => {
  if (row.variant === 'none') return 'baseline';
  const base = baselines.get(key(row));
  const earlier = row.start !== null && base.start !== null && base.start - row.start >= 100;
  const extra = row.count - base.count;
  if (extra > 0) return `double (+${extra})${earlier ? ', earlier' : ''}`;
  if (extra < 0) return `reused, ${base.count}→${row.count} fetches${earlier ? ', earlier' : ''}`;
  return earlier ? 'reused, earlier' : 'no gain';
};
const judged = rows.map((row) => ({ ...row, verdict: verdict(row) }));

await mkdir(RESULTS, { recursive: true });
const meta = {
  date: new Date().toISOString().slice(0, 10),
  playwright: '1.58.2',
  engines: Object.fromEntries(selected.map(([name], index) => [name, results[index].version])),
  reps: REPS,
  bodyDelayMs: BODY_DELAY,
  assetDelayMsInSlowScenario: ASSET_DELAY,
  cssDelayMs: CSS_DELAY,
  sprite: { url: SPRITE, bytes: ASSETS.get(SPRITE).length },
  stack: { url: STACK, bytes: ASSETS.get(STACK).length },
  icons: { use: USE.map((icon) => icon.name), img: IMG.map((icon) => icon.name), mask: MASK.map((icon) => icon.name) },
};
await writeFile(join(RESULTS, 'matrix.json'), `${JSON.stringify({ meta, rows: judged }, null, 2)}\n`);

const table = (filter) =>
  [
    '| engine | page | target | variant | position | fetches | start (ms) | dest/mode of each request | verdict |',
    '|---|---|---|---|---|---|---|---|---|',
    ...judged
      .filter(filter)
      .map(
        (row) =>
          `| ${row.engine} | ${row.page} | ${row.target} | ${row.variant} | ${row.position} | ${row.count}${row.countStable ? '' : ` (unstable: ${row.counts.join(',')})`} | ${row.start ?? '-'} | ${row.requests.map((request) => request.replace(/@\d+$/, '')).join(', ') || '-'} | ${row.verdict} |`,
      ),
  ].join('\n');
const warnings = [
  ...new Set(judged.flatMap((row) => row.warnings.map((warning) => `- ${row.engine} ${row.cache} ${row.page}/${row.variant}/${row.position}: ${warning}`))),
];
const markdown = [
  '# TSK-039 preload matrix',
  '',
  `Generated by \`pnpm measure\` on ${meta.date}. Playwright ${meta.playwright}: ${Object.entries(meta.engines).map(([name, version]) => `${name} ${version}`).join(', ')}. ${REPS} runs per cell, median start, fetch count from the server log.`,
  '',
  `Page: \`<head>\` flushed at 0 ms, \`<body>\` at ${BODY_DELAY} ms, render-blocking stylesheet done at about ${CSS_DELAY} ms. "start" is when the server saw the first request for the file. Sprite ${meta.sprite.bytes} bytes, stack ${meta.stack.bytes} bytes.`,
  '',
  ...Object.entries(SCENARIOS).flatMap(([cacheName, scenario]) => [
    `## ${cacheName}: Cache-Control \`${scenario.header}\`${scenario.assetDelay ? `, every asset answers ${scenario.assetDelay} ms late, head hints only` : ''}`,
    '',
    table((row) => row.cache === cacheName),
    '',
  ]),
  '## Console warnings mentioning preload',
  '',
  ...(warnings.length ? warnings : ['None.']),
  '',
].join('\n');
await writeFile(join(RESULTS, 'matrix.md'), markdown);
process.stdout.write('done\n');
