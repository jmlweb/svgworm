// TSK-099 spike: does the SvgwormLoader that `svgworm init` writes for Vue and Svelte run the
// crossOrigin "inject" loader, pinned by integrity, after SSR + hydration and after a
// client-only mount? Vue (Vite SPA), Nuxt (SSR and ssr: false), Svelte (Vite SPA), SvelteKit
// (SSR and ssr = false), in Chromium, Firefox and WebKit. Run prepare-apps and build-apps
// first. Spike code: evidence, not product.
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

import { CDN_PORT, HERE, OUT } from './shared.mjs';

const LATENCY = 120;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

let tamper = false;
const cdn = createServer(async (req, res) => {
  await wait(LATENCY);
  const path = req.url.split('?')[0];
  try {
    let body = await readFile(join(OUT, 'cdn', path));
    // A compromised CDN swaps the loader: the page's integrity pin must refuse it.
    if (tamper && path.includes('.loader.')) body = `window.__pwned=1;${body}`;
    res.writeHead(200, {
      'content-type': TYPES[extname(path)] ?? 'application/octet-stream',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => cdn.listen(CDN_PORT, '127.0.0.1', resolve));

const staticApp = (dir) =>
  new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const path = req.url.split('?')[0];
      const file = path === '/' || !extname(path) ? '/index.html' : path;
      try {
        const body = await readFile(join(OUT, dir, file));
        res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404).end();
      }
    });
    server.listen(0, '127.0.0.1', () =>
      resolve({ url: `http://127.0.0.1:${server.address().port}/`, stop: () => server.close() }),
    );
  });

let nextPort = 4320;
const nodeApp = async (entry) => {
  const port = nextPort++;
  const url = `http://127.0.0.1:${port}/`;
  const child = spawn(process.execPath, [join(OUT, entry)], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NITRO_HOST: '127.0.0.1', ORIGIN: url.slice(0, -1) },
    stdio: 'ignore',
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    await wait(100);
  }
  return { url, stop: () => child.kill() };
};

const APPS = [
  { name: 'vue-spa', framework: 'Vue', mount: 'client-only (Vite SPA)', start: () => staticApp('vue-spa') },
  { name: 'nuxt-ssr', framework: 'Nuxt', mount: 'SSR + hydration', start: () => nodeApp('nuxt-ssr/server/index.mjs') },
  { name: 'nuxt-spa', framework: 'Nuxt', mount: 'client-only (ssr: false)', start: () => nodeApp('nuxt-spa/server/index.mjs') },
  { name: 'svelte-spa', framework: 'Svelte', mount: 'client-only (Vite SPA, mount)', start: () => staticApp('svelte-spa') },
  { name: 'sveltekit-ssr', framework: 'SvelteKit', mount: 'SSR + hydration', start: () => nodeApp('sveltekit-ssr/index.js') },
  { name: 'sveltekit-spa', framework: 'SvelteKit', mount: 'client-only (ssr = false)', start: () => nodeApp('sveltekit-spa/index.js') },
];
// WebKit needs host libraries this machine lacks; WEBKIT_EXECUTABLE points at a wrapper that
// adds them (see RESULTS.md). CI-style hosts with `playwright install-deps` need nothing.
const ENGINES = [
  ['chromium', chromium, {}],
  ['firefox', firefox, {}],
  ['webkit', webkit, process.env.WEBKIT_EXECUTABLE ? { executablePath: process.env.WEBKIT_EXECUTABLE } : {}],
];

const SPRITE = 'svg[data-svgworm]';
const LOADER_TAG = 'script[src*="icons.loader."]';

// Share of the icon box painted red (the icon is mono, `color: #ff0000`), from a screenshot.
const redShare = async (page) => {
  const png = (await page.locator('#icon').screenshot()).toString('base64');
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let red = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] > 200 && pixels[index + 1] < 80 && pixels[index + 2] < 80) red++;
    }
    return red / (pixels.length / 4);
  }, png);
};

const open = async (browser, url) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const messages = [];
  page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
  await page.goto(url);
  await page.waitForSelector('html[data-mounted]', { timeout: 10000 });
  return { context, page, messages };
};

const rows = [];
for (const app of APPS) {
  const server = await app.start();
  const html = await (await fetch(server.url)).text();
  const inServerHtml = /<script[^>]*icons\.loader\./.test(html);
  for (const [engine, type, options] of ENGINES) {
    const browser = await type.launch(options);
    const row = { app: app.name, framework: app.framework, mount: app.mount, engine, inServerHtml };

    tamper = false;
    const { context, page, messages } = await open(browser, server.url);
    row.injected = await page
      .waitForSelector(SPRITE, { state: 'attached', timeout: 5000 })
      .then(() => true, () => false);
    row.sprites = await page.locator(SPRITE).count();
    row.loaderTags = await page.locator(LOADER_TAG).count();
    row.red = await redShare(page);
    // Unmount and mount the loader again, as a client navigation between layouts would.
    await page.click('#toggle');
    await page.click('#toggle');
    await wait(1000);
    row.spritesAfterRemount = await page.locator(SPRITE).count();
    row.redAfterRemount = await redShare(page);
    row.hydrationWarnings = messages.filter((text) => /hydrat|mismatch/i.test(text));
    row.errors = messages.filter((text) => /^(error|pageerror)/.test(text));
    await context.close();

    tamper = true;
    const swapped = await open(browser, server.url);
    await wait(2000);
    row.tamperedSprites = await swapped.page.locator(SPRITE).count();
    row.tamperedRan = await swapped.page.evaluate(() => window.__pwned === 1);
    row.tamperedErrors = swapped.messages.filter((text) => /^error/.test(text));
    await swapped.context.close();
    tamper = false;

    row.pass =
      row.injected &&
      row.sprites === 1 &&
      row.red > 0.2 &&
      row.spritesAfterRemount === 1 &&
      row.redAfterRemount > 0.2 &&
      row.hydrationWarnings.length === 0 &&
      row.errors.length === 0 &&
      row.tamperedSprites === 0 &&
      !row.tamperedRan &&
      (app.mount.startsWith('SSR') ? row.inServerHtml : true);
    rows.push(row);
    console.log(
      `${row.pass ? 'PASS' : 'FAIL'} ${app.name} ${engine} injected=${row.injected} sprites=${row.sprites} tags=${row.loaderTags} red=${row.red.toFixed(2)} remount=${row.spritesAfterRemount} ssrTag=${inServerHtml} tampered=${row.tamperedSprites}/${row.tamperedRan} warnings=${row.hydrationWarnings.length} errors=${row.errors.length}`,
    );
    if (!row.pass) console.log(JSON.stringify(row, null, 2));
    await browser.close();
  }
  server.stop();
}
cdn.close();

const yes = (value) => (value ? 'yes' : 'no');
const table = [
  '| App | Mount | Engine | Loader tag in server HTML | Sprite injected (count) | Icon painted (red share) | After loader remount | Swapped loader refused | Hydration warnings | Result |',
  '|-----|-------|--------|---------------------------|-------------------------|--------------------------|----------------------|------------------------|--------------------|--------|',
  ...rows.map(
    (row) =>
      `| ${row.framework} | ${row.mount} | ${row.engine} | ${yes(row.inServerHtml)} | ${yes(row.injected)} (${row.sprites}) | ${row.red.toFixed(2)} | ${row.spritesAfterRemount} sprite, ${row.redAfterRemount.toFixed(2)} | ${yes(row.tamperedSprites === 0 && !row.tamperedRan)} | ${row.hydrationWarnings.length} | ${row.pass ? 'pass' : 'FAIL'} |`,
  ),
];
await writeFile(
  join(HERE, 'results/matrix.md'),
  `# TSK-099 matrix\n\n${rows.filter((row) => row.pass).length} of ${rows.length} cases pass.\n\n${table.join('\n')}\n\nConsole errors on the swapped-loader page, first case: \`${rows[0]?.tamperedErrors[0] ?? 'none'}\`\n`,
);
console.log(`${rows.filter((row) => row.pass).length}/${rows.length} pass`);
process.exit(rows.every((row) => row.pass) ? 0 : 1);
