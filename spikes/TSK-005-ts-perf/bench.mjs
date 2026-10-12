// TSK-005: type-checking cost of the generated IconName for large icon sets (Q-30).
// Generates icons.d.ts in three shapes, a consumer that renders 300 icons and one wrong name,
// then measures `tsc --noEmit --extendedDiagnostics` (TS 6 from the repo, TS 7 via pnpm dlx)
// and the language-service completion time at `<Icon name="` (TS 6 API).
// Usage: node spikes/TSK-005-ts-perf/bench.mjs [sizes=500,5000,20000] [runs=3]
import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const here = fileURLToPath(new URL('.', import.meta.url));
const repo = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(join(repo, 'package.json'));
const ts = require('typescript');
const sizes = (process.argv[2] ?? '500,5000,20000').split(',').map(Number);
const runs = Number(process.argv[3] ?? 3);
const out = join(here, 'out');

const NAMESPACES = 20;
const names = (count) =>
  Array.from({ length: count }, (_, i) => `ns${String(i % NAMESPACES)}/icon-${String(i)}`);

const BODY = `
export interface SvgwormIcon { readonly sprite: string; readonly id: string; readonly viewBox: string; readonly color: 'mono' | 'multicolor'; readonly delivery: 'use' | 'img' | 'mask' }
export interface SvgwormManifest<Name extends string> { readonly version: 1; readonly icons: Readonly<Record<Name, SvgwormIcon>> }
export declare const manifest: SvgwormManifest<IconName>;
`;

const shapes = {
  // v0.1: a plain string literal union.
  union: (list) => `export type IconName =\n${list.map((n) => `  | ${JSON.stringify(n)}`).join('\n')};\n${BODY}`,
  // An `as const` tuple plus an indexed access type.
  tuple: (list) => `export declare const iconNames: readonly [\n${list.map((n) => `  ${JSON.stringify(n)}`).join(',\n')}\n];\nexport type IconName = (typeof iconNames)[number];\n${BODY}`,
  // One union per namespace, joined by a template literal.
  template: (list) => {
    const byNs = new Map();
    for (const n of list) { const [ns, leaf] = n.split('/'); (byNs.get(ns) ?? byNs.set(ns, []).get(ns)).push(leaf); }
    const parts = [...byNs.entries()].map(([ns, leaves], i) => `type N${i} = \`${ns}/\${${leaves.map((l) => JSON.stringify(l)).join(' | ')}}\`;`);
    return `${parts.join('\n')}\nexport type IconName = ${[...byNs.keys()].map((_, i) => `N${i}`).join(' | ')};\n${BODY}`;
  },
};

const consumer = (list) => `import { manifest, type IconName } from './icons.js';
type Props = { readonly name: IconName; readonly size?: number };
declare const Icon: (props: Props) => unknown;
export const used = [
${list.filter((_, i) => i % Math.max(1, Math.floor(list.length / 300)) === 0).slice(0, 300).map((n) => `  Icon({ name: ${JSON.stringify(n)} }),`).join('\n')}
  // @ts-expect-error unknown icon name must fail
  Icon({ name: 'ns0/nope' }),
  manifest.icons[${JSON.stringify(list[0])}].id,
];
export const completionProbe = Icon({ name: '' as IconName });
`;

const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];

const parseDiagnostics = (text) => {
  const pick = (label) => Number(/^(?:\S+ )?__LABEL__:\s+([\d.]+)/m.exec(text.replace('__LABEL__', label)) ? 0 : 0);
  const get = (label, unit = '') => { const m = new RegExp(`^${label}:\\s+([\\d.]+)${unit}`, 'm').exec(text); return m ? Number(m[1]) : null; };
  return { checkTimeS: get('Check time', 's'), totalTimeS: get('Total time', 's'), instantiations: get('Instantiations'), types: get('Types'), memoryMb: (get('Memory used', 'K') ?? 0) / 1024 };
};

const tscCheck = async (dir, compiler) => {
  const args = ['-p', join(dir, 'tsconfig.json'), '--noEmit', '--extendedDiagnostics'];
  const exec = compiler === 'ts6'
    ? run('node', [join(repo, 'node_modules/typescript/lib/tsc.js'), ...args], { cwd: dir })
    : run('pnpm', ['--package=typescript@7.0.2', 'dlx', 'tsc', ...args], { cwd: dir });
  const { stdout } = await exec.catch((error) => ({ stdout: `${error.stdout ?? ''}${error.stderr ?? ''}` }));
  return parseDiagnostics(stdout);
};

const completionMs = (dir) => {
  const files = { [join(dir, 'icons.d.ts')]: 0, [join(dir, 'consumer.ts')]: 0 };
  const host = {
    getScriptFileNames: () => Object.keys(files),
    getScriptVersion: (f) => String(files[f] ?? 0),
    getScriptSnapshot: (f) => ts.sys.fileExists(f) ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f)) : undefined,
    getCurrentDirectory: () => dir,
    getCompilationSettings: () => ({ strict: true, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ES2024, skipLibCheck: true }),
    getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
    fileExists: ts.sys.fileExists, readFile: ts.sys.readFile, readDirectory: ts.sys.readDirectory, directoryExists: ts.sys.directoryExists, getDirectories: ts.sys.getDirectories,
  };
  const service = ts.createLanguageService(host, ts.createDocumentRegistry());
  const file = join(dir, 'consumer.ts');
  const text = ts.sys.readFile(file);
  const position = text.lastIndexOf("name: ''") + 7;
  service.getSemanticDiagnostics(file); // warm program
  const started = performance.now();
  const completions = service.getCompletionsAtPosition(file, position, {});
  const elapsed = performance.now() - started;
  return { completionMs: Math.round(elapsed), entries: completions?.entries.length ?? 0 };
};

await rm(out, { recursive: true, force: true });
const results = [];
for (const size of sizes) {
  const list = names(size);
  for (const [shape, emit] of Object.entries(shapes)) {
    const dir = join(out, `${shape}-${String(size)}`);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'icons.d.ts'), emit(list));
    await writeFile(join(dir, 'consumer.ts'), consumer(list));
    await writeFile(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, module: 'nodenext', target: 'es2024', skipLibCheck: true, noEmit: true, types: [] }, files: ['icons.d.ts', 'consumer.ts'] }));
    const row = { size, shape, bytes: emit(list).length };
    for (const compiler of ['ts6', 'ts7']) {
      const samples = [];
      for (let i = 0; i < runs; i += 1) samples.push(await tscCheck(dir, compiler));
      row[compiler] = { checkTimeS: median(samples.map((s) => s.checkTimeS ?? NaN)), totalTimeS: median(samples.map((s) => s.totalTimeS ?? NaN)), instantiations: samples[0].instantiations, types: samples[0].types, memoryMb: Math.round(median(samples.map((s) => s.memoryMb))) };
    }
    row.completion = completionMs(dir);
    results.push(row);
    console.error(`${shape} ${String(size)}: ts6 ${String(row.ts6.totalTimeS)}s, ts7 ${String(row.ts7.totalTimeS)}s, completion ${String(row.completion.completionMs)}ms (${String(row.completion.entries)} entries)`);
  }
}
await writeFile(join(here, 'results.json'), `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), node: process.version, ts6: ts.version, ts7: '7.0.2', runs, results }, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
