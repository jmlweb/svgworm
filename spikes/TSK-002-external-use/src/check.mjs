// Renders the test pages in Chromium, Firefox and WebKit through Playwright, screenshots
// every cell and compares it with the original icon rendered by the same engine.
// Spike code: evidence, not product.
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';
import { PNG } from 'pngjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '../out');
const FIXTURES = join(HERE, '../../../fixtures');
const RESULTS = join(HERE, '../results');
const PORT = 4302;
const ORIGIN = `http://localhost:${PORT}`;
const XORIGIN = `http://127.0.0.1:${PORT}`;
const ENGINES = { chromium, firefox, webkit };
const TYPES = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml' };

// Every response carries a permissive CORS header, so a cross-origin failure can't be
// blamed on missing CORS.
const serve = () =>
  createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, ORIGIN).pathname);
    const file = path.startsWith('/fixtures/') ? join(FIXTURES, normalize(path.slice(10))) : join(OUT, normalize(path));
    try {
      const body = await readFile(file, 'utf8');
      res.writeHead(200, {
        'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
        'access-control-allow-origin': '*',
        'cache-control': 'no-store'
      });
      res.end(path.endsWith('.html') ? body.replaceAll('{{XORIGIN}}', XORIGIN) : body);
    } catch {
      res.writeHead(404).end();
    }
  }).listen(PORT);

const pixels = buffer => {
  const png = PNG.sync.read(buffer);
  return { width: png.width, height: png.height, data: png.data };
};

// alpha = 1 - (white - black); color = black / alpha.
const crop = (white, black, x0, y0, w, h) => {
  const [x, y, width, height] = [x0, y0, w, h].map(Math.round);
  const data = Buffer.alloc(width * height * 4);
  for (let row = 0; row < height; row += 1)
    for (let col = 0; col < width; col += 1) {
      const src = ((y + row) * white.width + (x + col)) * 4;
      const dst = (row * width + col) * 4;
      const diff = [0, 1, 2].reduce((sum, c) => sum + (white.data[src + c] - black.data[src + c]), 0) / 3;
      const alpha = Math.max(0, Math.min(255, 255 - diff));
      [0, 1, 2].forEach(c => {
        data[dst + c] = alpha === 0 ? 0 : Math.min(255, Math.round((black.data[src + c] * 255) / alpha));
      });
      data[dst + 3] = Math.round(alpha);
    }
  return { width, height, data };
};

const alphaCount =({ data }) => {
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] >= 128) count += 1;
  return count;
};

// Fraction of pixels whose coverage differs by more than 64 (anti-aliasing tolerance).
const shapeDiff = (a, b) => {
  if (a.data.length !== b.data.length) return 1;
  let diff = 0;
  for (let i = 3; i < a.data.length; i += 4) if (Math.abs(a.data[i] - b.data[i]) > 64) diff += 1;
  return diff / (a.data.length / 4);
};

// Among pixels opaque in both, fraction whose color differs by more than 40 on any channel.
const colorDiff = (a, b) => {
  let both = 0;
  let diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i + 3] < 200 || b.data[i + 3] < 200) continue;
    both += 1;
    if ([0, 1, 2].some(c => Math.abs(a.data[i + c] - b.data[i + c]) > 40)) diff += 1;
  }
  return both === 0 ? 0 : diff / both;
};

const TARGETS = {
  red: [255, 0, 0],
  green: [0, 170, 0],
  blue: [0, 0, 255],
  black: [0, 0, 0]
};
// Fraction of opaque pixels that are NOT the target color.
const offColor = (img, rgb) => {
  let opaque = 0;
  let off = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 200) continue;
    opaque += 1;
    if ([0, 1, 2].some(c => Math.abs(img.data[i + c] - rgb[c]) > 60)) off += 1;
  }
  return opaque === 0 ? 1 : off / opaque;
};

// Most frequent opaque color, as a hex string.
const dominant = img => {
  const counts = new Map();
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 200) continue;
    const hex = `#${[0, 1, 2].map(c => img.data[i + c].toString(16).padStart(2, '0')).join('')}`;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'nothing';
};

const rightmost = img => {
  let right = 0;
  for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3] >= 128) right = Math.max(right, ((i / 4) % img.width) + 1);
  return right;
};

const bbox = img => {
  const box = { x0: Infinity, y0: Infinity, x1: -1, y1: -1 };
  for (let y = 0; y < img.height; y += 1)
    for (let x = 0; x < img.width; x += 1)
      if (img.data[(y * img.width + x) * 4 + 3] >= 128) {
        box.x0 = Math.min(box.x0, x);
        box.y0 = Math.min(box.y0, y);
        box.x1 = Math.max(box.x1, x);
        box.y1 = Math.max(box.y1, y);
      }
  return box.x1 < 0 ? null : `${box.x0},${box.y0}-${box.x1 + 1},${box.y1 + 1}`;
};

const SHAPE_MAX = 0.01;
const COLOR_MAX = 0.01;
const isMono = kind => kind.startsWith('mono');

// Verdict for one cell. `ref` is the original fixture as <img> in the same engine.
const judge = ({ column, kind }, img, ref) => {
  if (alphaCount(img) === 0) return { ok: false, verdict: 'blank' };
  if (column === 'probe') {
    if (kind === 'bbox') return { ok: true, verdict: `bbox ${bbox(img)}` };
    if (kind === 'green-left') {
      const off = offColor(img, TARGETS.green);
      const right = rightmost(img);
      const ok = off <= COLOR_MAX && right <= img.width * 0.55;
      return { ok, verdict: ok ? 'green, left half' : `renders ${dominant(img)}, right edge at ${right}/${img.width}px` };
    }
    const off = offColor(img, TARGETS[kind]);
    const seen = dominant(img);
    return { ok: off <= COLOR_MAX, verdict: off <= COLOR_MAX ? kind : `not ${kind}: renders ${seen}` };
  }
  const shape = shapeDiff(img, ref);
  const metrics = { shape: Number((shape * 100).toFixed(2)) };
  if (shape > SHAPE_MAX) return { ok: false, verdict: `shape differs ${metrics.shape}%`, metrics };
  const sizingOnly = column === 'ext-novb' || column === 'ext-css';
  if (sizingOnly) return { ok: true, verdict: 'ok', metrics };
  const wantsRed = (column.endsWith('-red') || column === 'mask-stack') && isMono(kind);
  if (column === 'mask-stack' && !isMono(kind)) return { ok: true, verdict: 'n/a (multicolor)', metrics };
  if (wantsRed) {
    const off = offColor(img, TARGETS.red);
    metrics.offRed = Number((off * 100).toFixed(2));
    return { ok: off <= COLOR_MAX, verdict: off <= COLOR_MAX ? 'ok' : `not fully currentColor (${metrics.offRed}% off)`, metrics };
  }
  // Mono icons in black: the shape check is enough (the original color may be #1e1e1e).
  if (isMono(kind)) return { ok: true, verdict: 'ok', metrics };
  const color = colorDiff(img, ref);
  metrics.color = Number((color * 100).toFixed(2));
  return { ok: color <= COLOR_MAX, verdict: color <= COLOR_MAX ? 'ok' : `color differs ${metrics.color}%`, metrics };
};

const runPage = async (browser, name, engine) => {
  const context = await browser.newContext({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const console_ = [];
  page.on('console', msg => (msg.type() === 'error' || msg.type() === 'warning') && console_.push(msg.text()));
  page.on('requestfailed', req => console_.push(`requestfailed ${req.url()} ${req.failure()?.errorText}`));
  const requests = [];
  page.on('request', req => requests.push(req.url()));
  await page.goto(`${ORIGIN}/${name}.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // Firefox can't take transparent element screenshots, so take the page on white and on
  // black and recover straight alpha and color from the pair (works the same in every engine).
  const onWhite = pixels(await page.screenshot({ fullPage: true }));
  await page.screenshot({ path: join(RESULTS, `${engine}-${name}.png`), fullPage: true, scale: 'css' });
  await page.evaluate(() => {
    document.body.style.background = '#000';
  });
  const onBlack = pixels(await page.screenshot({ fullPage: true }));
  const metas = await page.evaluate(() =>
    [...document.querySelectorAll('[data-cell]')].map(el => {
      const r = el.getBoundingClientRect();
      return { ...el.dataset, x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    })
  );
  const scale = 2;
  const shots = metas.map(({ x, y, w, h, ...meta }) => ({ ...meta, img: crop(onWhite, onBlack, x * scale, y * scale, w * scale, h * scale) }));
  await context.close();
  const refs = new Map(shots.filter(s => s.column === 'ref').map(s => [s.row, s.img]));
  const cellsOut = shots
    .filter(s => s.column !== 'ref')
    .map(s => ({ row: s.row, column: s.column, kind: s.kind, ...judge(s, s.img, refs.get(s.row)) }));
  const refBlank = shots.filter(s => s.column === 'ref' && alphaCount(s.img) === 0).map(s => s.row);
  return {
    cells: cellsOut,
    refBlank,
    console: [...new Set(console_)].sort(),
    crossOriginRequested: requests.some(url => url.startsWith(XORIGIN))
  };
};

const main = async () => {
  await mkdir(RESULTS, { recursive: true });
  const server = serve();
  const report = { date: new Date().toLocaleDateString('en-CA'), engines: {} };
  try {
    for (const [engine, type] of Object.entries(ENGINES)) {
      const browser = await type.launch();
      report.engines[engine] = { version: browser.version(), pages: {} };
      for (const name of ['external', 'inline']) {
        report.engines[engine].pages[name] = await runPage(browser, name, engine);
      }
      await browser.close();
      const failures = Object.values(report.engines[engine].pages).flatMap(p => p.cells.filter(c => !c.ok));
      console.log(`${engine} ${report.engines[engine].version}: ${failures.length} failing cells`);
      failures.forEach(f => console.log(`  ${f.column.padEnd(10)} ${f.row}: ${f.verdict}`));
    }
  } finally {
    server.close();
  }
  await writeFile(join(RESULTS, 'matrix.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(join(RESULTS, 'matrix.md'), toMarkdown(report));
};

// One table per page: row x column, each cell "C/F/W" verdicts.
const toMarkdown = report => {
  const engines = Object.keys(report.engines);
  const short = verdict => (verdict === 'ok' || verdict.startsWith('n/a') ? verdict.replace(/ \(.*/, '') : verdict);
  const pages = Object.keys(report.engines[engines[0]].pages);
  const sections = pages.map(name => {
    const cells = report.engines[engines[0]].pages[name].cells;
    const columns = [...new Set(cells.map(c => c.column))];
    const rows = [...new Set(cells.map(c => c.row))];
    const lookup = (engine, row, column) =>
      report.engines[engine].pages[name].cells.find(c => c.row === row && c.column === column);
    const lines = rows.map(row => {
      const values = columns.map(column => {
        const per = engines.map(engine => lookup(engine, row, column));
        if (per.every(c => !c)) return '';
        if (per.every(c => c?.ok)) return per[0].verdict.startsWith('bbox') ? per.map(c => c.verdict).join(' / ') : 'pass';
        return engines.map((engine, i) => `${engine[0].toUpperCase()}: ${per[i] ? (per[i].ok ? 'pass' : `**${short(per[i].verdict)}**`) : '-'}`).join('<br>');
      });
      return `| \`${row}\` | ${values.join(' | ')} |`;
    });
    return [`### ${name}`, '', `| row | ${columns.join(' | ')} |`, `|${'---|'.repeat(columns.length + 1)}`, ...lines, ''].join('\n');
  });
  const versions = engines.map(e => `${e} ${report.engines[e].version}`).join(', ');
  return [`# Matrix (generated by src/check.mjs, ${report.date})`, '', `Engines: ${versions} (Playwright 1.58.2). "pass" means all three engines pass.`, '', ...sections].join('\n');
};

await main();
