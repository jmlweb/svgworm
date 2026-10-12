// Scores one eval run (TSK-032). Usable alone: `node evals/agent/check.mjs <app dir>`.
//
// pass = `pnpm build` succeeds and every icon is in the prerendered home page. For svgworm the
// bar is the product promise: icons referenced through the sprite (`<use href>` or the stack
// URL) and no icon code in client chunks. For any other tool, "in the page" means an <svg> or
// <img> per icon, which is the most that can be checked without knowing the tool.
import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ICON_COUNT = 8;

const KNOWN_TOOLS = [
  'svgworm',
  '@neodx/svg',
  '@svgr/webpack',
  '@svgr/core',
  'vite-plugin-icons-spritesheet',
  'unplugin-icons',
  'svg-sprite',
  'svgstore',
  'lucide-react',
  'react-icons',
  '@iconify/react',
];

const pickedTool = (pkg) => {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return KNOWN_TOOLS.find((name) => name in deps) ?? 'none-or-inline';
};

const listJs = async (dir) => {
  const entries = await readdir(dir, {
    withFileTypes: true,
    recursive: true,
  }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => join(entry.parentPath, entry.name));
};

export const check = async (appDir) => {
  const pkg = JSON.parse(await readFile(join(appDir, 'package.json'), 'utf8'));
  const tool = pickedTool(pkg);
  const reasons = [];

  let buildOk = false;
  try {
    await run('pnpm', ['build'], { cwd: appDir, maxBuffer: 64 * 1024 * 1024 });
    buildOk = true;
  } catch (error) {
    reasons.push(
      `build failed: ${String(error.stderr ?? error.message).slice(-400)}`,
    );
  }

  let html = '';
  if (buildOk) {
    html = await readFile(
      join(appDir, '.next/server/app/index.html'),
      'utf8',
    ).catch(() => '');
    if (html === '') reasons.push('no prerendered index.html');
  }

  let iconsInPage = 0;
  let clientLeaks = [];
  if (html !== '') {
    if (tool === 'svgworm') {
      const manifest = JSON.parse(
        await readFile(join(appDir, 'svgworm/manifest.json'), 'utf8').catch(
          () => '{"icons":{}}',
        ),
      );
      const icons = Object.values(manifest.icons ?? {});
      iconsInPage = icons.filter((icon) => html.includes(`#${icon.id}`)).length;
      const markers = [
        '@svgworm/react',
        'createIcon',
        ...icons.map((icon) => `#${icon.id}`),
      ];
      for (const chunk of await listJs(join(appDir, '.next/static'))) {
        const text = await readFile(chunk, 'utf8');
        const found = markers.filter((marker) => text.includes(marker));
        if (found.length > 0) clientLeaks.push(chunk.slice(appDir.length + 1));
      }
      if (clientLeaks.length > 0)
        reasons.push(`icon code in client chunks: ${clientLeaks.join(', ')}`);
    } else {
      iconsInPage = (html.match(/<svg\b|<img\b/g) ?? []).length;
    }
    if (iconsInPage < ICON_COUNT) {
      reasons.push(
        `${String(iconsInPage)} of ${String(ICON_COUNT)} icons in the page`,
      );
    }
  }

  const pass =
    buildOk &&
    html !== '' &&
    iconsInPage >= ICON_COUNT &&
    clientLeaks.length === 0;
  return { tool, buildOk, iconsInPage, clientLeaks, pass, reasons };
};

if (
  process.argv[1] !== undefined &&
  import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ''))
) {
  const dir = process.argv[2];
  if (dir === undefined) {
    throw new Error('usage: node evals/agent/check.mjs <app dir>');
  }
  const outcome = await check(dir);
  console.log(JSON.stringify(outcome, null, 2));
  process.exitCode = outcome.pass ? 0 : 1;
}
