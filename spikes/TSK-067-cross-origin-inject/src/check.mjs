// TSK-067 spike: can a sprite on another origin (a CDN) be fetched with CORS + SRI and injected,
// so `<use href="#id">` renders it, in Chromium, Firefox and WebKit? Also: SRI mismatch, CDN
// without CORS, stack icons (img, mask) cross-origin, CSP, layout shift, time to inject,
// duplicate loaders, page/icon id collisions, React 19 hydration.
// Spike code: evidence, not product.
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium, firefox, webkit } from 'playwright';

import { compile } from '../../../packages/svgworm/dist/index.js';
import { emitLoader } from '../../../packages/svgworm/dist/core/emit/loader.js';
import { makeLoader as spikeLoader } from './loader.mjs';

// PRODUCT=1 checks the loader the built core emits instead of the spike's draft.
const makeLoader = process.env.PRODUCT === '1' ? emitLoader : spikeLoader;

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '../out');
const RESULTS = join(HERE, '../results');
const FIXTURES = join(HERE, '../../../fixtures');
const ONLY = process.env.ENGINES?.split(',');
// Every response waits this long on both servers, so request chains show up in the timings.
const LATENCY = Number(process.env.LATENCY ?? 120);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Real svgworm output: every valid fixture, compiled by the built core ---

const entries = await readdir(FIXTURES, { recursive: true, withFileTypes: true });
const sources = await Promise.all(
  entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
    .map(async (entry) => {
      const absolute = join(entry.parentPath, entry.name);
      const relativePath = relative(FIXTURES, absolute).replaceAll('\\', '/');
      return { path: `fixtures/${relativePath}`, relativePath, content: await readFile(absolute) };
    }),
);
const result = compile(
  sources.filter(
    (source) =>
      !source.relativePath.startsWith('invalid/') && source.relativePath !== 'style/unscopable-media.svg',
  ),
  { flatten: false, publicPath: '/icons', color: [] },
);
if (!result.ok) throw new Error(JSON.stringify(result.errors, null, 2));
const spriteFile = result.files.find((file) => file.target === 'outDir' && !file.name.includes('.stack.'));
const stackFile = result.files.find((file) => file.name.includes('.stack.'));
const icons = result.manifest.icons;
const pick = (delivery, count) => icons.filter((icon) => icon.delivery === delivery).slice(0, count);
// Mono and multicolor `use` icons, including ones with internal ids (not url refs: those go to the stack).
const still = (icon) => !icon.name.startsWith('animation/');
const USE = [
  ...pick('use', 200).filter(still).filter((icon) => icon.color === 'mono').slice(0, 3),
  ...pick('use', 200).filter(still).filter((icon) => icon.color === 'multicolor').slice(0, 3),
];
const IMG = pick('img', 3);
const MASK = pick('mask', 3);

const sri = (text) => `sha384-${createHash('sha384').update(text).digest('base64')}`;
const SPRITE_SRI = sri(spriteFile.content);

// --- Servers: the page origin and a "CDN" on another origin (127.0.0.1 vs localhost) ---

const listen = (handler) =>
  new Promise((resolve) => {
    const server = createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
const TYPES = { svg: 'image/svg+xml', js: 'text/javascript' };
const typeOf = (name) => TYPES[name.split('.').at(-1)] ?? 'application/octet-stream';

let cdnOrigin = '';
const cdnFiles = () => ({
  [spriteFile.name]: spriteFile.content,
  [stackFile.name]: stackFile.content,
  'tampered.svg': spriteFile.content.replace('<symbol', '<symbol data-x="1"'),
  'loader-ok.js': makeLoader(`${cdnOrigin}/cors/${spriteFile.name}`, SPRITE_SRI),
  'loader-bad-sri.js': makeLoader(`${cdnOrigin}/cors/tampered.svg`, SPRITE_SRI),
  'loader-nocors.js': makeLoader(`${cdnOrigin}/nocors/${spriteFile.name}`, SPRITE_SRI),
  'loader-evil.js': makeLoader(`${cdnOrigin}/cors/evil.svg`, sri(EVIL)),
  // The CDN is compromised: the loader itself is swapped. The page pins the genuine loader's hash.
  'loader-tampered.js': `window.__pwned='loader';${makeLoader(`${cdnOrigin}/cors/${spriteFile.name}`, SPRITE_SRI)}`,
  'loader-slow.js': makeLoader(`${cdnOrigin}/cors/${spriteFile.name}`, SPRITE_SRI),
  'evil.svg': EVIL,
  'loader-evil2.js': makeLoader(`${cdnOrigin}/cors/evil2.svg`, sri(EVIL2)),
  'evil2.svg': EVIL2,
  'loader-xhtml-root.js': makeLoader(`${cdnOrigin}/cors/xhtml-root.svg`, sri(XHTML_ROOT)),
  'xhtml-root.svg': XHTML_ROOT,
});
const EVIL =
  '<svg xmlns="http://www.w3.org/2000/svg" onload="window.__pwned=1"><script>window.__pwned=2</script>' +
  '<symbol id="i-evil" viewBox="0 0 1 1"><rect width="1" height="1" onclick="window.__pwned=3"/>' +
  '<a href="javascript:window.__pwned=4"><rect width="1" height="1"/></a></symbol></svg>';

// Payloads from the security review (2026-10-15): obfuscated javascript:, HTML elements in
// another namespace, a page-wide <style>, an external image, SMIL retargeting a link.
const EVIL2 =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink">' +
  '<style>body{display:none}</style>' +
  '<h:iframe srcdoc="&lt;script&gt;parent.__pwned=6&lt;/script&gt;"/>' +
  '<h:base href="https://evil.invalid/"/>' +
  '<symbol id="i-evil2" viewBox="0 0 1 1">' +
  '<a href="java&#9;script:window.__pwned=5"><rect width="1" height="1"/></a>' +
  '<a xlink:href="&#10;javascript:window.__pwned=7"><rect width="1" height="1"/></a>' +
  '<image href="https://evil.invalid/x.png" width="1" height="1"/>' +
  '<rect width="1" height="1"><set attributeName="href" to="javascript:window.__pwned=8"/></rect>' +
  '<rect width="1" height="1" style="fill:url(https://evil.invalid/f.svg#a)"/>' +
  '</symbol></svg>';
const XHTML_ROOT = '<svg xmlns="http://www.w3.org/1999/xhtml"><iframe srcdoc="&lt;script&gt;parent.__pwned=9&lt;/script&gt;"></iframe></svg>';

const cdn = await listen(async (req, res) => {
  const [, mode, name] = req.url.split('?')[0].split('/');
  await wait(name === 'loader-slow.js' ? 1500 : LATENCY);
  const body = cdnFiles()[name];
  if (body === undefined) return res.writeHead(404).end();
  const headers = { 'content-type': typeOf(name), 'cache-control': 'no-store' };
  if (mode === 'cors') headers['access-control-allow-origin'] = '*';
  res.writeHead(200, headers).end(body);
});
cdnOrigin = `http://localhost:${cdn.address().port}`;

// --- Pages ---

const cells = {
  same: (icon) =>
    `<svg class="cell" data-id="${icon.id}" width="48" height="48" viewBox="${icon.viewBox}" focusable="false"><use href="/same/${spriteFile.name}#${icon.id}"/></svg>`,
  inject: (icon) =>
    `<svg class="cell" data-id="${icon.id}" width="48" height="48" viewBox="${icon.viewBox}" focusable="false"><use href="#${icon.id}"/></svg>`,
  img: (base) => (icon) =>
    `<img class="cell" data-id="${icon.id}" src="${base}/${stackFile.name}#${icon.id}" width="48" height="48" alt="">`,
  mask: (base) => (icon) =>
    `<span class="cell" data-id="${icon.id}" style="display:inline-block;width:48px;height:48px;color:#ff0000;background-color:currentColor;mask:url(&quot;${base}/${stackFile.name}#${icon.id}&quot;) center / contain no-repeat"></span>`,
};
// Records when the injected sprite appears and any layout shift, before any other script runs.
const OBSERVER = `<script>window.__t={};window.__cls=0;new MutationObserver(()=>{if(!window.__t.inject&&document.querySelector('svg[data-svgworm]'))window.__t.inject=performance.now()}).observe(document.documentElement,{subtree:true,childList:true});try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch{}</script>`;
const doc = ({ head = '', body, observer = true }) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>spike</title>${observer ? OBSERVER : ''}${head}</head><body style="margin:0;background:#fff;color:#000">${body}<p id="below">below</p></body></html>`;
const loaderTag = (name, integrity) =>
  integrity
    ? `<script async src="${cdnOrigin}/cors/${name}" integrity="${integrity}" crossorigin="anonymous"></script>`
    : `<script async src="${cdnOrigin}/cors/${name}"></script>`;
const LOADER_SRI = () => sri(cdnFiles()['loader-ok.js']);
const row = (id, items) => `<div id="${id}" style="display:flex;gap:0;line-height:0">${items.join('')}</div>`;

const PAGES = {
  inject: () => doc({ head: loaderTag('loader-ok.js'), body: row('ref', USE.map(cells.same)) + row('test', USE.map(cells.inject)) }),
  same: () => doc({ body: row('ref', USE.map(cells.same)) }),
  'sri-mismatch': () => doc({ head: loaderTag('loader-bad-sri.js'), body: row('test', USE.map(cells.inject)) }),
  'no-cors': () => doc({ head: loaderTag('loader-nocors.js'), body: row('test', USE.map(cells.inject)) }),
  stack: () =>
    doc({
      body:
        row('ref-img', IMG.map(cells.img('/same'))) +
        row('img-cors', IMG.map(cells.img(`${cdnOrigin}/cors`))) +
        row('img-nocors', IMG.map(cells.img(`${cdnOrigin}/nocors`))) +
        row('ref-mask', MASK.map(cells.mask('/same'))) +
        row('mask-cors', MASK.map(cells.mask(`${cdnOrigin}/cors`))) +
        row('mask-nocors', MASK.map(cells.mask(`${cdnOrigin}/nocors`))),
    }),
  'csp-ok': () => doc({ observer: false, head: loaderTag('loader-ok.js'), body: row('ref', USE.map(cells.same)) + row('test', USE.map(cells.inject)) }),
  'csp-no-connect': () => doc({ observer: false, head: loaderTag('loader-ok.js'), body: row('test', USE.map(cells.inject)) }),
  duplicate: () =>
    doc({
      head: loaderTag('loader-ok.js') + loaderTag('loader-ok.js'),
      body: row('ref', USE.map(cells.same)) + row('test', USE.map(cells.inject)),
    }),
  // A page element with a symbol's id, placed before and after the injected sprite.
  collide: () =>
    doc({
      head: loaderTag('loader-ok.js'),
      body:
        `<div id="${USE[0].id}" hidden></div>` +
        row('ref', USE.map(cells.same)) +
        row('test', USE.map(cells.inject)),
    }),
  'loader-pinned': () => doc({ head: loaderTag('loader-ok.js', LOADER_SRI()), body: row('ref', USE.map(cells.same)) + row('test', USE.map(cells.inject)) }),
  'loader-tampered': () => doc({ head: loaderTag('loader-tampered.js', LOADER_SRI()), body: row('test', USE.map(cells.inject)) }),
  evil2: () => doc({ head: loaderTag('loader-evil2.js'), body: '<p id="probe">visible</p>' }),
  'xhtml-root': () => doc({ head: loaderTag('loader-xhtml-root.js'), body: '<p>x</p>' }),
  evil: () => doc({ head: loaderTag('loader-evil.js'), body: '<svg width="10" height="10"><use href="#i-evil"/></svg>' }),
};
const CSP = {
  'csp-ok': `default-src 'self'; script-src 'self' ${cdnOrigin}; connect-src 'self' ${cdnOrigin}; img-src 'self' ${cdnOrigin}; style-src 'self' 'unsafe-inline'`,
  'csp-no-connect': `default-src 'self'; script-src 'self' ${cdnOrigin}; connect-src 'self'; style-src 'self' 'unsafe-inline'`,
};

// React: server-render the document, hydrate it with a client bundle served by the page origin.
await mkdir(OUT, { recursive: true });
const reactProps = {
  icons: USE.map(({ id, viewBox }) => ({ id, viewBox })),
  loaderUrl: `${cdnOrigin}/cors/loader-ok.js`,
  clientUrl: '/client.js',
};
await build({
  entryPoints: [join(HERE, 'client.jsx')],
  bundle: true,
  format: 'esm',
  outfile: join(OUT, 'client.js'),
  jsx: 'automatic',
  define: { __PROPS__: JSON.stringify(reactProps), 'process.env.NODE_ENV': '"development"' },
  logLevel: 'error',
});
await build({
  stdin: {
    contents: `import { renderToString } from 'react-dom/server'; import { App } from './app.jsx'; export const render = (p) => '<!doctype html>' + renderToString(<App {...p} />);`,
    resolveDir: HERE,
    loader: 'jsx',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  outfile: join(HERE, 'server.gen.mjs'),
  jsx: 'automatic',
  logLevel: 'error',
});
const { render } = await import(join(HERE, 'server.gen.mjs'));
const clientJs = await readFile(join(OUT, 'client.js'), 'utf8');

const page = await listen(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  await wait(LATENCY);
  if (url.pathname.startsWith('/same/')) {
    const name = url.pathname.slice('/same/'.length);
    const body = name === spriteFile.name ? spriteFile.content : name === stackFile.name ? stackFile.content : undefined;
    if (body === undefined) return res.writeHead(404).end();
    return res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' }).end(body);
  }
  if (url.pathname === '/client.js') return res.writeHead(200, { 'content-type': 'text/javascript' }).end(clientJs);
  const name = url.pathname.slice(1);
  if (name === 'react') return res.writeHead(200, { 'content-type': 'text/html' }).end(render(reactProps));
  if (name === 'react-late') return res.writeHead(200, { 'content-type': 'text/html' }).end(render({ ...reactProps, loaderUrl: `${cdnOrigin}/cors/loader-slow.js` }));
  const make = PAGES[name];
  if (make === undefined) return res.writeHead(404).end();
  const headers = { 'content-type': 'text/html', 'cache-control': 'no-store' };
  if (CSP[name]) headers['content-security-policy'] = CSP[name];
  res.writeHead(200, headers).end(make());
});
const pageOrigin = `http://127.0.0.1:${page.address().port}`;

// --- Pixel comparison, decoded by the browser itself (no PNG dependency) ---

let helper;
const analyze = (_tab, testPng, refPng) =>
  helper.evaluate(
    async ([a, b]) => {
      const load = async (b64) => {
        if (!b64) return null;
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height).data;
      };
      const [t, r] = [await load(a), await load(b)];
      let ink = 0;
      let diff = 0;
      let red = 0;
      for (let i = 0; i < t.length; i += 4) {
        const isInk = t[i] < 200 || t[i + 1] < 200 || t[i + 2] < 200;
        if (isInk) ink += 1;
        if (isInk && t[i] > 200 && t[i + 1] < 60 && t[i + 2] < 60) red += 1;
        if (r && Math.max(Math.abs(t[i] - r[i]), Math.abs(t[i + 1] - r[i + 1]), Math.abs(t[i + 2] - r[i + 2])) > 64)
          diff += 1;
      }
      const total = t.length / 4;
      return { ink: ink / total, diff: r ? diff / total : null, red: ink ? red / ink : 0 };
    },
    [testPng?.toString('base64'), refPng?.toString('base64')],
  );
const shot = async (tab, selector) => {
  const locator = tab.locator(selector);
  return (await locator.count()) ? locator.screenshot() : null;
};

const settle = async (tab) => {
  await tab.waitForLoadState('load');
  await tab.waitForTimeout(600);
};

// --- Run ---

const engines = [chromium, firefox, webkit].filter((engine) => !ONLY || ONLY.includes(engine.name()));
const rows = [];
const timings = {};
const add = (engine, scenario, pass, detail) => {
  rows.push({ engine, scenario, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${engine} ${scenario}: ${detail}`);
};

for (const engine of engines) {
  const name = engine.name();
  const browser = await engine.launch();
  helper = await (await browser.newContext()).newPage();
  const open = async (path) => {
    const context = await browser.newContext({ viewport: { width: 600, height: 400 } });
    const tab = await context.newPage();
    const logs = [];
    tab.on('console', (message) => logs.push(`${message.type()}: ${message.text()}`));
    tab.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`));
    await tab.goto(`${pageOrigin}/${path}`);
    await settle(tab);
    return { tab, logs, close: () => context.close() };
  };
  const injected = (tab) => tab.evaluate(() => document.querySelectorAll('svg[data-svgworm]').length);
  const compareRows = async (tab, testRow, refRow) => {
    const a = await analyze(tab, await shot(tab, `#${testRow}`), await shot(tab, `#${refRow}`));
    return a;
  };

  {
    const { tab, logs, close } = await open('inject');
    const a = await compareRows(tab, 'test', 'ref');
    const t = await tab.evaluate(() => window.__t.inject);
    timings[name] = { ...timings[name], inject: t };
    const cls = await tab.evaluate(() => window.__cls);
    add(name, 'inject: use #id renders like same-origin external use', a.diff < 0.01 && a.ink > 0.02, `diff ${(a.diff * 100).toFixed(2)}% ink ${(a.ink * 100).toFixed(1)}%, injected ${await injected(tab)}, at ${t?.toFixed(0)} ms, CLS ${cls}, errors ${logs.filter((l) => l.startsWith('error')).length}`);
    await close();
  }
  {
    const { tab, close } = await open('same');
    const end = await tab.evaluate(
      (sprite) => performance.getEntriesByType('resource').find((e) => e.name.includes(sprite))?.responseEnd,
      spriteFile.name,
    );
    timings[name] = { ...timings[name], same: end };
    add(name, `time to sprite: same-origin responseEnd vs injected (latency ${LATENCY} ms per response)`, true, `same-origin ${end?.toFixed(0)} ms, injected ${timings[name].inject?.toFixed(0)} ms, delta ${(timings[name].inject - end).toFixed(0)} ms`);
    await close();
  }
  {
    const { tab, logs, close } = await open('sri-mismatch');
    const a = await analyze(tab, await shot(tab, '#test'));
    const n = await injected(tab);
    add(name, 'SRI mismatch injects nothing, logs an error', n === 0 && a.ink < 0.001 && logs.some((l) => l.includes('svgworm: sprite not loaded')), `injected ${n}, ink ${(a.ink * 100).toFixed(2)}%, log: ${logs.find((l) => l.includes('svgworm')) ?? logs[0] ?? 'none'}`);
    await close();
  }
  {
    const { tab, logs, close } = await open('no-cors');
    const n = await injected(tab);
    add(name, 'CDN without CORS injects nothing, logs an error', n === 0 && logs.some((l) => l.includes('svgworm: sprite not loaded')), `injected ${n}, log: ${logs.find((l) => l.includes('svgworm')) ?? 'none'}`);
    await close();
  }
  {
    const { tab, close } = await open('stack');
    for (const [test, ref] of [
      ['img-cors', 'ref-img'],
      ['img-nocors', 'ref-img'],
      ['mask-cors', 'ref-mask'],
      ['mask-nocors', 'ref-mask'],
    ]) {
      const a = await compareRows(tab, test, ref);
      // CSS mask images are fetched in CORS mode, so a CDN without CORS must leave the mask blank.
      const expectBlank = test === 'mask-nocors';
      add(name, expectBlank ? 'stack mask-nocors: blank (masks need CORS), as expected' : `stack ${test} cross-origin renders like same-origin`, expectBlank ? a.ink < 0.001 : a.diff < 0.01 && a.ink > 0.02, `diff ${(a.diff * 100).toFixed(2)}% ink ${(a.ink * 100).toFixed(1)}%${test.startsWith('mask') ? ` red ${(a.red * 100).toFixed(0)}%` : ''}`);
    }
    await close();
  }
  {
    const { tab, logs, close } = await open('csp-ok');
    const a = await compareRows(tab, 'test', 'ref');
    add(name, 'CSP script-src + connect-src CDN: works', a.diff < 0.01 && a.ink > 0.02, `diff ${(a.diff * 100).toFixed(2)}%, CSP errors ${logs.filter((l) => /Content.Security|CSP/i.test(l)).length}`);
    await close();
  }
  {
    const { tab, logs, close } = await open('csp-no-connect');
    const n = await injected(tab);
    add(name, 'CSP without connect-src CDN: blocked, nothing injected', n === 0, `injected ${n}, logs: ${logs.slice(0, 2).join(' | ').slice(0, 220)}`);
    await close();
  }
  {
    const { tab, logs, close } = await open('duplicate');
    // A client-side navigation that adds the same loader tag again.
    await tab.evaluate((src) => {
      const script = document.createElement('script');
      script.src = src;
      document.head.append(script);
    }, `${cdnOrigin}/cors/loader-ok.js`);
    await tab.waitForTimeout(600);
    const n = await injected(tab);
    const a = await compareRows(tab, 'test', 'ref');
    add(name, 'duplicate loader tags + re-added tag inject once', n === 1 && a.diff < 0.01, `injected ${n}, diff ${(a.diff * 100).toFixed(2)}%, errors ${logs.filter((l) => l.startsWith('error')).length}`);
    await close();
  }
  {
    const { tab, close } = await open('collide');
    const first = await tab.evaluate((id) => document.getElementById(id)?.localName, USE[0].id);
    const a = await analyze(tab, await shot(tab, `#test svg[data-id="${USE[0].id}"]`), await shot(tab, `#ref svg[data-id="${USE[0].id}"]`));
    add(name, 'page id equal to a symbol id: sprite is prepended, so the symbol wins', a.diff < 0.01, `getElementById → <${first}>, diff ${(a.diff * 100).toFixed(2)}%`);
    await close();
  }
  {
    const { tab, logs, close } = await open('loader-pinned');
    const a = await compareRows(tab, 'test', 'ref');
    add(name, 'loader with integrity + crossorigin: works', a.diff < 0.01 && a.ink > 0.02, `diff ${(a.diff * 100).toFixed(2)}%, errors ${logs.filter((l) => l.startsWith('error')).length}`);
    await close();
  }
  {
    const { tab, logs, close } = await open('loader-tampered');
    const state = await tab.evaluate(() => ({ pwned: window.__pwned ?? null, injected: document.querySelectorAll('svg[data-svgworm]').length }));
    add(name, 'tampered loader with pinned integrity: never runs', state.pwned === null && state.injected === 0, `${JSON.stringify(state)}, log: ${(logs.find((l) => /integrity|digest|hash/i.test(l)) ?? logs[0] ?? 'none').slice(0, 200)}`);
    await close();
  }
  {
    // Astro's ClientRouter and similar routers swap <body>; the injected sprite goes with it.
    const { tab, close } = await open('inject');
    await tab.evaluate(() => {
      const next = document.body.cloneNode(true);
      next.querySelector('svg[data-svgworm]')?.remove();
      document.body.replaceWith(next);
    });
    await tab.waitForTimeout(300);
    const n = await injected(tab);
    const a = await analyze(tab, await shot(tab, '#test'));
    add(name, 'body swap (view transitions): the loader re-injects the sprite', n === 1 && a.ink > 0.02, `injected after swap ${n}, ink ${(a.ink * 100).toFixed(2)}%`);
    await close();
  }
  {
    const { tab, close } = await open('evil');
    const pwned = await tab.evaluate(async () => {
      document.querySelector('[data-svgworm] rect')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      document.querySelector('[data-svgworm] a')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { pwned: window.__pwned ?? null, injected: document.querySelectorAll('svg[data-svgworm]').length, scripts: document.querySelectorAll('[data-svgworm] script').length };
    });
    add(name, 'hostile sprite (with valid SRI): no script, handler or javascript: URL runs', pwned.pwned === null, JSON.stringify(pwned));
    await close();
  }
  {
    const { tab, close } = await open('evil2');
    await tab.waitForTimeout(400);
    const state = await tab.evaluate(() => {
      const n = document.querySelector('svg[data-svgworm]');
      document.querySelectorAll('[data-svgworm] a, [data-svgworm] rect').forEach((e) =>
        e.dispatchEvent(new MouseEvent('click', { bubbles: true })),
      );
      return {
        pwned: window.__pwned ?? null,
        injected: n ? 1 : 0,
        left: n ? [...n.querySelectorAll('*')].map((e) => e.localName).filter((x) => /^(style|iframe|base|a|set)$/.test(x)) : [],
        externalAttrs: n ? [...n.querySelectorAll('*')].flatMap((e) => [...e.attributes].filter((a) => a.name !== "id" && /evil|javascript/i.test(a.value)).map((a) => a.name)) : [],
        baseURI: document.baseURI.startsWith(location.origin),
        bodyVisible: getComputedStyle(document.body).display !== 'none',
      };
    });
    await tab.waitForTimeout(300);
    const pwned = await tab.evaluate(() => window.__pwned ?? null);
    add(name, 'review payloads (obfuscated javascript:, XHTML iframe/base, <style>, external image, SMIL href): all dropped', pwned === null && state.injected === 1 && state.left.length === 0 && state.externalAttrs.length === 0 && state.baseURI && state.bodyVisible, JSON.stringify({ ...state, pwned }));
    await close();
  }
  {
    const { tab, close } = await open('xhtml-root');
    await tab.waitForTimeout(400);
    const state = await tab.evaluate(() => ({ pwned: window.__pwned ?? null, injected: document.querySelectorAll('[data-svgworm]').length, iframes: document.querySelectorAll('iframe').length }));
    add(name, 'root in the XHTML namespace: rejected, nothing injected', state.pwned === null && state.injected === 0 && state.iframes === 0, JSON.stringify(state));
    await close();
  }
  for (const [path, delay] of [['react', 1500], ['react-late', 0]]) {
    const { tab, logs, close } = await open(`${path}?hydrateDelay=${delay}`);
    await tab.waitForTimeout(1600);
    await tab.waitForTimeout(delay + 600);
    await tab.click('#bump');
    await tab.waitForTimeout(200);
    const state = await tab.evaluate(() => ({
      order: (window.__tHydrate ?? Infinity) < (window.__tInject ?? Infinity) ? 'hydrate first' : 'inject first',
      hydrated: window.__hydrated === true,
      injected: document.querySelectorAll('svg[data-svgworm]').length,
      label: document.querySelector('#bump').textContent,
    }));
    const a = await analyze(tab, await shot(tab, '#cells'));
    const errors = logs.filter((l) => l.startsWith('error') || l.startsWith('pageerror'));
    add(name, `React 19 hydration (${path}): sprite kept, no hydration error`, state.hydrated && state.injected === 1 && state.label === 'bumped 1' && a.ink > 0.02 && errors.length === 0, `${JSON.stringify(state)}, ink ${(a.ink * 100).toFixed(1)}%, errors: ${errors.join(' | ').slice(0, 300) || 'none'}`);
    await close();
  }
  await browser.close();
}
cdn.close();
page.close();

await mkdir(RESULTS, { recursive: true });
const loaderBytes = Buffer.byteLength(makeLoader(`https://cdn.example.com/icons/${spriteFile.name}`, SPRITE_SRI));
const table = [
  `Loader: ${loaderBytes} B unminified (with a real URL and sha384), no dependencies. Sprite ${Buffer.byteLength(spriteFile.content)} B, ${USE.length} use / ${IMG.length} img / ${MASK.length} mask icons checked.`,
  '',
  '| Engine | Scenario | Pass | Detail |',
  '| --- | --- | --- | --- |',
  ...rows.map((r) => `| ${r.engine} | ${r.scenario} | ${r.pass ? 'yes' : 'NO'} | ${r.detail.replaceAll('|', '\\|')} |`),
].join('\n');
await writeFile(join(RESULTS, 'matrix.md'), `${table}\n`);
console.log(`\n${rows.filter((r) => r.pass).length}/${rows.length} pass`);
