// Builds corpus/<set>/<name>.svg from extracted npm tarballs.
// Usage: node src/build-corpus.mjs <pkgs-dir>
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';

const pkgsDir = process.argv[2];
if (!pkgsDir) throw new Error('Usage: build-corpus.mjs <pkgs-dir>');

const outDir = new URL('../corpus/', import.meta.url).pathname;

const listSvgs = dir =>
  readdirSync(dir, { withFileTypes: true })
    .flatMap(entry =>
      entry.isDirectory()
        ? listSvgs(join(dir, entry.name))
        : entry.name.endsWith('.svg')
          ? [join(dir, entry.name)]
          : []
    )
    .sort();

const pkg = (dir, sub) => join(pkgsDir, dir, 'package', sub);

const FILE_SETS = [
  ['lucide', pkg('lucide-static_1.52.0', 'icons')],
  ['heroicons-24-solid', pkg('heroicons_2.2.0', '24/solid')],
  ['heroicons-24-outline', pkg('heroicons_2.2.0', '24/outline')],
  ['heroicons-20-solid', pkg('heroicons_2.2.0', '20/solid')],
  ['tabler-outline', pkg('tabler_icons_3.49.0', 'icons/outline')],
  ['tabler-filled', pkg('tabler_icons_3.49.0', 'icons/filled')],
  ['simple-icons', pkg('simple-icons_16.34.0', 'icons')],
  ['phosphor-regular', pkg('phosphor-icons_core_2.1.1', 'assets/regular')],
  ['phosphor-fill', pkg('phosphor-icons_core_2.1.1', 'assets/fill')],
  ['phosphor-duotone', pkg('phosphor-icons_core_2.1.1', 'assets/duotone')],
  ['flags', pkg('flag-icons_7.5.0', 'flags/4x3')],
  ['devicon', pkg('devicon_2.17.0', 'icons')]
];

const ICONIFY_SETS = [
  ['noto', pkg('iconify-json_noto_1.2.9', 'icons.json')],
  ['flat-color-icons', pkg('iconify-json_flat-color-icons_1.2.3', 'icons.json')],
  ['logos', pkg('iconify-json_logos_1.2.15', 'icons.json')],
  ['fluent-emoji-flat', pkg('iconify-json_fluent-emoji-flat_1.2.6', 'icons.json')]
];

const write = (set, name, svg) => {
  mkdirSync(join(outDir, set), { recursive: true });
  writeFileSync(join(outDir, set, `${name}.svg`), svg);
};

const loadFileSet = dir => listSvgs(dir).map(file => [basename(file, '.svg'), readFileSync(file, 'utf8')]);

const loadIconifySet = file => {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  return Object.keys(json.icons)
    .sort()
    .map(name => {
      const icon = json.icons[name];
      const width = icon.width ?? json.width ?? 16;
      const height = icon.height ?? json.height ?? 16;
      return [
        name,
        // Iconify adds xmlns:xlink when rendering; bodies that use xlink:href need it declared.
        `<svg xmlns="http://www.w3.org/2000/svg"${icon.body.includes('xlink:') ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : ''} viewBox="${icon.left ?? 0} ${icon.top ?? 0} ${width} ${height}">${icon.body}</svg>`
      ];
    });
};

const everyNth = (items, count) => {
  const step = Math.max(1, Math.floor(items.length / count));
  return items.filter((_, index) => index % step === 0).slice(0, count);
};

const splitRoot = svg => {
  const open = svg.match(/<svg\b[^>]*>/);
  const close = svg.lastIndexOf('</svg>');
  return { open: open[0], inner: svg.slice(open.index + open[0].length, close) };
};

const viewBoxSize = openTag => {
  const [, , width, height] = openTag.match(/viewBox="([^"]+)"/)[1].trim().split(/[\s,]+/);
  return { width, height };
};

// Mimics a Figma export: hardcoded color on each element, content wrapped in a clip group
// whose clipPath holds a white rect.
const toFigma = svg => {
  const { open, inner } = splitRoot(svg.replace(/<!--[\s\S]*?-->/g, ''));
  const { width, height } = viewBoxSize(open);
  const root = open.replace(/currentColor/g, '#1E1E1E');
  const body = inner.replace(/currentColor/g, '#1E1E1E');
  return `${root}<g clip-path="url(#clip0_1_2)">${body}</g><defs><clipPath id="clip0_1_2"><rect width="${width}" height="${height}" fill="white"/></clipPath></defs></svg>`;
};

// Mimics an Illustrator export: colors live in a <style> block and are applied by class.
const toIllustrator = svg => {
  const { open, inner } = splitRoot(svg);
  const colors = [...new Set([...inner.matchAll(/fill="(#[0-9a-fA-F]{3,6})"/g)].map(m => m[1]))];
  const classOf = color => `cls-${colors.indexOf(color) + 1}`;
  const rootFill = open.match(/fill="currentColor"/) ? '#231f20' : null;
  const rules = [
    ...colors.map(color => `.${classOf(color)}{fill:${color};}`),
    ...(rootFill ? [`.cls-root{fill:${rootFill};}`] : [])
  ].join('');
  const body = inner
    .replace(/fill="(#[0-9a-fA-F]{3,6})"/g, (_, color) => `class="${classOf(color)}"`)
    .replace(/<(path|circle|rect|ellipse|polygon)\b(?![^>]*class=)(?![^>]*fill=)/g, rootFill ? '<$1 class="cls-root"' : '<$1');
  return `${open.replace(/\s*fill="currentColor"/, '')}<defs><style>${rules}</style></defs>${body}</svg>`;
};

for (const [set, dir] of FILE_SETS) {
  if (!existsSync(dir)) throw new Error(`Missing ${dir}`);
  for (const [name, svg] of loadFileSet(dir)) write(set, name, svg);
}

for (const [set, file] of ICONIFY_SETS) {
  for (const [name, svg] of loadIconifySet(file)) write(set, name, svg);
}

const figmaSources = ['lucide', 'heroicons-24-solid', 'tabler-filled', 'phosphor-fill', 'simple-icons'];
for (const set of figmaSources) {
  const dir = FILE_SETS.find(([name]) => name === set)[1];
  for (const [name, svg] of everyNth(loadFileSet(dir), 300)) write(`synthetic-figma-${set}`, name, toFigma(svg));
}

for (const set of ['heroicons-24-solid', 'phosphor-fill']) {
  const dir = FILE_SETS.find(([name]) => name === set)[1];
  for (const [name, svg] of everyNth(loadFileSet(dir), 300)) write(`synthetic-illustrator-${set}`, name, toIllustrator(svg));
}

for (const [name, svg] of loadIconifySet(ICONIFY_SETS[1][1])) {
  write('synthetic-illustrator-flat-color-icons', name, toIllustrator(svg));
}

const counts = readdirSync(outDir)
  .sort()
  .map(set => `${set}: ${readdirSync(join(outDir, set)).length}`);
console.log(counts.join('\n'));
