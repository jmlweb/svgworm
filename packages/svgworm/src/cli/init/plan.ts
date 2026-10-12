import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, posix, relative } from 'node:path';

import { DEFAULT_CONFIG_FILE } from '../../core/config/resolve.ts';

/** What `init` was asked to set up. Every field has a default, so no flag is required (R-56). */
export type InitOptions = {
  readonly configFile: string;
  readonly sources: readonly string[];
  readonly outDir: string | undefined;
  readonly publicPath: string | undefined;
  readonly moduleDir: string | undefined;
  readonly flatten: boolean | undefined;
  /** Add `predev` and `prebuild` scripts to package.json. */
  readonly addScripts: boolean;
  /** Write the `createIcon` wiring. `undefined` means "when the project uses React". */
  readonly addComponent: boolean | undefined;
  /** Where the wiring goes. `undefined` picks `src/components/icon.tsx` or `components/icon.tsx`. */
  readonly componentFile: string | undefined;
  /** Append a svgworm section to AGENTS.md (opt-in, TSK-031). */
  readonly addAgentsMd: boolean;
};

export const PackageManager = {
  PNPM: 'pnpm',
  YARN: 'yarn',
  BUN: 'bun',
  NPM: 'npm',
} as const;
export type PackageManager =
  (typeof PackageManager)[keyof typeof PackageManager];

type PackageJson = {
  readonly text: string;
  readonly value: Record<string, unknown>;
  readonly indent: string;
  readonly hasTrailingNewline: boolean;
};

/** Facts read from the project folder before planning. */
export type ProjectFacts = {
  readonly hasPackageJson: boolean;
  /** Parsed package.json, or `undefined` when missing or not a JSON object. */
  readonly packageJson: PackageJson | undefined;
  readonly usesReact: boolean;
  readonly hasSrcFolder: boolean;
  readonly packageManager: PackageManager;
  readonly existing: Readonly<Record<string, string>>;
};

export const InitStatus = {
  CREATED: 'created',
  UPDATED: 'updated',
  UNCHANGED: 'unchanged',
  SKIPPED: 'skipped',
} as const;
export type InitStatus = (typeof InitStatus)[keyof typeof InitStatus];

/** One file `init` looked at: what should be on disk, or why it is left alone. */
export type InitAction = {
  /** Path from `cwd`, `/`-separated. */
  readonly path: string;
  readonly status: InitStatus;
  /** The full content to write, for `created` and `updated`. */
  readonly content?: string;
  readonly reason?: string;
};

export type InitPlan = {
  readonly actions: readonly InitAction[];
  readonly nextSteps: readonly string[];
};

const DEFAULT_SOURCE = 'icons';
const DEFAULT_MODULE_DIR = 'svgworm';
const SCHEMA_URL = 'https://unpkg.com/svgworm/svgworm.schema.json';
const AGENTS_START = '<!-- svgworm:start -->';
const AGENTS_END = '<!-- svgworm:end -->';

export const defaultInitOptions = (): InitOptions => ({
  configFile: DEFAULT_CONFIG_FILE,
  sources: [DEFAULT_SOURCE],
  outDir: undefined,
  publicPath: undefined,
  moduleDir: undefined,
  flatten: undefined,
  addScripts: true,
  addComponent: undefined,
  componentFile: undefined,
  addAgentsMd: false,
});

const toPosix = (path: string): string => path.replaceAll('\\', '/');

const readText = async (path: string): Promise<string | undefined> => {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return undefined;
  }
};

const isDirectory = async (path: string): Promise<boolean> =>
  stat(path).then(
    (stats) => stats.isDirectory(),
    () => false,
  );

const parsePackageJson = (text: string): PackageJson | undefined => {
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return undefined;
    }
    const indent = /^(\s+)"/m.exec(text)?.[1] ?? '  ';
    return {
      text,
      value: value as Record<string, unknown>,
      indent,
      hasTrailingNewline: text.endsWith('\n'),
    };
  } catch {
    return undefined;
  }
};

const dependencyNames = (pkg: PackageJson | undefined): ReadonlySet<string> => {
  const names = new Set<string>();
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkg?.value[field];
    if (typeof deps === 'object' && deps !== null) {
      Object.keys(deps).forEach((name) => names.add(name));
    }
  }
  return names;
};

const detectPackageManager = (
  names: readonly string[],
  pkg: PackageJson | undefined,
): PackageManager => {
  const declared = pkg?.value['packageManager'];
  if (typeof declared === 'string') {
    const name = declared.split('@')[0];
    if (name === 'pnpm' || name === 'yarn' || name === 'bun') return name;
  }
  if (names.includes('pnpm-lock.yaml')) return PackageManager.PNPM;
  if (names.includes('yarn.lock')) return PackageManager.YARN;
  if (names.includes('bun.lock') || names.includes('bun.lockb')) {
    return PackageManager.BUN;
  }
  return PackageManager.NPM;
};

export const componentFileFor = (
  options: InitOptions,
  hasSrcFolder: boolean,
): string =>
  toPosix(
    options.componentFile ??
      (hasSrcFolder ? 'src/components/icon.tsx' : 'components/icon.tsx'),
  );

/** Reads everything `planInit` needs. The only I/O before the plan is shown. */
export const inspectProject = async (
  cwd: string,
  options: InitOptions,
): Promise<ProjectFacts> => {
  const names = await readdir(cwd).catch(() => [] as string[]);
  const packageText = await readText(join(cwd, 'package.json'));
  const packageJson =
    packageText === undefined ? undefined : parsePackageJson(packageText);
  const deps = dependencyNames(packageJson);
  const hasSrcFolder = await isDirectory(join(cwd, 'src'));
  const componentFile = componentFileFor(options, hasSrcFolder);
  const existing: Record<string, string> = {};
  for (const path of [options.configFile, componentFile, 'AGENTS.md']) {
    const text = await readText(join(cwd, path));
    if (text !== undefined) existing[toPosix(path)] = text;
  }
  return {
    hasPackageJson: packageText !== undefined,
    packageJson,
    usesReact: deps.has('react') || deps.has('next'),
    hasSrcFolder,
    packageManager: detectPackageManager(names, packageJson),
    existing,
  };
};

const configContent = (options: InitOptions): string => {
  const config = {
    $schema: SCHEMA_URL,
    sources: options.sources,
    ...(options.outDir === undefined ? {} : { outDir: options.outDir }),
    ...(options.publicPath === undefined
      ? {}
      : { publicPath: options.publicPath }),
    ...(options.moduleDir === undefined
      ? {}
      : { moduleDir: options.moduleDir }),
    ...(options.flatten === undefined ? {} : { flatten: options.flatten }),
  };
  return `${JSON.stringify(config, null, 2)}\n`;
};

const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : typeof value === 'object' && value !== null
      ? Object.fromEntries(
          Object.entries(value)
            .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([key, item]) => [key, canonical(item)]),
        )
      : value;

/** Same data, whatever the key order or formatting. */
const sameJson = (a: string, b: string): boolean => {
  try {
    return (
      JSON.stringify(canonical(JSON.parse(a))) ===
      JSON.stringify(canonical(JSON.parse(b)))
    );
  } catch {
    return false;
  }
};

const planFile = (
  path: string,
  content: string,
  existing: string | undefined,
  isSame: (a: string, b: string) => boolean = (a, b) => a === b,
): InitAction => {
  if (existing === undefined) {
    return { path, status: InitStatus.CREATED, content };
  }
  if (isSame(existing, content)) {
    return { path, status: InitStatus.UNCHANGED };
  }
  return {
    path,
    status: InitStatus.SKIPPED,
    reason: 'exists with different content; edit it by hand',
  };
};

const SCRIPT_HOOKS = ['predev', 'prebuild'] as const;

const planScripts = (facts: ProjectFacts): InitAction => {
  const path = 'package.json';
  const pkg = facts.packageJson;
  if (pkg === undefined) {
    return {
      path,
      status: InitStatus.SKIPPED,
      reason: facts.hasPackageJson
        ? 'package.json is not a JSON object'
        : 'no package.json in this folder',
    };
  }
  const scripts =
    typeof pkg.value['scripts'] === 'object' && pkg.value['scripts'] !== null
      ? { ...(pkg.value['scripts'] as Record<string, unknown>) }
      : {};
  let changed = false;
  for (const hook of SCRIPT_HOOKS) {
    const current = scripts[hook];
    if (current === undefined || current === '') {
      scripts[hook] = 'svgworm';
      changed = true;
    } else if (typeof current === 'string' && !/\bsvgworm\b/.test(current)) {
      // Keep what is there, run svgworm first so the output exists before the app starts.
      scripts[hook] = `svgworm && ${current}`;
      changed = true;
    }
  }
  if (!changed) return { path, status: InitStatus.UNCHANGED };
  const next = { ...pkg.value, scripts };
  const text =
    JSON.stringify(next, null, pkg.indent) +
    (pkg.hasTrailingNewline ? '\n' : '');
  return { path, status: InitStatus.UPDATED, content: text };
};

const componentContent = (componentFile: string, moduleDir: string): string => {
  const fromDir = dirname(componentFile);
  const target = toPosix(relative(fromDir, join(moduleDir, 'icons.js')));
  const specifier = target.startsWith('.') ? target : `./${target}`;
  return [
    "import { createIcon } from '@svgworm/react';",
    '',
    `import { manifest } from '${specifier}';`,
    '',
    '// A Server Component with no hooks and no client directive. Create it once, render it anywhere on the server.',
    'export const Icon = createIcon(manifest);',
    '',
    `export type { IconName } from '${specifier}';`,
    '',
  ].join('\n');
};

const agentsSection = (
  options: InitOptions,
  componentFile: string | undefined,
): string => {
  const moduleDir = options.moduleDir ?? DEFAULT_MODULE_DIR;
  const outDir = options.outDir ?? 'public/icons';
  const lines = [
    AGENTS_START,
    '## Icons (svgworm)',
    '',
    `- SVG icons live in \`${options.sources.join('`, `')}\`. Do not edit the generated files.`,
    `- \`svgworm\` (runs before \`dev\` and \`build\`) writes the hashed sprite to \`${outDir}/\` and the manifest and types to \`${moduleDir}/\`.`,
    ...(componentFile === undefined
      ? []
      : [
          `- Render icons with \`<Icon name="…" />\` from \`${componentFile}\`. \`name\` is typed from \`${moduleDir}/icons.d.ts\`; an unknown name is a type error.`,
        ]),
    '- `svgworm check` exits 1 when the committed output is stale. `svgworm --json` and `svgworm check --json` print one JSON document.',
    '- Docs for agents: https://github.com/jmlweb/svgworm/blob/main/llms.txt',
    AGENTS_END,
  ];
  return lines.join('\n');
};

const planAgentsMd = (
  section: string,
  existing: string | undefined,
): InitAction => {
  const path = 'AGENTS.md';
  if (existing === undefined) {
    return {
      path,
      status: InitStatus.CREATED,
      content: `# AGENTS.md\n\n${section}\n`,
    };
  }
  const start = existing.indexOf(AGENTS_START);
  const end = existing.indexOf(AGENTS_END);
  if (start !== -1 && end > start) {
    const current = existing.slice(start, end + AGENTS_END.length);
    if (current === section) return { path, status: InitStatus.UNCHANGED };
    return {
      path,
      status: InitStatus.UPDATED,
      content:
        existing.slice(0, start) +
        section +
        existing.slice(end + AGENTS_END.length),
    };
  }
  const separator = existing.endsWith('\n\n')
    ? ''
    : existing.endsWith('\n')
      ? '\n'
      : '\n\n';
  return {
    path,
    status: InitStatus.UPDATED,
    content: `${existing}${separator}${section}\n`,
  };
};

const installCommand = (manager: PackageManager): readonly string[] => {
  switch (manager) {
    case PackageManager.PNPM:
      return ['pnpm add -D svgworm', 'pnpm add @svgworm/react'];
    case PackageManager.YARN:
      return ['yarn add -D svgworm', 'yarn add @svgworm/react'];
    case PackageManager.BUN:
      return ['bun add -d svgworm', 'bun add @svgworm/react'];
    case PackageManager.NPM:
      return ['npm install -D svgworm', 'npm install @svgworm/react'];
  }
};

/** Pure: turns options and facts into the files to write. Nothing is touched here. */
export const planInit = (
  options: InitOptions,
  facts: ProjectFacts,
): InitPlan => {
  const configPath = toPosix(options.configFile);
  const addComponent = options.addComponent ?? facts.usesReact;
  const componentFile = componentFileFor(options, facts.hasSrcFolder);
  const moduleDir = options.moduleDir ?? DEFAULT_MODULE_DIR;

  const actions: InitAction[] = [
    planFile(
      configPath,
      configContent(options),
      facts.existing[configPath],
      sameJson,
    ),
  ];
  if (options.addScripts) actions.push(planScripts(facts));
  if (addComponent) {
    actions.push(
      planFile(
        componentFile,
        componentContent(componentFile, moduleDir),
        facts.existing[componentFile],
      ),
    );
  } else if (options.addComponent === undefined) {
    actions.push({
      path: componentFile,
      status: InitStatus.SKIPPED,
      reason:
        'no react or next dependency found; pass --component to write it anyway',
    });
  }
  if (options.addAgentsMd) {
    actions.push(
      planAgentsMd(
        agentsSection(options, addComponent ? componentFile : undefined),
        facts.existing['AGENTS.md'],
      ),
    );
  }

  const deps = dependencyNames(facts.packageJson);
  const install = installCommand(facts.packageManager).filter(
    (command, index) =>
      index === 0
        ? !deps.has('svgworm')
        : addComponent && !deps.has('@svgworm/react'),
  );
  const run =
    facts.packageManager === PackageManager.NPM
      ? 'npx svgworm'
      : `${facts.packageManager} svgworm`;
  const nextSteps = [
    ...install.map((command) => `Install: ${command}`),
    `Put SVG files in ${options.sources.join(', ')}/ and run: ${run}`,
    ...(addComponent
      ? [
          `Import { Icon } from ${posix.join('.', componentFile.replace(/\.tsx?$/, ''))} in a Server Component and render <Icon name="…" />`,
        ]
      : []),
    `In CI, run: ${run} check`,
  ];
  return { actions, nextSteps };
};
