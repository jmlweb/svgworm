// Browser rendering matrix on the PRODUCT output (TSK-035, .claude/rules/testing.md, ADR-0006).
// Compiles fixtures/** with the built core, serves the result same-origin over HTTP, renders every
// icon in the delivery form its manifest names in Chromium, Firefox and WebKit, and compares each
// against the original fixture as <img> rendered by the same engine. Method ported from
// spikes/TSK-002-external-use/src/check.mjs.
//
// Usage: node scripts/render-check.mjs   (run `pnpm build` first)
// Writes tests/render/matrix.json (pass/fail/skipped per cell, no numbers, so it is byte-identical
// across runs and operating systems) and tests/render/out/metrics.json (raw percentages, ignored by git).
// Exits 1 when any cell fails.
/* oxlint-disable no-undef -- document and window are used inside page.evaluate, which runs in the browser */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';
import { PNG } from 'pngjs';

import { compile } from '../packages/svgworm/dist/index.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FIXTURES = join(ROOT, 'fixtures');
const MATRIX_DIR = join(ROOT, 'tests/render');
const ENGINES = { chromium, firefox, webkit };
const SIZE = 48;
const SCALE = 2;
const SHAPE_MAX = 0.01;
const COLOR_MAX = 0.01;
const RED = [255, 0, 0];

// The same exclusions as packages/svgworm/src/core/compile.test.ts: errors by design.
const isInvalid = (relativePath) =>
  relativePath.startsWith('invalid/') ||
  relativePath === 'style/unscopable-media.svg';

// Fixtures whose SMIL animation runs in both the reference <img> and the product, so two
// screenshots show different frames. An <img> cannot be paused from the page.
const ANIMATED = new Set(['animation/pulse-fill', 'animation/spin']);
const ANIMATED_REASON =
  'SMIL animation: the <img> reference cannot be paused, so the frames differ';

const MODES = [
  { name: 'default', options: { publicPath: '/icons' } },
  {
    name: 'inject',
    options: { publicPath: '/inject', crossOrigin: 'inject' },
  },
];

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const readFixtures = async () => {
  const entries = await readdir(FIXTURES, {
    recursive: true,
    withFileTypes: true,
  });
  const sources = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
      .map(async (entry) => {
        const absolute = join(entry.parentPath, entry.name);
        const relativePath = relative(FIXTURES, absolute).replaceAll('\\', '/');
        return {
          path: `fixtures/${relativePath}`,
          relativePath,
          content: await readFile(absolute),
        };
      }),
  );
  return sources.filter((source) => !isInvalid(source.relativePath));
};

// Each cell is one icon in one form. `use-inject` is the `use` form of a crossOrigin: "inject"
// build, where the loader script puts the sprite in the page and the icon references `#id`.
const buildCells = (manifest, mode) => {
  const [group] = Object.values(manifest.sprites);
  return Object.entries(manifest.icons)
    .map(([name, icon]) => ({ name, icon }))
    .filter(({ icon }) => mode === 'default' || icon.delivery === 'use')
    .map(({ name, icon }) => {
      const form =
        mode === 'inject' && icon.delivery === 'use'
          ? 'use-inject'
          : icon.delivery;
      const href =
        form === 'use'
          ? `${group.sprite.url}#${icon.id}`
          : form === 'use-inject'
            ? `#${icon.id}`
            : `${group.stack.url}#${icon.id}`;
      return { name, form, icon, href, mode };
    });
};

const productHtml = ({ form, icon, href }) => {
  // Mono icons get a red `color`, so the recoloring through currentColor is verified too.
  const color = icon.color === 'mono' ? 'color:#ff0000;' : '';
  if (form === 'img')
    return `<img src="${href}" width="${SIZE}" height="${SIZE}" alt="">`;
  if (form === 'mask')
    return `<span style="display:inline-block;width:${SIZE}px;height:${SIZE}px;background-color:currentColor;mask:url('${href}') center / contain no-repeat;${color}"></span>`;
  return `<svg viewBox="${icon.viewBox}" width="${SIZE}" height="${SIZE}" style="${color}" focusable="false" aria-hidden="true"><use href="${href}"/></svg>`;
};

// Integer pixel grid, so cells crop at the same device pixels in every engine.
const STYLE = `<style>
  body { margin: 16px; background: #fff; color: #000; }
  .grid { display: grid; grid-template-columns: repeat(8, 128px); grid-auto-rows: 64px; }
  .item { display: flex; gap: 8px; padding: 8px 0 0 8px; }
  .cell { width: ${SIZE}px; height: ${SIZE}px; line-height: 0; }
  .cell > svg, .cell > img { display: block; }
</style>`;

const pageHtml = (cells, loaderTag) => {
  const items = cells
    .map((cell, index) => {
      const ref = `<img src="/fixtures/${encodeURI(`${cell.name}.svg`)}" width="${SIZE}" height="${SIZE}" alt="">`;
      return `<div class="item"><div class="cell" data-cell data-index="${index}" data-role="ref">${ref}</div><div class="cell" data-cell data-index="${index}" data-role="product">${productHtml(cell)}</div></div>`;
    })
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>render</title>${STYLE}${loaderTag}</head><body><div class="grid">${items}</div></body></html>`;
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.js': 'text/javascript; charset=utf-8',
};

// Serves fixtures from disk and each mode's generated files from memory, all under one origin.
const serve = (modes) => {
  const files = new Map();
  modes.forEach(({ publicPath, result, page }) => {
    result.files.forEach((file) =>
      files.set(`${publicPath}/${file.name}`, file.content),
    );
    files.set(`/pages${publicPath}.html`, page);
  });
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    );
    try {
      const body = path.startsWith('/fixtures/')
        ? await readFile(join(FIXTURES, path.slice('/fixtures/'.length)))
        : files.get(path);
      if (body === undefined) throw new Error('not found');
      res.writeHead(200, {
        'content-type': TYPES[extname(path)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve(server)),
  );
};

const pixels = (buffer) => {
  const png = PNG.sync.read(buffer);
  return { width: png.width, height: png.height, data: png.data };
};

// alpha = 1 - (white - black); straight color = black / alpha.
const crop = (white, black, x0, y0, w, h) => {
  const [x, y, width, height] = [x0, y0, w, h].map(Math.round);
  const data = Buffer.alloc(width * height * 4);
  for (let row = 0; row < height; row += 1)
    for (let col = 0; col < width; col += 1) {
      const src = ((y + row) * white.width + (x + col)) * 4;
      const dst = (row * width + col) * 4;
      const diff =
        [0, 1, 2].reduce(
          (sum, c) => sum + (white.data[src + c] - black.data[src + c]),
          0,
        ) / 3;
      const alpha = Math.max(0, Math.min(255, 255 - diff));
      [0, 1, 2].forEach((c) => {
        data[dst + c] =
          alpha === 0
            ? 0
            : Math.min(255, Math.round((black.data[src + c] * 255) / alpha));
      });
      data[dst + 3] = Math.round(alpha);
    }
  return { width, height, data };
};

const opaqueCount = ({ data }) => {
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] >= 128) count += 1;
  return count;
};

// Fraction of pixels whose coverage differs by more than 64 (anti-aliasing tolerance).
const shapeDiff = (a, b) => {
  let diff = 0;
  for (let i = 3; i < a.data.length; i += 4)
    if (Math.abs(a.data[i] - b.data[i]) > 64) diff += 1;
  return diff / (a.data.length / 4);
};

// Among pixels opaque in both, fraction whose color differs by more than 40 on any channel.
const colorDiff = (a, b) => {
  let both = 0;
  let diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i + 3] < 200 || b.data[i + 3] < 200) continue;
    both += 1;
    if ([0, 1, 2].some((c) => Math.abs(a.data[i + c] - b.data[i + c]) > 40))
      diff += 1;
  }
  return both === 0 ? 0 : diff / both;
};

// Fraction of opaque pixels that are not red.
const offRed = (img) => {
  let opaque = 0;
  let off = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] < 200) continue;
    opaque += 1;
    if ([0, 1, 2].some((c) => Math.abs(img.data[i + c] - RED[c]) > 60))
      off += 1;
  }
  return opaque === 0 ? 1 : off / opaque;
};

const percent = (fraction) => Number((fraction * 100).toFixed(2));

const judge = ({ icon, form }, img, ref) => {
  if (opaqueCount(ref) === 0)
    return { ok: false, verdict: 'reference renders blank' };
  if (opaqueCount(img) === 0) return { ok: false, verdict: 'blank' };
  const shape = shapeDiff(img, ref);
  const metrics = { shape: percent(shape) };
  if (shape > SHAPE_MAX)
    return {
      ok: false,
      verdict: `shape differs in ${metrics.shape}% of pixels`,
      metrics,
    };
  if (icon.color === 'mono' && form !== 'img') {
    const off = offRed(img);
    metrics.offRed = percent(off);
    return off <= COLOR_MAX
      ? { ok: true, metrics }
      : {
          ok: false,
          verdict: `${metrics.offRed}% of opaque pixels are not currentColor red`,
          metrics,
        };
  }
  if (icon.color === 'mono') return { ok: true, metrics };
  const color = colorDiff(img, ref);
  metrics.color = percent(color);
  return color <= COLOR_MAX
    ? { ok: true, metrics }
    : {
        ok: false,
        verdict: `color differs in ${metrics.color}% of pixels`,
        metrics,
      };
};

const settle = async (page, expectsLoader) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async (waitForLoader) => {
    await Promise.all(
      [...document.images].map((image) =>
        image.decode().catch(() => undefined),
      ),
    );
    if (waitForLoader) {
      const deadline = Date.now() + 5000;
      while (
        !document.querySelector('svg[data-svgworm]') &&
        Date.now() < deadline
      )
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }, expectsLoader);
  // CSS masks and external <use> have no load event; give them a beat to paint.
  await page.waitForTimeout(400);
};

// Firefox can't take transparent element screenshots, so take the page on white and on black
// and recover straight alpha and color from the pair (the same in every engine).
const capture = async (page) => {
  const onWhite = pixels(await page.screenshot({ fullPage: true }));
  await page.evaluate(() => {
    document.body.style.background = '#000';
  });
  const onBlack = pixels(await page.screenshot({ fullPage: true }));
  await page.evaluate(() => {
    document.body.style.background = '#fff';
  });
  const rects = await page.evaluate(() =>
    [...document.querySelectorAll('[data-cell]')].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        index: Number(el.dataset.index),
        role: el.dataset.role,
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        w: r.width,
        h: r.height,
      };
    }),
  );
  return rects.map(({ x, y, w, h, ...meta }) => ({
    ...meta,
    img: crop(onWhite, onBlack, x * SCALE, y * SCALE, w * SCALE, h * SCALE),
  }));
};

const judgePage = (cells, shots) => {
  const byIndex = (role) =>
    new Map(
      shots
        .filter((shot) => shot.role === role)
        .map((shot) => [shot.index, shot.img]),
    );
  const refs = byIndex('ref');
  const products = byIndex('product');
  return cells.map((cell, index) =>
    judge(cell, products.get(index), refs.get(index)),
  );
};

const renderMode = async (browser, origin, mode) => {
  const context = await browser.newContext({
    viewport: { width: 1100, height: 800 },
    deviceScaleFactor: SCALE,
  });
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on(
    'console',
    (message) => message.type() === 'error' && problems.push(message.text()),
  );
  const testable = mode.cells.filter((cell) => !ANIMATED.has(cell.name));
  await page.goto(`${origin}/pages${mode.publicPath}.html`);
  await settle(page, mode.name === 'inject');
  let verdicts = judgePage(testable, await capture(page));
  if (verdicts.some((verdict) => !verdict.ok)) {
    // One retry with a longer wait tells a slow paint from a real failure.
    await page.waitForTimeout(1500);
    verdicts = judgePage(testable, await capture(page));
  }
  await context.close();
  return { testable, verdicts, problems };
};

const main = async () => {
  const sources = await readFixtures();
  if (sources.length === 0) throw new Error('No fixtures found');
  const modes = MODES.map((mode) => {
    const result = compile(sources, {
      flatten: false,
      color: [],
      ...mode.options,
    });
    if (!result.ok)
      throw new Error(
        `compile failed in ${mode.name}: ${JSON.stringify(result.errors)}`,
      );
    const manifest = JSON.parse(
      result.files.find((file) => file.name === 'manifest.json').content,
    );
    const cells = buildCells(manifest, mode.name);
    const [group] = Object.values(manifest.sprites);
    const loaderTag =
      mode.name === 'inject' && group.loader
        ? `<script async src="${group.loader.url}" integrity="${group.loader.integrity}" crossorigin="anonymous"></script>`
        : '';
    const testable = cells.filter((cell) => !ANIMATED.has(cell.name));
    return {
      ...mode,
      publicPath: mode.options.publicPath,
      result,
      cells,
      page: pageHtml(testable, loaderTag),
    };
  });

  const server = await serve(modes);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const matrix = {};
  const metrics = {};
  let failures = 0;
  try {
    for (const [engine, type] of Object.entries(ENGINES)) {
      const browser = await type.launch();
      const rows = [];
      for (const mode of modes) {
        const { testable, verdicts, problems } = await renderMode(
          browser,
          origin,
          mode,
        );
        mode.cells
          .filter((cell) => ANIMATED.has(cell.name))
          .forEach((cell) =>
            rows.push({
              name: cell.name,
              form: cell.form,
              result: 'skipped',
              reason: ANIMATED_REASON,
            }),
          );
        testable.forEach((cell, index) => {
          const { ok, verdict, metrics: numbers } = verdicts[index];
          rows.push({
            name: cell.name,
            form: cell.form,
            result: ok ? 'pass' : 'fail',
            reason: verdict,
            numbers,
          });
        });
        problems.forEach((problem) =>
          console.log(`  ${engine} ${mode.name} console error: ${problem}`),
        );
      }
      rows.sort(
        (a, b) => byCodeUnit(a.name, b.name) || byCodeUnit(a.form, b.form),
      );
      matrix[engine] = {};
      metrics[engine] = {};
      rows.forEach(({ name, form, result, reason, numbers }) => {
        matrix[engine][name] ??= {};
        matrix[engine][name][form] =
          result === 'pass' ? 'pass' : `${result}: ${reason}`;
        if (numbers) (metrics[engine][name] ??= {})[form] = numbers;
      });
      await browser.close();
      const count = (result) =>
        rows.filter((row) => row.result === result).length;
      failures += count('fail');
      console.log(
        `${engine}: ${count('pass')} pass, ${count('fail')} fail, ${count('skipped')} skipped`,
      );
      rows
        .filter((row) => row.result === 'fail')
        .forEach((row) =>
          console.log(
            `  FAIL ${row.form.padEnd(10)} ${row.name}: ${row.reason}`,
          ),
        );
    }
  } finally {
    server.close();
  }

  // Engines sort by name, icons and forms by code unit, so reruns are byte-identical.
  const sortedMatrix = Object.fromEntries(
    Object.keys(matrix)
      .sort(byCodeUnit)
      .map((engine) => [
        engine,
        Object.fromEntries(
          Object.keys(matrix[engine])
            .sort(byCodeUnit)
            .map((name) => [
              name,
              Object.fromEntries(
                Object.keys(matrix[engine][name])
                  .sort(byCodeUnit)
                  .map((form) => [form, matrix[engine][name][form]]),
              ),
            ]),
        ),
      ]),
  );
  await mkdir(join(MATRIX_DIR, 'out'), { recursive: true });
  await writeFile(
    join(MATRIX_DIR, 'matrix.json'),
    `${JSON.stringify(sortedMatrix, null, 2)}\n`,
  );
  await writeFile(
    join(MATRIX_DIR, 'out/metrics.json'),
    `${JSON.stringify(metrics, null, 2)}\n`,
  );
  if (failures > 0) {
    console.error(`render:check failed: ${failures} cell(s)`);
    process.exitCode = 1;
  }
};

await main();
