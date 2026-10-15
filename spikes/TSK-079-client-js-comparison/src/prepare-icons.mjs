// Copies the 20 Lucide SVGs into ./icons (svgworm's source folder). The SVGR variant imports the
// same files straight from lucide-static, so all three variants start from identical bytes.
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const names = JSON.parse(await readFile(join(root, 'src/icons.json'), 'utf8'));
await mkdir(join(root, 'icons'), { recursive: true });
for (const name of names) {
  await copyFile(
    join(root, 'node_modules/lucide-static/icons', `${name}.svg`),
    join(root, 'icons', `${name}.svg`),
  );
}
console.log(`copied ${String(names.length)} icons`);
