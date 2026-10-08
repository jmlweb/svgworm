// Throwaway prototype of the TSK-004 output contract: hashed sprite + stack in a public
// dir, plus a generated ESM module (.js + .d.ts) and a JSON manifest carrying the URLs.
// Spike code: evidence, not product. Classification and id rules are hard-coded here;
// the real core implements ADR-0004/0006/0007.
//
// Usage: node src/generate.mjs --out-dir <dir> --module-dir <dir> --public-path </path>
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const HERE = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(HERE, '../icons');
const GROUP = 'icons';
const HASH_LENGTH = 8;

const { values } = parseArgs({
  options: {
    'out-dir': { type: 'string' },
    'module-dir': { type: 'string' },
    'public-path': { type: 'string' }
  }
});

export class ConfigError extends Error {}

// ADR-0010 publicPath rules: root-relative, same-origin, no query/fragment, no trailing slash.
export const normalizePublicPath = value => {
  if (!value.startsWith('/') || value.startsWith('//')) {
    throw new ConfigError(`publicPath must start with a single "/" (got "${value}"). Sprites must be same-origin (ADR-0006).`);
  }
  if (/[?#\\\s]/.test(value)) throw new ConfigError(`publicPath must not contain "?", "#", "\\" or whitespace (got "${value}")`);
  return value.replace(/\/+$/, '');
};

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// ADR-0007 symbol id.
const symbolId = name =>
  'i-' +
  [...name]
    .map(ch => (/[a-z0-9-]/.test(ch) ? ch : ch === '/' ? '--' : `_${ch.codePointAt(0).toString(16)}_`))
    .join('');

// Hard-coded per-icon classification (ADR-0004/0006 decide this in the real core).
const CLASSES = {
  home: { color: 'mono' },
  'ui/check': { color: 'mono' },
  'brand/sunset': { color: 'multicolor' },
  café: { color: 'mono' }
};

const walk = async dir =>
  (await Promise.all(
    (await readdir(dir, { withFileTypes: true })).map(entry =>
      entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
    )
  )).flat();

const loadIcons = async () =>
  (await walk(ICONS_DIR))
    .filter(file => file.endsWith('.svg'))
    .map(file => relative(ICONS_DIR, file).replaceAll('\\', '/').normalize('NFC').replace(/\.svg$/, ''))
    .sort(compare)
    .map(async name => {
      const source = await readFile(join(ICONS_DIR, `${name}.svg`), 'utf8');
      const [, attrs, body] = source.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/);
      const viewBox = attrs.match(/viewBox="([^"]*)"/)[1];
      const id = symbolId(name);
      // Prefix internal ids as <symbolId>_<n> (ADR-0007), in document order.
      const internal = [...body.matchAll(/\bid="([^"]+)"/g)].map(([, old]) => old);
      const content = internal.reduce(
        (acc, old, index) =>
          acc.replaceAll(`id="${old}"`, `id="${id}_${index + 1}"`).replaceAll(`url(#${old})`, `url(#${id}_${index + 1})`),
        body.trim()
      );
      const referenceDependent = /url\(#/.test(content);
      const { color } = CLASSES[name];
      const delivery = referenceDependent ? (color === 'mono' ? 'mask' : 'img') : 'use';
      return { name, id, viewBox, content, color, delivery };
    });

const hashOf = text => createHash('sha256').update(text, 'utf8').digest('hex').slice(0, HASH_LENGTH);

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg">';

export const generate = async ({ outDir, moduleDir, publicPath }) => {
  const base = normalizePublicPath(publicPath);
  const icons = await Promise.all(await loadIcons());

  const spriteIcons = icons.filter(icon => icon.delivery === 'use');
  const stackIcons = icons.filter(icon => icon.delivery !== 'use');

  const sprite = `${SVG_OPEN}${spriteIcons
    .map(icon => `<symbol id="${icon.id}" viewBox="${icon.viewBox}">${icon.content}</symbol>`)
    .join('')}</svg>\n`;
  const stack = stackIcons.length
    ? `${SVG_OPEN}<style>:root>svg{display:none}:root>svg:target{display:inline}</style>${stackIcons
        .map(icon => `<svg id="${icon.id}" viewBox="${icon.viewBox}">${icon.content}</svg>`)
        .join('')}</svg>\n`
    : null;

  // Hash of the emitted bytes only: publicPath and paths never feed it.
  const files = [
    ...(spriteIcons.length ? [{ key: 'sprite', file: `${GROUP}.${hashOf(sprite)}.svg`, text: sprite }] : []),
    ...(stack ? [{ key: 'stack', file: `${GROUP}.stack.${hashOf(stack)}.svg`, text: stack }] : [])
  ];
  const entry = key => {
    const found = files.find(f => f.key === key);
    return found ? { file: found.file, url: `${base}/${found.file}` } : null;
  };

  const manifest = {
    version: 1,
    sprites: { [GROUP]: { sprite: entry('sprite'), stack: entry('stack') } },
    icons: Object.fromEntries(
      icons.map(({ name, id, viewBox, color, delivery }) => [name, { sprite: GROUP, id, viewBox, color, delivery }])
    )
  };

  // svgworm owns outDir: drop stale hashed files it generated before.
  await mkdir(outDir, { recursive: true });
  const ours = /^[a-z0-9-]+(\.stack)?\.[0-9a-f]{8}\.svg$/;
  const keep = new Set(files.map(f => f.file));
  await Promise.all(
    (await readdir(outDir)).filter(f => ours.test(f) && !keep.has(f)).map(f => rm(join(outDir, f)))
  );
  await Promise.all(files.map(f => writeFile(join(outDir, f.file), f.text)));

  const json = JSON.stringify(manifest, null, 2);
  const names = icons.map(icon => JSON.stringify(icon.name));
  await mkdir(moduleDir, { recursive: true });
  await writeFile(join(moduleDir, 'manifest.json'), `${json}\n`);
  await writeFile(
    join(moduleDir, 'icons.js'),
    `// Generated by svgworm. Do not edit.\nexport const manifest = ${json};\n`
  );
  await writeFile(
    join(moduleDir, 'icons.d.ts'),
    `// Generated by svgworm. Do not edit.
export type IconName =
${names.map(n => `  | ${n}`).join('\n')};

export interface SvgwormFile {
  readonly file: string;
  readonly url: string;
}

export interface SvgwormIcon {
  readonly sprite: string;
  readonly id: string;
  readonly viewBox: string;
  readonly color: 'mono' | 'multicolor';
  readonly delivery: 'use' | 'img' | 'mask';
}

export interface SvgwormManifest<Name extends string> {
  readonly version: 1;
  readonly sprites: Readonly<Record<string, { readonly sprite: SvgwormFile | null; readonly stack: SvgwormFile | null }>>;
  readonly icons: Readonly<Record<Name, SvgwormIcon>>;
}

export declare const manifest: SvgwormManifest<IconName>;
`
  );
  return manifest;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const manifest = await generate({
      outDir: values['out-dir'],
      moduleDir: values['module-dir'],
      publicPath: values['public-path']
    });
    console.log(JSON.stringify(manifest.sprites));
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`svgworm: ${error.message}`);
      process.exit(2);
    }
    throw error;
  }
}
