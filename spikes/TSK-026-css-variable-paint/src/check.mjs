// Does a custom property set on the page reach a var() paint inside a symbol of an EXTERNAL
// sprite (<use href="/icons/x.svg#id">), in Chromium, Firefox and WebKit?
// Spike code: evidence, not product.
import { createServer } from 'node:http';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

import { compile } from '../../../packages/svgworm/dist/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${body}</svg>`;
const encode = (text) => new TextEncoder().encode(text);
const sources = [
  // Two halves, two variables with fallbacks: the "multicolor theming" Q-12 asks for.
  ['duo.svg', svg('<path fill="var(--icon-color-1, #00ff00)" d="M0 0h12v24H0z"/><path fill="var(--icon-color-2, #0000ff)" d="M12 0h12v24H12z"/>')],
].map(([relativePath, text]) => ({ path: `icons/${relativePath}`, relativePath, content: encode(text) }));
const result = compile(sources, { flatten: false, publicPath: '/icons', color: [] });
if (!result.ok) throw new Error(JSON.stringify(result.errors));
const icon = result.manifest.icons[0];
const sprite = result.files.find((file) => file.target === 'outDir');
const spriteUrl = `/icons/${sprite.name}`;

const cell = (style) =>
  `<svg width="96" height="96" style="display:block;${style}" viewBox="${icon.viewBox}"><use href="${spriteUrl}#${icon.id}"/></svg>`;
const page = `<!doctype html><html><body style="margin:0;background:#fff">
<div id="themed">${cell('--icon-color-1:#ff0000;--icon-color-2:#ffff00')}</div>
<div id="inherited" style="--icon-color-1:#ff00ff">${cell('')}</div>
<div id="fallback">${cell('')}</div>
</body></html>`;

const server = createServer((req, res) => {
  if (req.url === spriteUrl) {
    res.writeHead(200, { 'content-type': 'image/svg+xml' }).end(sprite.content);
  } else {
    res.writeHead(200, { 'content-type': 'text/html' }).end(page);
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const expected = {
  themed: ['#ff0000', '#ffff00'],
  inherited: ['#ff00ff', '#0000ff'],
  fallback: ['#00ff00', '#0000ff'],
};
const hex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const rows = [];
for (const engine of [chromium, firefox, webkit]) {
  const browser = await engine.launch();
  const tab = await browser.newPage({ viewport: { width: 200, height: 400 } });
  await tab.goto(origin, { waitUntil: 'load' });
  await tab.waitForTimeout(300);
  for (const [id, [left, right]] of Object.entries(expected)) {
    const png = await tab.locator(`#${id} svg`).screenshot();
    // Decode with the browser itself to avoid a PNG dependency.
    const [l, r] = await tab.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = new OffscreenCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const at = (x) => [...ctx.getImageData(x, Math.floor(img.height / 2), 1, 1).data.slice(0, 3)];
      return [at(Math.floor(img.width / 4)), at(Math.floor((img.width * 3) / 4))];
    }, png.toString('base64'));
    const got = [hex(...l), hex(...r)];
    rows.push({ engine: engine.name(), case: id, expected: [left, right], got, pass: got[0] === left && got[1] === right });
  }
  await browser.close();
}
server.close();
const table = [
  '| Engine | Case | Expected (left, right) | Rendered | Pass |',
  '| --- | --- | --- | --- | --- |',
  ...rows.map((row) => `| ${row.engine} | ${row.case} | ${row.expected.join(', ')} | ${row.got.join(', ')} | ${row.pass ? 'yes' : 'NO'} |`),
].join('\n');
await writeFile(join(HERE, '../results/matrix.md'), `${table}\n`);
console.log(table);
process.exit(rows.every((row) => row.pass) ? 0 : 1);
