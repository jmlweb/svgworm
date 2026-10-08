// TSK-004 check: does the generated URL module/manifest deliver sprite + stack URLs that
// render in Next.js 16 App Router (with and without basePath) and in plain HTML, with JS
// disabled, in Chromium, Firefox, and WebKit? Spike code: evidence, not product.
import { spawn, spawnSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';
import { PNG } from 'pngjs';
import { generate } from './generate.mjs';
import { render } from '../plain-html/render.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NEXT_DIR = join(ROOT, 'next-app');
const NEXT_BIN = join(ROOT, 'node_modules/.bin/next');
const TSC_BIN = join(ROOT, 'node_modules/.bin/tsc');
const RESULTS = join(ROOT, 'results');
const ENGINES = { chromium, firefox, webkit };
const ICONS = ['home', 'ui/check', 'brand/sunset', 'café'];

const results = { checks: [], renders: [] };
const record = (name, ok, detail = '') => {
  results.checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const run = (cmd, args, opts = {}) => {
  const res = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });
  return { code: res.status, out: `${res.stdout ?? ''}${res.stderr ?? ''}` };
};

const waitFor = async (url, ms = 60000) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`timeout waiting for ${url}`);
};

// --- Static server for the plain HTML site (any same-origin static host would do).
const serveStatic = (dir, port) =>
  new Promise(resolve => {
    const server = createServer(async (req, res) => {
      const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
      const file = join(dir, path.endsWith('/') ? `${path}index.html` : path);
      try {
        if (!(await stat(file)).isFile()) throw new Error();
      } catch {
        res.writeHead(404).end();
        return;
      }
      const hashed = /\.[0-9a-f]{8}\.svg$/.test(file);
      res.writeHead(200, {
        'Content-Type': extname(file) === '.svg' ? 'image/svg+xml' : 'text/html; charset=utf-8',
        'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache'
      });
      createReadStream(file).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });

// --- Pixel check: fraction of the element that is painted (non-white), and of that,
// the fraction that is red (mono icons follow `color: #ff0000`).
const analyse = png => {
  const img = PNG.sync.read(png);
  let painted = 0;
  let red = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    const [r, g, b] = [img.data[i], img.data[i + 1], img.data[i + 2]];
    // "Painted" = clearly not the white background. On white, red at coverage a is
    // (255, 255(1-a), 255(1-a)): red keeps r high and g = b at any coverage; black or
    // another color would not.
    if (255 - Math.min(r, g, b) > 128) {
      painted += 1;
      if (r > 200 && Math.abs(g - b) < 30) red += 1;
    }
  }
  const total = img.data.length / 4;
  return { painted: painted / total, red: painted ? red / painted : 0 };
};

const checkPage = async (variant, url, origin, manifest) => {
  for (const [engineName, engine] of Object.entries(ENGINES)) {
    const browser = await engine.launch();
    const context = await browser.newContext({ javaScriptEnabled: false, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const svgResponses = [];
    page.on('response', res => {
      if (res.url().includes('.svg')) svgResponses.push({ url: res.url(), status: res.status() });
    });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    for (const name of ICONS) {
      const el = page.locator(`[data-icon="${name}"]`);
      const shot = await el.screenshot();
      const { painted, red } = analyse(shot);
      const { delivery, color } = manifest.icons[name];
      // Thresholds: a 404 paints < 5% (see the negative control); the thinnest icon paints 12.5% of its
      // box. Mono icons must follow `color: #ff0000` (≥ 99% of painted pixels red).
      const ok = painted > 0.1 && (color !== 'mono' || red >= 0.99);
      results.renders.push({ variant, engine: engineName, name, delivery, color, painted: +painted.toFixed(3), red: +red.toFixed(3), ok });
      await writeFile(join(RESULTS, 'shots', `${variant}-${engineName}-${name.replaceAll('/', '--')}.png`), shot);
    }
    const bad = svgResponses.filter(r => r.status !== 200 || !r.url.startsWith(origin));
    record(`${variant}/${engineName}: sprite requests same-origin and 200`, svgResponses.length > 0 && bad.length === 0, `${svgResponses.map(r => new URL(r.url).pathname.split('/').pop()).sort().join(' ')}; bad: ${JSON.stringify(bad)}`);
    await browser.close();
  }
};

const checkHeaders = async (variant, manifest, origin) => {
  for (const kind of ['sprite', 'stack']) {
    const ref = manifest.sprites.icons[kind];
    const res = await fetch(origin + ref.url);
    const detail = `${ref.url} → ${res.status} ${res.headers.get('content-type')} | ${res.headers.get('cache-control')}`;
    record(
      `${variant}: ${kind} served as image/svg+xml with immutable cache`,
      res.status === 200 && res.headers.get('content-type')?.startsWith('image/svg+xml') && /immutable/.test(res.headers.get('cache-control') ?? ''),
      detail
    );
  }
};

const grepDir = async (dir, needles) => {
  const hits = [];
  const walk = async d => {
    for (const entry of await readdir(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) await walk(p);
      else {
        const text = await readFile(p, 'utf8').catch(() => '');
        for (const n of needles) if (text.includes(n)) hits.push(`${p.slice(ROOT.length)}: ${n}`);
      }
    }
  };
  await walk(dir);
  return hits;
};

const nextVariant = async ({ variant, basePath, publicPath, port }) => {
  const manifest = await generate({ outDir: join(NEXT_DIR, 'public/icons'), moduleDir: join(NEXT_DIR, 'svgworm'), publicPath });
  const env = { ...process.env, SPIKE_BASE_PATH: basePath, NEXT_TELEMETRY_DISABLED: '1' };
  const build = run(NEXT_BIN, ['build', NEXT_DIR], { env });
  record(`${variant}: next build (Turbopack, type-checks type-test.tsx)`, build.code === 0, build.code === 0 ? '' : build.out.slice(-2000));
  if (build.code !== 0) return;
  const distDir = join(NEXT_DIR, basePath ? '.next-basepath' : '.next');
  const leaks = await grepDir(join(distDir, 'static'), ['i-brand--sunset', manifest.sprites.icons.sprite.file]);
  record(`${variant}: manifest absent from client JS (.next/static)`, leaks.length === 0, leaks.join(', '));

  const server = spawn(NEXT_BIN, ['start', NEXT_DIR, '-p', String(port)], { env, stdio: 'ignore' });
  const origin = `http://127.0.0.1:${port}`;
  try {
    const pageUrl = `${origin}${basePath || ''}/`;
    await waitFor(pageUrl);
    const html = await (await fetch(pageUrl)).text();
    record(`${variant}: SSR HTML contains hashed URLs`, ICONS.every(n => html.includes(manifest.icons[n].id)) && html.includes(manifest.sprites.icons.sprite.url), manifest.sprites.icons.sprite.url);
    await checkHeaders(variant, manifest, origin);
    // Negative control: without the base path, public files 404 under basePath.
    if (basePath) {
      const res = await fetch(`${origin}/icons/${manifest.sprites.icons.sprite.file}`);
      record(`${variant}: URL without basePath is 404 (publicPath must include it)`, res.status === 404, `status ${res.status}`);
    }
    await checkPage(variant, pageUrl, origin, manifest);
  } finally {
    server.kill();
  }
};

const plainVariant = async ({ port }) => {
  const site = join(ROOT, 'plain-html/site');
  await rm(site, { recursive: true, force: true });
  const moduleDir = join(ROOT, 'plain-html/svgworm');
  const manifest = await generate({ outDir: join(site, 'icons'), moduleDir, publicPath: '/icons' });
  await render({ manifestPath: join(moduleDir, 'manifest.json'), templatePath: join(ROOT, 'plain-html/index.template.html'), outPath: join(site, 'index.html') });
  const server = await serveStatic(site, port);
  const origin = `http://127.0.0.1:${port}`;
  try {
    await checkHeaders('plain-html', manifest, origin);
    await checkPage('plain-html', `${origin}/`, origin, manifest);
    // Negative control: a stale hash (404) renders blank (use) or a broken-image glyph (img,
    // under 5% painted), so the > 10% render threshold can fail.
    await writeFile(
      join(site, 'broken.html'),
      `<!doctype html><body style="margin:0;background:#fff;color:#f00"><svg width="48" height="48" data-icon="broken-use"><use href="/icons/icons.00000000.svg#i-home"/></svg><img width="48" height="48" alt="" src="/icons/icons.stack.00000000.svg#i-brand--sunset" data-icon="broken-img"></body>`
    );
    for (const [engineName, engine] of Object.entries(ENGINES)) {
      const browser = await engine.launch();
      const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
      await page.goto(`${origin}/broken.html`);
      // Fixed page clips: WebKit collapses a broken alt="" <img>, so it can't be located.
      const painted = await Promise.all(
        [0, 48].map(async x => analyse(await page.screenshot({ clip: { x, y: 0, width: 48, height: 48 } })).painted)
      );
      record(`plain-html/${engineName}: negative control (stale hash) renders blank`, painted.every(p => p < 0.05), painted.join(', '));
      await browser.close();
    }
  } finally {
    server.close();
  }
};

const contractChecks = async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'tsk004-'));
  const a = await generate({ outDir: join(tmp, 'a/out'), moduleDir: join(tmp, 'a/mod'), publicPath: '/icons' });
  const b = await generate({ outDir: join(tmp, 'b/out'), moduleDir: join(tmp, 'b/mod'), publicPath: '/docs/static/icons/' });
  const filesA = (await readdir(join(tmp, 'a/out'))).sort();
  const filesB = (await readdir(join(tmp, 'b/out'))).sort();
  record('file names independent of publicPath (hash from content only)', JSON.stringify(filesA) === JSON.stringify(filesB), filesA.join(', '));
  record('trailing slash in publicPath normalized', b.sprites.icons.sprite.url === `/docs/static/icons/${b.sprites.icons.sprite.file}`, b.sprites.icons.sprite.url);
  const again = await generate({ outDir: join(tmp, 'a/out'), moduleDir: join(tmp, 'a/mod2'), publicPath: '/icons' });
  const sameModule = (await readFile(join(tmp, 'a/mod/icons.js'), 'utf8')) === (await readFile(join(tmp, 'a/mod2/icons.js'), 'utf8'));
  record('rerun gives byte-identical module and files', sameModule && JSON.stringify(again) === JSON.stringify(a));
  for (const bad of ['icons', './icons', '//cdn.example.com/icons', 'https://cdn.example.com/icons', '/icons?v=1']) {
    const res = run('node', ['src/generate.mjs', '--out-dir', join(tmp, 'x'), '--module-dir', join(tmp, 'y'), '--public-path', bad]);
    record(`publicPath "${bad}" rejected with exit 2`, res.code === 2, res.out.trim());
  }
  // Stale hashed files from an earlier build are removed; foreign files are kept.
  await writeFile(join(tmp, 'a/out/icons.deadbeef.svg'), '<svg/>');
  await writeFile(join(tmp, 'a/out/robots.txt'), '');
  await generate({ outDir: join(tmp, 'a/out'), moduleDir: join(tmp, 'a/mod'), publicPath: '/icons' });
  const after = await readdir(join(tmp, 'a/out'));
  record('stale hashed files removed, foreign files kept', !after.includes('icons.deadbeef.svg') && after.includes('robots.txt'), after.sort().join(', '));
  await rm(tmp, { recursive: true, force: true });
};

await rm(RESULTS, { recursive: true, force: true });
await mkdir(join(RESULTS, 'shots'), { recursive: true });

await contractChecks();
await plainVariant({ port: 4310 });
await nextVariant({ variant: 'next', basePath: '', publicPath: '/icons', port: 4311 });
const tsc = run(TSC_BIN, ['--noEmit', '-p', join(NEXT_DIR, 'tsconfig.json')]);
record('tsc: invalid icon name is a type error (@ts-expect-error holds)', tsc.code === 0, tsc.out.trim().slice(0, 500));
await nextVariant({ variant: 'next-basepath', basePath: '/docs', publicPath: '/docs/icons', port: 4312 });
// Leave the plain /icons build in place for anyone running `next dev` by hand.
await generate({ outDir: join(NEXT_DIR, 'public/icons'), moduleDir: join(NEXT_DIR, 'svgworm'), publicPath: '/icons' });

for (const r of results.renders.filter(r => !r.ok)) record(`render ${r.variant}/${r.engine}/${r.name}`, false, JSON.stringify(r));
record(`renders: ${results.renders.filter(r => r.ok).length}/${results.renders.length} pass`, results.renders.every(r => r.ok));

const md = [
  '# TSK-004 check results',
  '',
  'Generated by `pnpm check`. JS disabled in every browser context.',
  '',
  '| Check | Result | Detail |',
  '|---|---|---|',
  ...results.checks.map(c => `| ${c.name} | ${c.ok ? '✅' : '❌'} | ${c.detail.replaceAll('|', '\\|').replaceAll('\n', ' ')} |`),
  '',
  '## Renders',
  '',
  '| Variant | Engine | Icon | Delivery | Painted | Red (mono) | OK |',
  '|---|---|---|---|---|---|---|',
  ...results.renders.map(r => `| ${r.variant} | ${r.engine} | ${r.name} | ${r.delivery} | ${r.painted} | ${r.color === 'mono' ? r.red : '–'} | ${r.ok ? '✅' : '❌'} |`),
  ''
].join('\n');
await writeFile(join(RESULTS, 'results.md'), md);
await writeFile(join(RESULTS, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
const failed = results.checks.filter(c => !c.ok).length;
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
