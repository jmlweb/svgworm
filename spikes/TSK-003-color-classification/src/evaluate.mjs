// Compares the static classifier against a rendering oracle, then verifies the mono rewrite
// by rendering it in a probe color. Usage: node src/evaluate.mjs [set-filter]
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { classify, toCurrentColor } from './color.mjs';

const corpusDir = new URL('../corpus/', import.meta.url).pathname;
const outDir = new URL('../out/', import.meta.url).pathname;
const SIZE = 96;
const MIN_ALPHA = 64;
const FAR = Number(process.env.FAR ?? 12);
const MAX_FAR_SHARE = 0.002;
const TOLERANCE = Number(process.env.TOLERANCE ?? 8);
const ORACLE_COLOR = '#ff00ff';
const PROBE_COLOR = '#ff0000';

// Sets the inherited text color, unless the icon pins its own.
const withRootColor = (svg, color) =>
  svg.replace(/<svg\b[^>]*>/, tag => (/\scolor="/.test(tag) ? tag : tag.replace(/\/?>$/, end => ` color="${color}"${end}`)));

const render = svg => {
  const image = new Resvg(svg, { fitTo: { mode: 'width', value: SIZE }, font: { loadSystemFonts: false } }).render();
  return { pixels: image.pixels, width: image.width, height: image.height };
};

// Pixels are premultiplied; unpremultiply before comparing colors.
const opaqueColors = ({ pixels }) => {
  const colors = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha < MIN_ALPHA) continue;
    colors.push([0, 1, 2].map(c => Math.round((pixels[i + c] * 255) / alpha)));
  }
  return colors;
};

const distance = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));

const oracleKind = image => {
  const colors = opaqueColors(image);
  if (colors.length === 0) return { kind: 'empty', farShare: 0 };
  const counts = new Map();
  colors.forEach(color => {
    const key = color.map(v => v >> 3).join(',');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const [dominantKey] = [...counts].sort((a, b) => b[1] - a[1])[0];
  const dominant = dominantKey.split(',').map(v => (Number(v) << 3) + 4);
  const far = colors.filter(color => distance(color, dominant) > FAR).length;
  const farShare = far / colors.length;
  return { kind: farShare <= MAX_FAR_SHARE ? 'mono' : 'multicolor', farShare };
};

// The rewrite is correct when the shape (alpha) is unchanged and every visible pixel is the probe color.
const verifyRewrite = (original, rewritten) => {
  if (original.width !== rewritten.width || original.height !== rewritten.height) return 'size-changed';
  let alphaDiff = 0;
  let total = 0;
  for (let i = 3; i < original.pixels.length; i += 4) {
    if (original.pixels[i] > 0 || rewritten.pixels[i] > 0) total += 1;
    if (Math.abs(original.pixels[i] - rewritten.pixels[i]) > 32) alphaDiff += 1;
  }
  if (total > 0 && alphaDiff / total > MAX_FAR_SHARE) return 'shape-changed';
  const probe = [255, 0, 0];
  const colors = opaqueColors(rewritten);
  const off = colors.filter(color => distance(color, probe) > FAR).length;
  if (colors.length > 0 && off / colors.length > MAX_FAR_SHARE) return 'not-themed';
  return 'ok';
};

// resvg 2.6.2 aborts the process (Rust panic) on these icons, so they can't get an oracle label.
const skipped = new Set(
  readFileSync(new URL('../resvg-panics.txt', import.meta.url), 'utf8').split('\n').filter(Boolean)
);

const filter = process.argv[2];
const sets = readdirSync(corpusDir).sort().filter(set => !filter || set.includes(filter));
const rows = [];
const failures = [];

for (const set of sets) {
  const stats = { set, total: 0, agree: 0, errors: 0, mono: 0, multicolor: 0, rewriteOk: 0, rewriteChecked: 0 };
  for (const file of readdirSync(join(corpusDir, set)).sort()) {
    if (skipped.has(`${set}/${file}`)) continue;
    const svg = readFileSync(join(corpusDir, set, file), 'utf8');
    stats.total += 1;
    try {
      const predicted = classify(svg, { tolerance: TOLERANCE });
      const truth = oracleKind(render(withRootColor(svg, ORACLE_COLOR)));
      const predictedMono = predicted.kind !== 'multicolor';
      const truthMono = truth.kind !== 'multicolor';
      if (predictedMono === truthMono) stats.agree += 1;
      else failures.push({ set, file, predicted, truth, problem: 'classification' });
      stats[predictedMono ? 'mono' : 'multicolor'] += 1;

      if (predictedMono && truthMono) {
        stats.rewriteChecked += 1;
        const original = render(svg);
        const rewritten = render(withRootColor(toCurrentColor(svg), PROBE_COLOR));
        const verdict = verifyRewrite(original, rewritten);
        if (verdict === 'ok') stats.rewriteOk += 1;
        else failures.push({ set, file, predicted, problem: verdict });
      }
    } catch (error) {
      stats.errors += 1;
      failures.push({ set, file, problem: 'error', message: String(error.message).slice(0, 200) });
    }
  }
  rows.push(stats);
  console.log(
    `${set.padEnd(42)} n=${String(stats.total).padStart(5)} agree=${((100 * stats.agree) / stats.total).toFixed(2).padStart(6)}%` +
      ` mono=${stats.mono} multi=${stats.multicolor} rewrite=${stats.rewriteOk}/${stats.rewriteChecked} errors=${stats.errors}`
  );
}

const totals = rows.reduce(
  (sum, row) => ({
    total: sum.total + row.total,
    agree: sum.agree + row.agree,
    rewriteOk: sum.rewriteOk + row.rewriteOk,
    rewriteChecked: sum.rewriteChecked + row.rewriteChecked,
    errors: sum.errors + row.errors
  }),
  { total: 0, agree: 0, rewriteOk: 0, rewriteChecked: 0, errors: 0 }
);
console.log(
  `\nTOTAL n=${totals.total} classification=${((100 * totals.agree) / totals.total).toFixed(2)}%` +
    ` rewrite=${((100 * totals.rewriteOk) / totals.rewriteChecked).toFixed(2)}% (${totals.rewriteOk}/${totals.rewriteChecked}) errors=${totals.errors}`
);

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `failures${filter ? `-${filter}` : ''}.json`), JSON.stringify(failures, null, 2));
writeFileSync(join(outDir, `summary${filter ? `-${filter}` : ''}.json`), JSON.stringify({ rows, totals }, null, 2));
