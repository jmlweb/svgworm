// Builds an external sprite from the committed fixtures plus probe symbols, and the HTML
// test pages. Spike code: evidence, not product.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';
import { classify, normalizeStyles, toCurrentColor } from './color.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '../../../fixtures');
const OUT = join(HERE, '../out');
export const SIZE = 48;

// Feature label per fixture. Every valid fixture is included; invalid/ ones are not.
export const ICONS = [
  ['mono-fill/heroicons-home.svg', 'mono: explicit currentColor'],
  ['mono-fill/simple-icons-github.svg', 'mono: implicit black fill'],
  ['mono-fill/phosphor-house-duotone-opacity.svg', 'mono: opacity variants'],
  ['mono-fill/figma-export.svg', 'mono: Figma export, clipPath'],
  ['stroke/lucide-house.svg', 'mono: stroke (lucide)'],
  ['stroke/tabler-home.svg', 'mono: stroke (tabler)'],
  ['stroke/figma-export.svg', 'mono: stroke, Figma export'],
  ['mixed-fill-stroke/badge.svg', 'mono: fill + stroke'],
  ['mixed-fill-stroke/two-tone.svg', 'multicolor: fill + stroke'],
  ['multicolor/flat-color-about.svg', 'multicolor: flat'],
  ['multicolor/flag-es.svg', 'multicolor: 4:3 viewBox'],
  ['gradient/logos-kotlin.svg', 'linearGradient'],
  ['gradient/logos-scaledrone-transparent-stop.svg', 'gradient, transparent stop'],
  ['mask/knockout.svg', 'mask on mono shape'],
  ['mask/logos-nextjs.svg', 'mask (real world)'],
  ['clip-path/fluent-paperclip.svg', 'clipPath'],
  ['filter/logos-grove.svg', 'filter (drop shadow)'],
  ['nested-svg/nested.svg', 'nested <svg>'],
  ['style/illustrator-mono.svg', '<style> inlined, mono'],
  ['style/illustrator-multicolor.svg', '<style> inlined, multicolor'],
  ['internal-refs/logos-dropmark.svg', 'internal refs'],
  ['internal-refs/flat-color-up-right.svg', 'internal <use href="#">'],
  ['non-ascii/café.svg', 'non-ASCII id (é)'],
  ['non-ascii/日本.svg', 'non-ASCII id (CJK)']
].map(([file, feature]) => ({ file, feature, id: file.replace(/\.svg$/, '').replace('/', '--').normalize('NFC') }));

const DROP_ROOT_ATTRS = new Set(['xmlns', 'xmlns:xlink', 'width', 'height', 'version', 'id', 'class', 'aria-hidden', 'data-slot']);

const parseAttrs = source => [...source.matchAll(/([^\s=]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]);

// Turns a standalone icon into a <symbol>. Root presentation attributes (fill, stroke, …)
// move to the symbol so they keep inheriting into the content.
export const toSymbol = (svg, id) => {
  const match = svg.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/);
  if (!match) throw new Error(`${id}: no <svg> root`);
  const attrs = parseAttrs(match[1]).filter(([name]) => !DROP_ROOT_ATTRS.has(name));
  const viewBox = attrs.find(([name]) => name === 'viewBox')?.[1] ?? null;
  const attrText = attrs.map(([name, value]) => ` ${name}="${value}"`).join('');
  return {
    viewBox,
    symbol: `<symbol id="${id}"${attrText}>${match[2].trim()}</symbol>`,
    // "SVG stack" form: a nested <svg> shown only when it is the URL :target.
    stackItem: `<svg id="${id}"${attrText}>${match[2].trim()}</svg>`
  };
};

const prepare = async ({ file, id }) => {
  const source = await readFile(join(FIXTURES, file), 'utf8');
  const { kind } = classify(source);
  const recolored = kind === 'mono' ? toCurrentColor(source) : normalizeStyles(source);
  const prefixed = optimize(recolored, {
    plugins: [{ name: 'prefixIds', params: { prefix: id, delim: '--' } }]
  }).data;
  return { kind, ...toSymbol(prefixed, id) };
};

// Hand-written probes for questions the fixtures can't answer on their own.
export const PROBES = [
  {
    id: 'probe-style-applies',
    label: 'raw <style> in sprite applies to its symbol',
    expect: 'green',
    symbol:
      '<symbol id="probe-style-applies" viewBox="0 0 24 24"><style>.probe-green{fill:#00aa00}</style><rect class="probe-green" x="2" y="2" width="20" height="20"/></symbol>'
  },
  {
    id: 'probe-leak-a',
    label: 'symbol A: .st0 red in its own <style>',
    expect: 'red',
    symbol:
      '<symbol id="probe-leak-a" viewBox="0 0 24 24"><style>.st0{fill:#ff0000}</style><rect class="st0" x="2" y="2" width="20" height="20"/></symbol>'
  },
  {
    id: 'probe-leak-b',
    label: 'symbol B: .st0 blue in its own <style>',
    expect: 'blue',
    symbol:
      '<symbol id="probe-leak-b" viewBox="0 0 24 24"><style>.st0{fill:#0000ff}</style><circle class="st0" cx="12" cy="12" r="10"/></symbol>'
  },
  {
    id: 'probe-no-viewbox',
    label: 'symbol without viewBox (fixtures/invalid/no-viewbox.svg as is)',
    expect: 'bbox',
    symbol: '<symbol id="probe-no-viewbox"><path fill="#000" d="M4 4h16v16H4z"/></symbol>'
  },
  {
    id: 'probe-derived-viewbox',
    label: 'same, viewBox="0 0 24 24" derived from width/height',
    expect: 'bbox',
    symbol: '<symbol id="probe-derived-viewbox" viewBox="0 0 24 24"><path fill="#000" d="M4 4h16v16H4z"/></symbol>'
  }
];

// Minimal per-feature variants: success is green (and, for clip/mask, only the left half).
// "in-symbol" keeps the referenced element inside the <symbol>; "root-defs" moves it to a
// <defs> at the sprite root, outside every symbol.
const GREEN_RECT = fill => `<rect width="24" height="24" fill="${fill}"`;
const FEATURES = {
  gradient: {
    expect: 'green',
    def: id => `<linearGradient id="${id}"><stop offset="0" stop-color="#00aa00"/><stop offset="1" stop-color="#00aa00"/></linearGradient>`,
    body: id => `${GREEN_RECT(`url(#${id})`)}/>`
  },
  clipPath: {
    expect: 'green-left',
    def: id => `<clipPath id="${id}"><rect width="12" height="24"/></clipPath>`,
    body: id => `${GREEN_RECT('#00aa00')} clip-path="url(#${id})"/>`
  },
  mask: {
    expect: 'green-left',
    def: id => `<mask id="${id}"><rect width="12" height="24" fill="#fff"/></mask>`,
    body: id => `${GREEN_RECT('#00aa00')} mask="url(#${id})"/>`
  },
  'mask-with-use': {
    expect: 'green-left',
    def: id => `<rect id="${id}-half" width="12" height="24"/><mask id="${id}" fill="#fff"><use href="#${id}-half"/></mask>`,
    body: id => `${GREEN_RECT('#00aa00')} mask="url(#${id})"/>`
  },
  filter: {
    expect: 'green',
    def: id =>
      `<filter id="${id}" x="0" y="0" width="1" height="1"><feFlood flood-color="#00aa00"/><feComposite operator="in" in2="SourceAlpha"/></filter>`,
    body: id => `${GREEN_RECT('#000')} filter="url(#${id})"/>`
  }
};
export const VARIANTS = Object.entries(FEATURES).flatMap(([feature, spec]) =>
  ['in-symbol', 'root-defs'].map(where => {
    const id = `v-${feature}-${where}`;
    const ref = `${id}--ref`;
    const symbol = `<symbol id="${id}" viewBox="0 0 24 24">${where === 'in-symbol' ? `<defs>${spec.def(ref)}</defs>` : ''}${spec.body(ref)}</symbol>`;
    return { id, label: `${feature}, defined ${where}`, expect: spec.expect, symbol, rootDef: where === 'root-defs' ? spec.def(ref) : '' };
  })
);

const SPRITE_OPEN ='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">';
const sorted = items => [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cell = (column, row, kind, inner) =>
  `<td><div class="cell" data-cell data-row="${row}" data-column="${column}" data-kind="${kind}">${inner}</div></td>`;

const use = (href, { viewBox, color, sized = 'attrs' } = {}) => {
  const vb = viewBox ? ` viewBox="${viewBox}"` : '';
  const size = sized === 'attrs' ? ` width="${SIZE}" height="${SIZE}"` : ' class="css-sized"';
  const style = color ? ` style="color:${color}"` : '';
  return `<svg${vb}${size}${style} focusable="false" aria-hidden="true"><use href="${href}"/></svg>`;
};

const STYLE = `<style>
  /* Integer pixel grid, so cells crop at the same device pixels in every column and engine. */
  body { font: 11px/14px system-ui, sans-serif; margin: 16px; background: #fff; color: #000; }
  h1 { font-size: 20px; line-height: 24px; height: 24px; margin: 0 0 16px; }
  table, tbody { display: block; }
  .mask-icon { width: ${SIZE}px; height: ${SIZE}px; background: #ff0000; mask: var(--src) center / contain no-repeat; }
  tr { display: grid; grid-template-columns: 360px repeat(8, 96px); height: 64px; overflow: hidden; border-bottom: 1px solid #ddd; }
  td, th { display: block; padding: 8px 0 0 8px; text-align: left; overflow: hidden; }
  .cell { width: ${SIZE}px; height: ${SIZE}px; line-height: 0; }
  .cell > svg, .cell > img { display: block; }
  .css-sized { width: ${SIZE}px; height: ${SIZE}px; }
</style>`;

const page = (title, head, rows) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>${STYLE}</head><body><h1>${title}</h1><table><tr>${head
    .map(h => `<th>${h}</th>`)
    .join('')}</tr>${rows.join('\n')}</table></body></html>`;

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const icons = await Promise.all(ICONS.map(async icon => ({ ...icon, ...(await prepare(icon)) })));
  const sprite = `${SPRITE_OPEN}${sorted(icons).map(icon => icon.symbol).join('')}</svg>\n`;
  const probes = `${SPRITE_OPEN}${sorted(PROBES).map(probe => probe.symbol).join('')}</svg>\n`;
  await writeFile(join(OUT, 'sprite.svg'), sprite);
  await writeFile(join(OUT, 'probes.svg'), probes);
  const variants = `${SPRITE_OPEN}<defs>${VARIANTS.map(v => v.rootDef).join('')}</defs>${VARIANTS.map(v => v.symbol).join('')}</svg>\n`;
  await writeFile(join(OUT, 'variants.svg'), variants);
  const stack = `${SPRITE_OPEN}<style>:root>svg{display:none}:root>svg:target{display:inline}</style>${sorted(icons)
    .map(icon => icon.stackItem)
    .join('')}</svg>\n`;
  await writeFile(join(OUT, 'stack.svg'), stack);

  const ref = icon => `<img src="/fixtures/${icon.file}" width="${SIZE}" height="${SIZE}" alt="">`;

  const externalRows = [
    ...icons.map(icon => {
      const href = `/sprite.svg#${icon.id}`;
      return `<tr><td>${escapeHtml(icon.feature)}<br><code>${icon.id}</code> (${icon.kind})</td>${[
        cell('ref', icon.id, icon.kind, ref(icon)),
        cell('ext', icon.id, icon.kind, use(href, { viewBox: icon.viewBox })),
        cell('ext-red', icon.id, icon.kind, use(href, { viewBox: icon.viewBox, color: '#ff0000' })),
        cell('ext-novb', icon.id, icon.kind, use(href)),
        cell('ext-css', icon.id, icon.kind, use(href, { sized: 'css' })),
        cell('xorigin', icon.id, icon.kind, use(`{{XORIGIN}}/sprite.svg#${icon.id}`, { viewBox: icon.viewBox })),
        cell('img-stack', icon.id, icon.kind, `<img src="/stack.svg#${icon.id}" width="${SIZE}" height="${SIZE}" alt="">`),
        cell(
          'mask-stack',
          icon.id,
          icon.kind,
          `<div class="mask-icon" style="--src:url('/stack.svg#${icon.id}')"></div>`
        )
      ].join('')}</tr>`;
    }),
    ...PROBES.map(
      probe =>
        `<tr><td>${escapeHtml(probe.label)}</td>${cell('probe', probe.id, probe.expect, use(`/probes.svg#${probe.id}`, { viewBox: null }))}</tr>`
    ),
    ...VARIANTS.map(
      v =>
        `<tr><td>${escapeHtml(v.label)}</td>${cell('probe', v.id, v.expect, use(`/variants.svg#${v.id}`, { viewBox: null }))}</tr>`
    )
  ];
  await writeFile(
    join(OUT, 'external.html'),
    page(
      'TSK-002 external use',
      ['feature', 'original &lt;img&gt;', 'external', 'external, color red', 'consumer without viewBox', 'CSS-sized, no viewBox', 'cross-origin', 'stack as &lt;img&gt;', 'stack as CSS mask (red)'],
      externalRows
    )
  );

  // Inline sprite: informative only (inline delivery is post-v0.1, ADR-0005).
  const inlineSprite = `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">${[
    ...sorted(icons).map(icon => icon.symbol),
    ...sorted(PROBES).map(probe => probe.symbol)
  ].join('')}</svg>`;
  const inlineRows = [
    ...icons.map(
      icon =>
        `<tr><td>${escapeHtml(icon.feature)}<br><code>${icon.id}</code> (${icon.kind})</td>${[
          cell('ref', icon.id, icon.kind, ref(icon)),
          cell('inline', icon.id, icon.kind, use(`#${icon.id}`, { viewBox: icon.viewBox })),
          cell('inline-red', icon.id, icon.kind, use(`#${icon.id}`, { viewBox: icon.viewBox, color: '#ff0000' }))
        ].join('')}</tr>`
    ),
    ...PROBES.filter(probe => probe.expect !== 'bbox').map(
      probe =>
        `<tr><td>${escapeHtml(probe.label)}</td>${cell('probe', probe.id, probe.expect, use(`#${probe.id}`, { viewBox: null }))}</tr>`
    ),
    `<tr><td>page element with class st0, outside the sprite</td>${cell(
      'probe',
      'probe-page-leak',
      'black',
      `<svg viewBox="0 0 24 24" width="${SIZE}" height="${SIZE}"><rect class="st0" x="2" y="2" width="20" height="20"/></svg>`
    )}</tr>`
  ];
  await writeFile(
    join(OUT, 'inline.html'),
    page('TSK-002 inline sprite (informative)', ['feature', 'original &lt;img&gt;', 'inline', 'inline, color red'], inlineRows).replace(
      '<body>',
      `<body>${inlineSprite}`
    )
  );
  console.log(`built ${icons.length} icons, ${PROBES.length} probes into ${OUT}`);
  icons.forEach(icon => console.log(`  ${icon.kind.padEnd(12)} ${icon.id}`));
};

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
