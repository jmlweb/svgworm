// TSK-079: build the app, serve it with `next start`, load every route in Chromium and record what
// the browser downloads. One command: `pnpm measure`. Writes results/results.json and results/table.md.
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { gzipSync } from 'node:zlib';

import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
const port = 3079;
const origin = `http://127.0.0.1:${String(port)}`;
const nextBin = join(root, 'node_modules/next/dist/bin/next');
const svgwormBin = join(root, 'node_modules/svgworm/bin/svgworm.js');

// Each variant has a server-only route and a route whose icons render inside one 'use client' component.
const routes = [
  { route: '/baseline', variant: 'baseline', where: 'no icons' },
  { route: '/svgworm', variant: 'svgworm', where: 'server' },
  { route: '/svgworm-client', variant: 'svgworm', where: 'client' },
  { route: '/lucide', variant: 'lucide-react', where: 'server' },
  { route: '/lucide-client', variant: 'lucide-react', where: 'client' },
  { route: '/svgr', variant: 'SVGR', where: 'server' },
  { route: '/svgr-client', variant: 'SVGR', where: 'client' },
];

const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`);
};

const gzipSize = (buffer) => gzipSync(buffer, { level: 9 }).length;

// 1. Build. Icons are copied from lucide-static, then svgworm writes the sprite, then Next builds.
run('node', [join(root, 'src/prepare-icons.mjs')]);
run('node', [svgwormBin]);
run('node', [nextBin, 'build']);

// 2. Serve the production build.
const server = spawn('node', [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'inherit'],
});
const stop = () => server.kill('SIGTERM');
process.on('exit', stop);

try {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await fetch(`${origin}/baseline`).then(
      (res) => res.ok,
      () => false,
    );
    if (ready) break;
    await sleep(200);
    if (attempt === 99) throw new Error('next start did not become ready');
  }

  const browser = await chromium.launch();
  const browserVersion = browser.version();
  const rows = [];
  for (const entry of routes) {
    // A fresh context per route: cold cache, so every request is counted.
    const context = await browser.newContext();
    const page = await context.newPage();
    const responses = [];
    page.on('response', (response) => {
      responses.push(response);
    });
    await page.goto(`${origin}${entry.route}`, { waitUntil: 'networkidle' });
    await sleep(500);

    const assets = [];
    for (const response of responses) {
      const type = response.request().resourceType();
      const body = await response.body().catch(() => Buffer.alloc(0));
      assets.push({
        url: new URL(response.url()).pathname,
        type,
        status: response.status(),
        raw: body.length,
        gzip: gzipSize(body),
      });
    }
    const html = await page.content();
    const iconCount = await page.locator('svg').count();
    await context.close();

    const sum = (list, key) => list.reduce((total, item) => total + item[key], 0);
    const doc = assets.find((a) => a.type === 'document');
    const scripts = assets.filter((a) => a.type === 'script');
    const svgFiles = assets.filter((a) => a.url.endsWith('.svg'));
    const other = assets.filter(
      (a) => a.type !== 'document' && a.type !== 'script' && !a.url.endsWith('.svg'),
    );
    rows.push({
      ...entry,
      svgElements: iconCount,
      renderedHtmlBytes: Buffer.byteLength(html),
      html: { raw: doc.raw, gzip: doc.gzip },
      clientJs: { raw: sum(scripts, 'raw'), gzip: sum(scripts, 'gzip'), requests: scripts.length },
      spriteFiles: { raw: sum(svgFiles, 'raw'), gzip: sum(svgFiles, 'gzip'), requests: svgFiles.length },
      otherRequests: other.length,
      totalRequests: assets.length,
      scriptUrls: scripts.map((a) => a.url).toSorted(),
    });
  }
  await browser.close();

  // 3. Report. "Over baseline" removes the framework floor so the icon cost stands out.
  const baseline = rows.find((r) => r.variant === 'baseline');
  const withDelta = rows.map((row) => ({
    ...row,
    overBaseline: {
      clientJsRaw: row.clientJs.raw - baseline.clientJs.raw,
      clientJsGzip: row.clientJs.gzip - baseline.clientJs.gzip,
      htmlRaw: row.html.raw - baseline.html.raw,
      htmlGzip: row.html.gzip - baseline.html.gzip,
    },
  }));

  const versions = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const result = {
    measuredAt: new Date().toISOString(),
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    browser: `chromium ${browserVersion}`,
    dependencies: { ...versions.dependencies, ...versions.devDependencies },
    rows: withDelta,
  };
  await mkdir(join(root, 'results'), { recursive: true });
  await writeFile(join(root, 'results/results.json'), `${JSON.stringify(result, null, 2)}\n`);

  const kb = (n) => (n / 1024).toFixed(1);
  const lines = [
    '| Variant | Icons in | Client JS raw (KiB) | Client JS gzip (KiB) | JS over baseline raw / gzip (KiB) | HTML raw / gzip (KiB) | Requests (total / script / sprite) |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...withDelta.map(
      (r) =>
        `| ${r.variant} | ${r.where} | ${kb(r.clientJs.raw)} | ${kb(r.clientJs.gzip)} | ${kb(r.overBaseline.clientJsRaw)} / ${kb(r.overBaseline.clientJsGzip)} | ${kb(r.html.raw)} / ${kb(r.html.gzip)} | ${String(r.totalRequests)} / ${String(r.clientJs.requests)} / ${String(r.spriteFiles.requests)} |`,
    ),
  ];
  await writeFile(join(root, 'results/table.md'), `${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
} finally {
  stop();
}
