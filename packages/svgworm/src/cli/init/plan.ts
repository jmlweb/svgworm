import { open, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, posix, relative, resolve } from 'node:path';

import {
  DEFAULT_CONFIG_FILE,
  DEFAULT_SOURCE,
  resolveConfig,
} from '../../core/config/resolve.ts';
import { discoverSvgFiles } from '../../core/discover.ts';
import { ConfigError } from '../../core/errors.ts';
import { listDirectory, readTextIfPresent, toPosix } from '../../core/fs.ts';
import { SAMPLE_ICON_NAME, SAMPLE_ICON_SVG } from './sample-icon.ts';

export const Framework = {
  REACT: 'react',
  ASTRO: 'astro',
  VUE: 'vue',
  SVELTE: 'svelte',
} as const;
export type Framework = (typeof Framework)[keyof typeof Framework];

export const FrameworkSource = {
  FLAG: 'flag',
  PROMPT: 'prompt',
  DETECTED: 'detected',
} as const;
export type FrameworkSource =
  (typeof FrameworkSource)[keyof typeof FrameworkSource];

/** What `init` was asked to set up. Every field has a default, so no flag is required (R-56). */
export type InitOptions = {
  readonly configFile: string;
  readonly sources: readonly string[];
  readonly outDir: string | undefined;
  readonly publicPath: string | undefined;
  readonly moduleDir: string | undefined;
  readonly flatten: boolean | undefined;
  /** Run svgworm from package.json scripts: `predev` and `prebuild`, or `dev` and `build` on Yarn 2+. */
  readonly addScripts: boolean;
  /** `--framework`. `undefined` means "detect it from the dependencies" (ADR-0017). */
  readonly framework: Framework | undefined;
  /** Where `framework` came from when it is set: a flag by default, or a prompt answer. */
  readonly frameworkSource?: Exclude<FrameworkSource, 'detected'>;
  /** Write the icon component. `undefined` means "when a supported framework is found". */
  readonly addComponent: boolean | undefined;
  /** Where the wiring goes. `undefined` picks the framework's file name and folder (`componentFileFor`). */
  readonly componentFile: string | undefined;
  /** Append a svgworm section to AGENTS.md (opt-in, TSK-031). */
  readonly addAgentsMd: boolean;
  /** `--cdn-url`: serve sprites from this https origin with `crossOrigin: "inject"` (ADR-0027). */
  readonly cdnUrl: string | undefined;
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
  readonly newline: '\n' | '\r\n';
  readonly hasTrailingNewline: boolean;
};

/** Facts read from the project folder before planning. */
export type ProjectFacts = {
  readonly hasPackageJson: boolean;
  /** The nearest folder above `cwd` with a package.json, when `cwd` has none (stops at the repo root). */
  readonly packageJsonAbove: string | undefined;
  /** Parsed package.json, or `undefined` when missing or not a JSON object. */
  readonly packageJson: PackageJson | undefined;
  readonly usesReact: boolean;
  /** Next.js: the component is a Server Component and the public path may carry a basePath. */
  readonly usesNext: boolean;
  readonly usesAstro: boolean;
  /** `vue` or `nuxt` (ADR-0034). */
  readonly usesVue: boolean;
  readonly usesNuxt: boolean;
  /** `svelte` or `@sveltejs/kit` (ADR-0034). */
  readonly usesSvelte: boolean;
  readonly usesSvelteKit: boolean;
  readonly hasSrcFolder: boolean;
  /** Nuxt 4 keeps components under `app/`. */
  readonly hasAppFolder: boolean;
  readonly packageManager: PackageManager;
  /** The package manager runs `pre<name>` scripts. Yarn 2+ dropped them for user scripts. */
  readonly runsScriptHooks: boolean;
  readonly existing: Readonly<Record<string, string>>;
  /** Some source folder already holds an SVG that `build` would read. */
  readonly sourcesHaveIcons: boolean;
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
  /** What the file held when it was planned, for `updated`; apply refuses to overwrite anything else. */
  readonly previous?: string;
  readonly reason?: string;
  /** Something the user must fix by hand, even though the file itself was handled. */
  readonly warning?: string;
};

export type InitPlan = {
  /** The framework the component was planned for; `undefined` when none applies. */
  readonly framework: Framework | undefined;
  readonly frameworkSource: FrameworkSource | undefined;
  readonly actions: readonly InitAction[];
  readonly nextSteps: readonly string[];
};

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
  framework: undefined,
  addScripts: true,
  addComponent: undefined,
  componentFile: undefined,
  addAgentsMd: false,
  cdnUrl: undefined,
});

// An unreadable file must not be treated as free to create, so only ENOENT means "absent".
const readText = readTextIfPresent;

const isFile = async (path: string): Promise<boolean> =>
  stat(path).then(
    (stats) => stats.isFile(),
    () => false,
  );

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
    // Spaces or tabs only: `\s` would swallow a blank line into the indent.
    const indent = /^([ \t]+)"/m.exec(text)?.[1] ?? '  ';
    return {
      text,
      value: value as Record<string, unknown>,
      indent,
      newline: text.includes('\r\n') ? '\r\n' : '\n',
      hasTrailingNewline: /\r?\n$/.test(text),
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

const LOCKFILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'bun.lock',
  'bun.lockb',
] as const;

// Berry lockfiles open with a `__metadata:` block; classic ones say `yarn lockfile v1`.
const isBerryLockfile = async (path: string): Promise<boolean> => {
  const file = await open(path, 'r');
  try {
    const { buffer, bytesRead } = await file.read({
      buffer: Buffer.alloc(1024),
    });
    return /^__metadata:/m.test(buffer.toString('utf8', 0, bytesRead));
  } finally {
    await file.close();
  }
};

/** What one folder says about Yarn 2+: yes, no, or nothing (look at the parent). */
const berrySignal = async (
  dir: string,
  names: readonly string[],
  pkg: PackageJson | undefined,
): Promise<boolean | undefined> => {
  const declared = pkg?.value['packageManager'];
  if (typeof declared === 'string') {
    const yarn = /^yarn@(\d+)/.exec(declared);
    return yarn !== null && Number(yarn[1]) >= 2;
  }
  if (names.includes('.yarnrc.yml')) return true;
  if (names.includes('yarn.lock')) {
    return isBerryLockfile(join(dir, 'yarn.lock'));
  }
  if (LOCKFILES.some((name) => names.includes(name))) return false;
  return undefined;
};

/**
 * Yarn 2+ skips `predev` and `prebuild`, silently. A workspace package keeps its Yarn config at
 * the monorepo root, so the search walks up to the repository root. The home folder is skipped:
 * a global `~/.yarnrc.yml` says nothing about this project.
 */
const detectYarnBerry = async (
  cwd: string,
  names: readonly string[],
  pkg: PackageJson | undefined,
): Promise<boolean> => {
  const home = resolve(homedir());
  let dir = resolve(cwd);
  let dirNames = names;
  let dirPkg = pkg;
  for (;;) {
    if (dir !== home) {
      const signal = await berrySignal(dir, dirNames, dirPkg);
      if (signal !== undefined) return signal;
    }
    const parent = dirname(dir);
    if (dirNames.includes('.git') || parent === dir) return false;
    dir = parent;
    dirNames = await readdir(dir).catch(() => [] as string[]);
    const text = dirNames.includes('package.json')
      ? await readText(join(dir, 'package.json')).catch(() => undefined)
      : undefined;
    dirPkg = text === undefined ? undefined : parsePackageJson(text);
  }
};

type FrameworkFacts = Pick<
  ProjectFacts,
  'usesReact' | 'usesAstro' | 'usesVue' | 'usesSvelte'
>;

// Meta-frameworks first: an Astro site may carry vue or svelte integrations, and a Vue or
// Svelte app may still depend on react for one widget (ADR-0034).
const PRECEDENCE = [
  Framework.ASTRO,
  Framework.VUE,
  Framework.SVELTE,
  Framework.REACT,
] as const;

const IS_DETECTED = {
  [Framework.ASTRO]: (facts: FrameworkFacts) => facts.usesAstro,
  [Framework.VUE]: (facts: FrameworkFacts) => facts.usesVue,
  [Framework.SVELTE]: (facts: FrameworkFacts) => facts.usesSvelte,
  [Framework.REACT]: (facts: FrameworkFacts) => facts.usesReact,
} as const;

/** Every framework found in the dependencies, in precedence order. */
export const detectedFrameworks = (
  facts: FrameworkFacts,
): readonly Framework[] =>
  PRECEDENCE.filter((framework) => IS_DETECTED[framework](facts));

/** Flag first, then the dependencies by precedence. The choice is reported, never silent. */
export const resolveFramework = (
  options: InitOptions,
  facts: FrameworkFacts,
): {
  readonly framework: Framework | undefined;
  readonly source: FrameworkSource | undefined;
} => {
  if (options.framework !== undefined) {
    return {
      framework: options.framework,
      source: options.frameworkSource ?? FrameworkSource.FLAG,
    };
  }
  const [detected] = detectedFrameworks(facts);
  return detected === undefined
    ? { framework: undefined, source: undefined }
    : { framework: detected, source: FrameworkSource.DETECTED };
};

const COMPONENT_EXTENSION = {
  [Framework.REACT]: { pattern: /\.[jt]sx$/, label: '.tsx or .jsx' },
  [Framework.ASTRO]: { pattern: /\.astro$/, label: '.astro' },
  [Framework.VUE]: { pattern: /\.vue$/, label: '.vue' },
  [Framework.SVELTE]: { pattern: /\.svelte$/, label: '.svelte' },
} as const;

// The loader of crossOrigin "inject" needs a script in the page, which Vue templates refuse and
// Svelte only replays on hydration. Until a spike settles it, init says so (ADR-0034).
const HAS_CDN_LOADER = {
  [Framework.REACT]: true,
  [Framework.ASTRO]: true,
  [Framework.VUE]: false,
  [Framework.SVELTE]: false,
} as const;

/** `init` writes a sprite loader for this framework, so `--cdn-url` works with it. */
export const hasCdnLoader = (framework: Framework): boolean =>
  HAS_CDN_LOADER[framework];

/**
 * Framework choices `init` cannot honor: a `--component-file` without the framework's
 * extension, or `--cdn-url` for a framework with no generated loader.
 */
export const frameworkProblem = (
  options: InitOptions,
  facts: FrameworkFacts,
): string | undefined => {
  const { framework } = resolveFramework(options, facts);
  if (framework === undefined) return undefined;
  const file = options.componentFile;
  const extension = COMPONENT_EXTENSION[framework];
  if (file !== undefined && !extension.pattern.test(file)) {
    return `--component-file "${file}" does not match the ${framework} component (${extension.label})`;
  }
  if (options.cdnUrl !== undefined && !hasCdnLoader(framework)) {
    return `--cdn-url is not supported for ${framework} yet: init does not write its sprite loader (see https://svgworm.com/docs/${framework})`;
  }
  return undefined;
};

const COMPONENT_NAME = {
  [Framework.REACT]: 'icon.tsx',
  [Framework.ASTRO]: 'Icon.astro',
  [Framework.VUE]: 'Icon.vue',
  [Framework.SVELTE]: 'Icon.svelte',
} as const;

type LayoutFacts = Pick<
  ProjectFacts,
  'hasSrcFolder' | 'hasAppFolder' | 'usesNuxt' | 'usesSvelteKit'
>;

const componentDir = (
  layout: LayoutFacts,
  framework: Framework | undefined,
): string => {
  // SvelteKit resolves `$lib` to src/lib; Nuxt auto-imports components/ under its srcDir,
  // which is app/ in Nuxt 4 and the project root in Nuxt 3.
  if (framework === Framework.SVELTE && layout.usesSvelteKit) {
    return 'src/lib/components';
  }
  if (framework === Framework.VUE && layout.usesNuxt) {
    return layout.hasAppFolder ? 'app/components' : 'components';
  }
  return layout.hasSrcFolder ? 'src/components' : 'components';
};

export const componentFileFor = (
  options: InitOptions,
  layout: LayoutFacts,
  framework: Framework | undefined,
): string =>
  toPosix(
    options.componentFile ??
      `${componentDir(layout, framework)}/${COMPONENT_NAME[framework ?? Framework.REACT]}`,
  );

// Same walk as `build`, so "has icons" agrees with what the build will find. A missing folder is empty.
const hasIcons = async (
  cwd: string,
  sources: readonly string[],
): Promise<boolean> => {
  for (const source of sources) {
    try {
      if ((await discoverSvgFiles(cwd, [source])).files.length > 0) return true;
    } catch (error) {
      if (!(error instanceof ConfigError)) throw error;
    }
  }
  return false;
};

// init from `src/` would write the config there and never find package.json. Stop at the repo root.
const findPackageJsonAbove = async (
  cwd: string,
): Promise<string | undefined> => {
  let dir = resolve(cwd);
  for (;;) {
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    const names = await listDirectory(dir);
    if (names.includes('.git')) return undefined;
    dir = parent;
    if (await isFile(join(dir, 'package.json'))) return dir;
  }
};

/** Reads everything `planInit` needs. The only I/O before the plan is shown. */
export const inspectProject = async (
  cwd: string,
  options: InitOptions,
): Promise<ProjectFacts> => {
  const names = await listDirectory(cwd);
  const packageText = await readText(join(cwd, 'package.json'));
  const packageJson =
    packageText === undefined ? undefined : parsePackageJson(packageText);
  const deps = dependencyNames(packageJson);
  const hasSrcFolder = await isDirectory(join(cwd, 'src'));
  const hasAppFolder = await isDirectory(join(cwd, 'app'));
  const usesReact = deps.has('react') || deps.has('next');
  const usesNext = deps.has('next');
  const usesAstro = deps.has('astro');
  const usesNuxt = deps.has('nuxt');
  const usesVue = deps.has('vue') || usesNuxt;
  const usesSvelteKit = deps.has('@sveltejs/kit');
  const usesSvelte = deps.has('svelte') || usesSvelteKit;
  const detection = { usesReact, usesAstro, usesVue, usesSvelte };
  const componentFile = componentFileFor(
    options,
    { hasSrcFolder, hasAppFolder, usesNuxt, usesSvelteKit },
    resolveFramework(options, detection).framework,
  );
  const isYarnBerry = await detectYarnBerry(cwd, names, packageJson);
  const localManager = detectPackageManager(names, packageJson);
  const existing: Record<string, string> = {};
  for (const path of [options.configFile, componentFile, 'AGENTS.md']) {
    const text = await readText(join(cwd, path));
    if (text !== undefined) existing[toPosix(path)] = text;
  }
  return {
    hasPackageJson: packageText !== undefined,
    packageJsonAbove:
      packageText === undefined ? await findPackageJsonAbove(cwd) : undefined,
    packageJson,
    usesReact,
    usesNext,
    usesAstro,
    usesVue,
    usesNuxt,
    usesSvelte,
    usesSvelteKit,
    hasSrcFolder,
    hasAppFolder,
    // A workspace package with no signal of its own follows the Yarn 2+ root above it.
    packageManager:
      isYarnBerry && localManager === PackageManager.NPM
        ? PackageManager.YARN
        : localManager,
    runsScriptHooks: !isYarnBerry,
    existing,
    sourcesHaveIcons: await hasIcons(cwd, options.sources),
  };
};

const configContent = (options: InitOptions): string => {
  const isCdn = options.cdnUrl !== undefined;
  const outDir = options.outDir ?? (isCdn ? 'public/icons' : undefined);
  const publicPath = options.cdnUrl ?? options.publicPath;
  const config = {
    $schema: SCHEMA_URL,
    sources: options.sources,
    ...(outDir === undefined ? {} : { outDir }),
    ...(publicPath === undefined ? {} : { publicPath }),
    ...(options.moduleDir === undefined
      ? {}
      : { moduleDir: options.moduleDir }),
    ...(options.flatten === undefined ? {} : { flatten: options.flatten }),
    ...(isCdn ? { crossOrigin: 'inject' } : {}),
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
const HOOKED_SCRIPTS = ['dev', 'build'] as const;

// `svgworm` as a command word, not as part of `svgworm-foo` or `my-svgworm-wrapper`.
const RUNS_SVGWORM = /(?:^|[\s&|;(])svgworm(?=$|[\s&|;)])/;

// `svgworm && a || b` runs `b` when svgworm fails, `svgworm && a; b` too, and `svgworm && a & b`
// starts `b` without waiting. Pipes, redirects such as `2>&1` and `&&` chains keep their meaning.
const UNSAFE_TO_PREFIX = /\|\||;|\n|(?<![&>])&(?![&>])/;

/**
 * The `--config` flag for scripts and next steps: empty for the default file. The path is
 * interpolated into a shell line, which is why `pathProblem` rejects spaces and shell
 * characters.
 */
const configFlag = (options: InitOptions): string =>
  options.configFile === DEFAULT_CONFIG_FILE
    ? ''
    : ` --config ${options.configFile}`;

/** The build command the scripts and docs should run: plain, or with the custom config file. */
const buildCommand = (options: InitOptions): string =>
  `svgworm${configFlag(options)}`;

type ScriptsPlan = {
  readonly action: InitAction;
  /** svgworm runs before both `dev` and `build`, so the next steps can say so. */
  readonly runsBeforeDevAndBuild: boolean;
};

type ScriptEdit = {
  readonly scripts: Record<string, unknown>;
  readonly changed: boolean;
  readonly problems: readonly string[];
};

// npm, pnpm and Yarn 1 run `pre<name>` before `<name>`, so svgworm goes there.
const addHooks = (
  scripts: Record<string, unknown>,
  command: string,
): ScriptEdit =>
  SCRIPT_HOOKS.reduce<ScriptEdit>(
    (edit, hook) => {
      const current = edit.scripts[hook];
      if (current === undefined || current === '') {
        return {
          ...edit,
          scripts: { ...edit.scripts, [hook]: command },
          changed: true,
        };
      }
      if (typeof current === 'string' && !RUNS_SVGWORM.test(current)) {
        // Keep what is there, run svgworm first so the output exists before the app starts.
        return {
          ...edit,
          scripts: { ...edit.scripts, [hook]: `${command} && ${current}` },
          changed: true,
        };
      }
      return edit;
    },
    { scripts, changed: false, problems: [] },
  );

// Yarn 2+ never runs `pre<name>` for user scripts, so svgworm goes in front of `dev` and `build`.
const prefixScripts = (
  scripts: Record<string, unknown>,
  command: string,
): ScriptEdit =>
  HOOKED_SCRIPTS.reduce<ScriptEdit>(
    (edit, name) => {
      const current = edit.scripts[name];
      if (typeof current !== 'string' || current.trim() === '') {
        return {
          ...edit,
          problems: [...edit.problems, `there is no "${name}" script`],
        };
      }
      if (RUNS_SVGWORM.test(current)) return edit;
      if (UNSAFE_TO_PREFIX.test(current)) {
        return {
          ...edit,
          problems: [
            ...edit.problems,
            `"${name}" uses ||, ; or & and cannot be prefixed safely`,
          ],
        };
      }
      return {
        ...edit,
        scripts: { ...edit.scripts, [name]: `${command} && ${current}` },
        changed: true,
      };
    },
    { scripts, changed: false, problems: [] },
  );

const planScripts = (facts: ProjectFacts, command: string): ScriptsPlan => {
  const path = 'package.json';
  const pkg = facts.packageJson;
  if (pkg === undefined) {
    return {
      action: {
        path,
        status: InitStatus.SKIPPED,
        reason: facts.hasPackageJson
          ? 'package.json is not a JSON object'
          : 'no package.json in this folder',
      },
      runsBeforeDevAndBuild: false,
    };
  }
  const scripts =
    typeof pkg.value['scripts'] === 'object' && pkg.value['scripts'] !== null
      ? { ...(pkg.value['scripts'] as Record<string, unknown>) }
      : {};
  const edit = facts.runsScriptHooks
    ? addHooks(scripts, command)
    : prefixScripts(scripts, command);
  const warning =
    edit.problems.length === 0
      ? undefined
      : `Yarn 2+ does not run predev or prebuild, and ${edit.problems.join(' and ')}: run \`${command}\` before your dev server and build by hand`;
  const result = { runsBeforeDevAndBuild: warning === undefined };
  if (!edit.changed) {
    return {
      ...result,
      action: {
        path,
        status: InitStatus.UNCHANGED,
        ...(warning === undefined ? {} : { warning }),
      },
    };
  }
  const next = { ...pkg.value, scripts: edit.scripts };
  // Like npm itself: re-serialized with the file's own indent and line endings.
  const text =
    JSON.stringify(next, null, pkg.indent).replaceAll('\n', pkg.newline) +
    (pkg.hasTrailingNewline ? pkg.newline : '');
  return {
    ...result,
    action: {
      path,
      status: InitStatus.UPDATED,
      content: text,
      previous: pkg.text,
      ...(warning === undefined ? {} : { warning }),
    },
  };
};

const manifestSpecifier = (
  componentFile: string,
  moduleDir: string,
): string => {
  const target = toPosix(
    relative(dirname(componentFile), join(moduleDir, 'icons.js')),
  );
  return target.startsWith('.') ? target : `./${target}`;
};

const componentContent = (
  componentFile: string,
  moduleDir: string,
  isCdn: boolean,
): string => {
  const specifier = manifestSpecifier(componentFile, moduleDir);
  return [
    isCdn
      ? "import { createIcon, createSpriteLoader } from '@svgworm/react';"
      : "import { createIcon } from '@svgworm/react';",
    '',
    `import { manifest } from '${specifier}';`,
    '',
    '// A Server Component with no hooks and no client directive.',
    '// Create it once, render it anywhere on the server.',
    'export const Icon = createIcon(manifest);',
    '',
    ...(isCdn
      ? [
          '// The sprites are on a CDN (crossOrigin "inject"):',
          '// render <SpriteLoader /> once, in the root layout.',
          'export const SpriteLoader = createSpriteLoader(manifest);',
          '',
        ]
      : []),
    `export type { IconName } from '${specifier}';`,
    '',
  ].join('\n');
};

const astroLoaderContent = (
  componentFile: string,
  moduleDir: string,
): string => {
  const specifier = manifestSpecifier(componentFile, moduleDir);
  return `---
// Generated by \`svgworm init\`. The sprites are on a CDN
// (crossOrigin "inject", ADR-0027): render <SvgwormLoader /> once, in the
// layout's <head>. It renders nothing for a same-origin build.
import { manifest } from '${specifier}';

type Loader = { readonly url: string; readonly integrity: string };
const { sprites, version } = manifest as {
  readonly version: number;
  readonly sprites: Readonly<
    Record<string, { readonly loader?: Loader | null }>
  >;
};
const loaders =
  version === 2
    ? Object.values(sprites).flatMap((group) =>
        group.loader ? [group.loader] : [],
      )
    : [];
---
{
  loaders.map((loader) => (
    <script
      async
      src={loader.url}
      integrity={loader.integrity}
      crossorigin="anonymous"
      is:inline
    />
  ))
}
`;
};

export const astroComponentContent = (
  componentFile: string,
  moduleDir: string,
): string => {
  const specifier = manifestSpecifier(componentFile, moduleDir);
  return `---
// Generated by \`svgworm init\`. Renders the same markup as \`createIcon\`
// from @svgworm/react, with no client JavaScript. Keep the delivery logic in
// step with that adapter.
import type { HTMLAttributes } from 'astro/types';

import type { IconName } from '${specifier}';
import { manifest } from '${specifier}';

interface Props extends Omit<HTMLAttributes<'svg'>, 'title' | 'name'> {
  name: IconName;
  /** Accessible name rendered as a <title>; makes the icon non-decorative. */
  title?: string;
  /** Accessible name as aria-label; makes the icon non-decorative. */
  label?: string;
}

type ManifestFile = { readonly url: string };
type ManifestIcon = {
  readonly sprite: string;
  readonly id: string;
  readonly viewBox: string;
  readonly delivery: 'use' | 'img' | 'mask';
};
type IconManifest = {
  readonly version: number;
  readonly sprites: Readonly<
    Record<
      string,
      {
        readonly sprite: ManifestFile | null;
        readonly stack: ManifestFile | null;
      }
    >
  >;
  readonly icons: Readonly<Record<string, ManifestIcon>>;
};

const { icons, sprites, version } = manifest as IconManifest;
if (version !== 1 && version !== 2) {
  throw new Error(
    \`Unsupported svgworm manifest version \${String(version)}; \` +
      'this component reads versions 1 and 2. Update svgworm and run it again.',
  );
}

const {
  name,
  title,
  label,
  width = '1em',
  height = '1em',
  style,
  ...rest
} = Astro.props;

// An own property only: a runtime name such as "constructor" must not find
// Object.prototype.
const icon = Object.hasOwn(icons, name) ? icons[name] : undefined;
if (!icon) {
  throw new Error(\`Unknown icon "\${name}". It is not in the svgworm manifest.\`);
}

const fileUrl = (kind: 'sprite' | 'stack'): string => {
  const file = sprites[icon.sprite]?.[kind];
  if (!file) {
    throw new Error(
      \`Icon "\${name}" needs the \${kind} file of "\${icon.sprite}", \` +
        'but the manifest has none. Run svgworm again.',
    );
  }
  // Version 2 is crossOrigin "inject": SvgwormLoader puts the sprite in the
  // page (ADR-0027).
  return kind === 'sprite' && version === 2
    ? \`#\${icon.id}\`
    : \`\${file.url}#\${icon.id}\`;
};

// <use> draws the symbol at 0,0, so the svg gets only the viewBox size; the
// symbol keeps the origin (ADR-0030).
const [, , viewBoxWidth, viewBoxHeight] = icon.viewBox.trim().split(/[\\s,]+/);
const viewBoxSize = \`0 0 \${viewBoxWidth} \${viewBoxHeight}\`;

const accessibleName = title ?? label;
const a11y =
  accessibleName === undefined
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img' } as const);
// A bare number is pixels, as in React's style prop.
const length = (value: string | number | null): string =>
  typeof value === 'number' ? \`\${value}px\` : (value ?? '');
// Numbers that stay unitless, as in React, so an object style serializes the
// same way.
const UNITLESS = new Set([
  'opacity', 'z-index', 'zoom', 'order', 'flex', 'flex-grow', 'flex-shrink',
  'font-weight', 'line-height', 'scale', 'aspect-ratio', 'tab-size',
  'fill-opacity', 'stroke-opacity', 'stroke-width',
]);
const toProperty = (key: string): string =>
  key.startsWith('--')
    ? key
    : key.replace(/[A-Z]/g, (c) => \`-\${c.toLowerCase()}\`);
const userStyle =
  typeof style === 'string'
    ? style
    : style && typeof style === 'object'
      ? Object.entries(style)
          .filter(
            ([, value]) =>
              value !== undefined && value !== null && value !== '',
          )
          .map(([key, value]) => {
            const property = toProperty(key);
            const isLength =
              typeof value === 'number' &&
              value !== 0 &&
              !UNITLESS.has(property);
            const unit = isLength ? 'px' : '';
            return \`\${property}:\${String(value)}\${unit}\`;
          })
          .join(';')
      : '';
const maskStyle =
  icon.delivery === 'mask'
    ? [
        'display:inline-block',
        \`width:\${length(width)}\`,
        \`height:\${length(height)}\`,
        'background-color:currentColor',
        \`mask:url("\${fileUrl('stack')}") center / contain no-repeat\`,
        userStyle,
      ].join(';')
    : undefined;
---
{
  icon.delivery === 'img' ? (
    <img
      {...rest}
      alt={accessibleName ?? ''}
      height={height}
      src={fileUrl('stack')}
      style={style}
      width={width}
    />
  ) : icon.delivery === 'mask' ? (
    <span {...rest} {...a11y} aria-label={accessibleName} style={maskStyle} />
  ) : (
    <svg
      focusable="false"
      height={height}
      viewBox={viewBoxSize}
      width={width}
      {...a11y}
      aria-label={label}
      style={style}
      {...rest}
    >
      {title === undefined ? null : <title>{title}</title>}
      <use href={fileUrl('sprite')} />
    </svg>
  )
}
`;
};

/** `Icon.vue` for Vue 3.5 and Nuxt (ADR-0034). */
export const vueComponentContent = (
  componentFile: string,
  moduleDir: string,
): string => {
  const specifier = manifestSpecifier(componentFile, moduleDir);
  return `<script setup lang="ts">
// Generated by \`svgworm init\`. Renders the same markup as \`createIcon\`
// from @svgworm/react, with no client JavaScript of its own. Keep the
// delivery logic in step with that adapter.
import { computed, useAttrs } from 'vue';

import type { IconName } from '${specifier}';
import { manifest } from '${specifier}';

type ManifestFile = { readonly url: string };
type ManifestIcon = {
  readonly sprite: string;
  readonly id: string;
  readonly viewBox: string;
  readonly delivery: 'use' | 'img' | 'mask';
};
type IconManifest = {
  readonly version: number;
  readonly sprites: Readonly<
    Record<
      string,
      {
        readonly sprite: ManifestFile | null;
        readonly stack: ManifestFile | null;
      }
    >
  >;
  readonly icons: Readonly<Record<string, ManifestIcon>>;
};

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    name: IconName;
    /** Accessible name rendered as a <title>; makes the icon non-decorative. */
    title?: string;
    /** Accessible name as aria-label; makes the icon non-decorative. */
    label?: string;
    width?: string | number;
    height?: string | number;
  }>(),
  { title: undefined, label: undefined, width: '1em', height: '1em' },
);
const attrs = useAttrs();

const { icons, sprites, version } = manifest as IconManifest;
if (version !== 1 && version !== 2) {
  throw new Error(
    \`Unsupported svgworm manifest version \${String(version)}; \` +
      'this component reads versions 1 and 2. Update svgworm and run it again.',
  );
}

const icon = computed((): ManifestIcon => {
  // An own property only: a runtime name such as "constructor" must not find
  // Object.prototype.
  const found = Object.hasOwn(icons, props.name)
    ? icons[props.name]
    : undefined;
  if (!found) {
    throw new Error(
      \`Unknown icon "\${props.name}". It is not in the svgworm manifest.\`,
    );
  }
  return found;
});

const fileUrl = (kind: 'sprite' | 'stack'): string => {
  const { sprite, id } = icon.value;
  const file = sprites[sprite]?.[kind];
  if (!file) {
    throw new Error(
      \`Icon "\${props.name}" needs the \${kind} file of "\${sprite}", \` +
        'but the manifest has none. Run svgworm again.',
    );
  }
  // Version 2 is crossOrigin "inject": a loader puts the sprite in the page
  // (ADR-0027).
  return kind === 'sprite' && version === 2 ? \`#\${id}\` : \`\${file.url}#\${id}\`;
};

// <use> draws the symbol at 0,0, so the svg gets only the viewBox size; the
// symbol keeps the origin (ADR-0030).
const viewBoxSize = computed(() => {
  const [, , width, height] = icon.value.viewBox.trim().split(/[\\s,]+/);
  return \`0 0 \${width} \${height}\`;
});

const accessibleName = computed(() => props.title ?? props.label);
const a11y = computed(() =>
  accessibleName.value === undefined
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img' } as const),
);
// A bare number is pixels, as in React's style prop.
const length = (value: string | number): string =>
  typeof value === 'number' ? \`\${value}px\` : value;
const maskStyle = computed(() =>
  [
    'display:inline-block',
    \`width:\${length(props.width)}\`,
    \`height:\${length(props.height)}\`,
    'background-color:currentColor',
    \`mask:url("\${fileUrl('stack')}") center / contain no-repeat\`,
  ].join(';'),
);
</script>

<template>
  <img
    v-if="icon.delivery === 'img'"
    v-bind="attrs"
    :alt="accessibleName ?? ''"
    :height="height"
    :src="fileUrl('stack')"
    :width="width"
  />
  <span
    v-else-if="icon.delivery === 'mask'"
    v-bind="{ ...attrs, ...a11y, style: undefined }"
    :aria-label="accessibleName"
    :style="[maskStyle, attrs.style]"
  />
  <svg
    v-else
    focusable="false"
    :height="height"
    :viewBox="viewBoxSize"
    :width="width"
    :aria-label="label"
    v-bind="{ ...a11y, ...attrs }"
  >
    <title v-if="title !== undefined">{{ title }}</title>
    <use :href="fileUrl('sprite')" />
  </svg>
</template>
`;
};

/** `Icon.svelte` for Svelte 5 and SvelteKit (ADR-0034). */
export const svelteComponentContent = (
  componentFile: string,
  moduleDir: string,
): string => {
  const specifier = manifestSpecifier(componentFile, moduleDir);
  return `<script module lang="ts">
  // Generated by \`svgworm init\`. Renders the same markup as \`createIcon\`
  // from @svgworm/react, with no client JavaScript of its own. Keep the
  // delivery logic in step with that adapter.
  import type { SVGAttributes } from 'svelte/elements';

  import type { IconName } from '${specifier}';
  import { manifest } from '${specifier}';

  type ManifestFile = { readonly url: string };
  type ManifestIcon = {
    readonly sprite: string;
    readonly id: string;
    readonly viewBox: string;
    readonly delivery: 'use' | 'img' | 'mask';
  };
  type IconManifest = {
    readonly version: number;
    readonly sprites: Readonly<
      Record<
        string,
        {
          readonly sprite: ManifestFile | null;
          readonly stack: ManifestFile | null;
        }
      >
    >;
    readonly icons: Readonly<Record<string, ManifestIcon>>;
  };

  export interface Props
    extends Omit<SVGAttributes<SVGSVGElement>, 'name' | 'title' | 'style'> {
    name: IconName;
    /** Accessible name rendered as a <title>; makes the icon non-decorative. */
    title?: string;
    /** Accessible name as aria-label; makes the icon non-decorative. */
    label?: string;
    style?: string;
  }

  const { icons, sprites, version } = manifest as IconManifest;
  if (version !== 1 && version !== 2) {
    throw new Error(
      \`Unsupported svgworm manifest version \${String(version)}; \` +
        'this component reads versions 1 and 2. ' +
        'Update svgworm and run it again.',
    );
  }

  // A bare number is pixels, as in React's style prop.
  const length = (value: string | number | null | undefined): string =>
    typeof value === 'number' ? \`\${value}px\` : (value ?? '');
</script>

<script lang="ts">
  let {
    name,
    title,
    label,
    width = '1em',
    height = '1em',
    style,
    ...rest
  }: Props = $props();

  const icon = $derived.by((): ManifestIcon => {
    // An own property only: a runtime name such as "constructor" must not
    // find Object.prototype.
    const found = Object.hasOwn(icons, name) ? icons[name] : undefined;
    if (!found) {
      throw new Error(
        \`Unknown icon "\${name}". It is not in the svgworm manifest.\`,
      );
    }
    return found;
  });

  const fileUrl = (kind: 'sprite' | 'stack'): string => {
    const file = sprites[icon.sprite]?.[kind];
    if (!file) {
      throw new Error(
        \`Icon "\${name}" needs the \${kind} file of "\${icon.sprite}", \` +
          'but the manifest has none. Run svgworm again.',
      );
    }
    // Version 2 is crossOrigin "inject": a loader puts the sprite in the page
    // (ADR-0027).
    return kind === 'sprite' && version === 2
      ? \`#\${icon.id}\`
      : \`\${file.url}#\${icon.id}\`;
  };

  // <use> draws the symbol at 0,0, so the svg gets only the viewBox size;
  // the symbol keeps the origin (ADR-0030).
  const viewBoxSize = $derived.by(() => {
    const [, , width, height] = icon.viewBox.trim().split(/[\\s,]+/);
    return \`0 0 \${width} \${height}\`;
  });

  const accessibleName = $derived(title ?? label);
  const a11y = $derived(
    accessibleName === undefined
      ? ({ 'aria-hidden': true } as const)
      : ({ role: 'img' } as const),
  );
  const maskStyle = $derived(
    icon.delivery === 'mask'
      ? [
          'display:inline-block',
          \`width:\${length(width)}\`,
          \`height:\${length(height)}\`,
          'background-color:currentColor',
          \`mask:url("\${fileUrl('stack')}") center / contain no-repeat\`,
          style ?? '',
        ].join(';')
      : undefined,
  );
</script>

{#if icon.delivery === 'img'}
  <img
    {...rest as Record<string, unknown>}
    alt={accessibleName ?? ''}
    {height}
    src={fileUrl('stack')}
    {style}
    {width}
  />
{:else if icon.delivery === 'mask'}
  <span
    {...rest as Record<string, unknown>}
    {...a11y}
    aria-label={accessibleName}
    style={maskStyle}
  ></span>
{:else}
  <svg
    focusable="false"
    {height}
    viewBox={viewBoxSize}
    {width}
    {...a11y}
    aria-label={label}
    {style}
    {...rest}
  >
    {#if title !== undefined}<title>{title}</title>{/if}
    <use href={fileUrl('sprite')} />
  </svg>
{/if}
`;
};

const agentsSection = (
  options: InitOptions,
  componentFile: string | undefined,
  command: string,
  runsBeforeDevAndBuild: boolean,
): string => {
  const moduleDir = options.moduleDir ?? DEFAULT_MODULE_DIR;
  const outDir = options.outDir ?? 'public/icons';
  const lines = [
    AGENTS_START,
    '## Icons (svgworm)',
    '',
    `- SVG icons live in \`${options.sources.join('`, `')}\`. Do not edit the generated files.`,
    `- \`${command}\`${runsBeforeDevAndBuild ? ' (runs before `dev` and `build`)' : ''} writes the hashed sprite to \`${outDir}/\` and the manifest and types to \`${moduleDir}/\`.`,
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
  const end = existing.indexOf(AGENTS_END, start === -1 ? 0 : start);
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
      previous: existing,
    };
  }
  if (start !== -1 || end !== -1) {
    return {
      path,
      status: InitStatus.SKIPPED,
      reason: `has an unpaired ${start === -1 ? AGENTS_END : AGENTS_START} marker; fix it by hand`,
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
    previous: existing,
  };
};

const PATH_OPTIONS = [
  ['--config', (options: InitOptions) => options.configFile],
  ['--component-file', (options: InitOptions) => options.componentFile],
  ['--out-dir', (options: InitOptions) => options.outDir],
  ['--module-dir', (options: InitOptions) => options.moduleDir],
] as const;

// The path ends up unquoted in package.json scripts and in the printed commands.
const UNSAFE_IN_PATH = /[\s`'"\\$&|;<>()*?#!~]/;

const isOutsideProject = (cwd: string, value: string): boolean => {
  const inside = relative(resolve(cwd), resolve(cwd, value));
  return inside === '' || inside.startsWith('..');
};

// Files init writes must stay inside the project; a source folder may sit elsewhere, as for build.
const pathProblem = (
  cwd: string,
  value: string,
  options: { readonly mustBeInside: boolean },
): string | undefined => {
  if (UNSAFE_IN_PATH.test(value)) {
    return 'must not contain spaces, quotes, backticks, backslashes, shell characters or line breaks';
  }
  if (isAbsolute(value)) return 'must be relative to the project folder';
  if (options.mustBeInside && isOutsideProject(cwd, value)) {
    return 'must point inside the project folder';
  }
  return undefined;
};

/**
 * Problems that would make `init` write outside the project, write text that breaks the
 * generated files, or write a config the next build rejects. Empty when the options are fine.
 */
export const validateInitOptions = (
  options: InitOptions,
  cwd: string,
): readonly string[] => {
  const issues: string[] = [];
  for (const [flag, read] of PATH_OPTIONS) {
    const value = read(options);
    if (value === undefined) continue;
    const problem = pathProblem(cwd, value, { mustBeInside: true });
    if (problem !== undefined) issues.push(`${flag} "${value}" ${problem}`);
  }
  options.sources.forEach((source) => {
    const problem = pathProblem(cwd, source, { mustBeInside: false });
    if (problem !== undefined) issues.push(`--source "${source}" ${problem}`);
  });
  if (options.cdnUrl !== undefined && options.publicPath !== undefined) {
    issues.push(
      '--cdn-url replaces --public-path: the CDN url is the publicPath',
    );
  }
  if (issues.length > 0) return issues;
  try {
    resolveConfig(JSON.parse(configContent(options)), cwd);
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    issues.push(
      ...(error.issues.length > 0 ? error.issues : [error.message]).map(
        (issue) => `the config would be invalid: ${issue}`,
      ),
    );
  }
  return issues;
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

/** How to render the generated component, per framework. */
const usageSteps = (
  framework: Framework | undefined,
  componentFile: string,
  facts: ProjectFacts,
  iconExample: string,
): readonly string[] => {
  switch (framework) {
    case Framework.ASTRO:
      return [
        `In an .astro file, import Icon from the path of ${componentFile} and render ${iconExample}`,
        'If astro.config sets "base", write the sprites under it: set "publicPath": "<base>/icons" in svgworm.config.json (init never edits an existing config)',
      ];
    case Framework.VUE:
      return [
        // Nuxt names a component after its path under components/, so only the default is <Icon>.
        facts.usesNuxt &&
        /^(?:app\/)?components\/Icon\.vue$/.test(componentFile)
          ? `Nuxt auto-imports ${componentFile}: render ${iconExample} in any page or component`
          : `In a .vue file, import Icon from the path of ${componentFile} and render ${iconExample}`,
      ];
    case Framework.SVELTE:
      return [
        facts.usesSvelteKit && componentFile.startsWith('src/lib/')
          ? `In a .svelte file, import Icon from '$lib/${componentFile.slice('src/lib/'.length)}' and render ${iconExample}`
          : `In a .svelte file, import Icon from the path of ${componentFile} and render ${iconExample}`,
      ];
    case Framework.REACT:
    case undefined:
      return [
        `Import { Icon } from ${posix.join('.', componentFile.replace(/\.tsx?$/, ''))} in a ${facts.usesNext ? 'Server Component' : 'component'} and render ${iconExample}`,
      ];
  }
};

/**
 * SvelteKit serves `static/`, not `public/`, so its sprites go there unless `--out-dir` says
 * otherwise (ADR-0034). Every other framework serves the `public/icons` default.
 */
export const withFrameworkDefaults = (
  options: InitOptions,
  facts: Pick<ProjectFacts, 'usesSvelteKit'>,
  framework: Framework | undefined,
): InitOptions =>
  framework === Framework.SVELTE &&
  facts.usesSvelteKit &&
  options.outDir === undefined
    ? {
        ...options,
        outDir: 'static/icons',
        publicPath: options.publicPath ?? '/icons',
      }
    : options;

/** Pure: turns options and facts into the files to write. Nothing is touched here. */
export const planInit = (
  requested: InitOptions,
  facts: ProjectFacts,
): InitPlan => {
  const { framework, source: frameworkSource } = resolveFramework(
    requested,
    facts,
  );
  const options = withFrameworkDefaults(requested, facts, framework);
  const configPath = toPosix(options.configFile);
  const addComponent = options.addComponent ?? framework !== undefined;
  const componentFile = componentFileFor(options, facts, framework);
  const moduleDir = options.moduleDir ?? DEFAULT_MODULE_DIR;
  const command = buildCommand(options);
  const isCdn = options.cdnUrl !== undefined;

  const configAction = planFile(
    configPath,
    configContent(options),
    facts.existing[configPath],
    sameJson,
  );
  // A config that differs may name other folders, so a sample could land where no build reads it.
  // A folder outside the project (a monorepo package) is not ours to add files to.
  const firstSource = toPosix(options.sources[0] ?? DEFAULT_SOURCE);
  const samplePath =
    !facts.sourcesHaveIcons &&
    configAction.status !== InitStatus.SKIPPED &&
    !posix.normalize(firstSource).startsWith('..')
      ? posix.join(firstSource, `${SAMPLE_ICON_NAME}.svg`)
      : undefined;
  const actions: InitAction[] = [configAction];
  if (samplePath !== undefined) {
    actions.push({
      path: samplePath,
      status: InitStatus.CREATED,
      content: SAMPLE_ICON_SVG,
    });
  }
  const scripts = options.addScripts ? planScripts(facts, command) : undefined;
  if (scripts !== undefined) actions.push(scripts.action);
  const runsBeforeDevAndBuild = scripts?.runsBeforeDevAndBuild ?? false;
  if (addComponent) {
    actions.push(
      planFile(
        componentFile,
        framework === Framework.ASTRO
          ? astroComponentContent(componentFile, moduleDir)
          : framework === Framework.VUE
            ? vueComponentContent(componentFile, moduleDir)
            : framework === Framework.SVELTE
              ? svelteComponentContent(componentFile, moduleDir)
              : componentContent(componentFile, moduleDir, isCdn),
        facts.existing[componentFile],
      ),
    );
    if (isCdn && framework === Framework.ASTRO) {
      const loaderFile = posix.join(
        posix.dirname(componentFile),
        'SvgwormLoader.astro',
      );
      actions.push(
        planFile(
          loaderFile,
          astroLoaderContent(loaderFile, moduleDir),
          facts.existing[loaderFile],
        ),
      );
    }
  } else if (options.addComponent === undefined) {
    actions.push({
      path: componentFile,
      status: InitStatus.SKIPPED,
      reason:
        'no react, next, astro, vue, nuxt, svelte or @sveltejs/kit dependency found; pass --component to write it anyway',
    });
  }
  if (options.addAgentsMd) {
    actions.push(
      planAgentsMd(
        agentsSection(
          options,
          addComponent ? componentFile : undefined,
          command,
          runsBeforeDevAndBuild,
        ),
        facts.existing['AGENTS.md'],
      ),
    );
  }

  const deps = dependencyNames(facts.packageJson);
  const install = installCommand(facts.packageManager).filter((line, index) =>
    index === 0
      ? !deps.has('svgworm')
      : addComponent &&
        (framework ?? Framework.REACT) === Framework.REACT &&
        !deps.has('@svgworm/react'),
  );
  const runner =
    facts.packageManager === PackageManager.NPM ? 'npx' : facts.packageManager;
  const flag = configFlag(options);
  const outDir = options.outDir ?? 'public/icons';
  const iconExample = `<Icon name="${samplePath === undefined ? '…' : SAMPLE_ICON_NAME}" />`;
  const nextSteps = [
    ...install.map((line) => `Install: ${line}`),
    samplePath === undefined
      ? `Put SVG files in ${options.sources.join(', ')}/ and run: ${runner} svgworm${flag}`
      : runsBeforeDevAndBuild
        ? `Replace the sample ${samplePath} with your own SVG files; svgworm runs before dev and build (or run: ${runner} svgworm${flag})`
        : `Replace the sample ${samplePath} with your own SVG files and run: ${runner} svgworm${flag}`,
    ...(addComponent
      ? usageSteps(framework, componentFile, facts, iconExample)
      : []),
    ...(isCdn
      ? [
          addComponent && framework === Framework.ASTRO
            ? `Render <SvgwormLoader /> (${posix.join(posix.dirname(componentFile), 'SvgwormLoader.astro')}) once in your layout's <head>; icons on the sprite stay blank without it`
            : `Render <SpriteLoader /> from ${posix.join('.', componentFile.replace(/\.tsx?$/, ''))} once in the root layout; icons on the sprite stay blank without it`,
          `Upload ${outDir}/ to ${options.cdnUrl} after each build, without deleting old files`,
          'On the CDN, send Access-Control-Allow-Origin for your site and Cache-Control: public, max-age=31536000, immutable',
          'With a Content-Security-Policy, add the CDN origin to script-src, connect-src and img-src',
        ]
      : []),
    `Commit ${outDir}/ and ${moduleDir}/ and run in CI: ${runner} svgworm check${flag} (or add both folders to .gitignore and rely on the scripts that run svgworm)`,
  ];
  return { framework, frameworkSource, actions, nextSteps };
};
