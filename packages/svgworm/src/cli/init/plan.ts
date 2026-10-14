import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, posix, relative, resolve } from 'node:path';

import {
  DEFAULT_CONFIG_FILE,
  resolveConfig,
} from '../../core/config/resolve.ts';
import { ConfigError } from '../../core/errors.ts';

export const Framework = { REACT: 'react', ASTRO: 'astro' } as const;
export type Framework = (typeof Framework)[keyof typeof Framework];

export const FrameworkSource = { FLAG: 'flag', DETECTED: 'detected' } as const;
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
  /** Add `predev` and `prebuild` scripts to package.json. */
  readonly addScripts: boolean;
  /** `--framework`. `undefined` means "detect it from the dependencies" (ADR-0017). */
  readonly framework: Framework | undefined;
  /** Write the icon component. `undefined` means "when a supported framework is found". */
  readonly addComponent: boolean | undefined;
  /** Where the wiring goes. `undefined` picks `icon.tsx` or `Icon.astro` under `src/components/` or `components/`. */
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
  readonly newline: '\n' | '\r\n';
  readonly hasTrailingNewline: boolean;
};

/** Facts read from the project folder before planning. */
export type ProjectFacts = {
  readonly hasPackageJson: boolean;
  /** Parsed package.json, or `undefined` when missing or not a JSON object. */
  readonly packageJson: PackageJson | undefined;
  readonly usesReact: boolean;
  readonly usesAstro: boolean;
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
  /** What the file held when it was planned, for `updated`; apply refuses to overwrite anything else. */
  readonly previous?: string;
  readonly reason?: string;
};

export type InitPlan = {
  /** The framework the component was planned for; `undefined` when none applies. */
  readonly framework: Framework | undefined;
  readonly frameworkSource: FrameworkSource | undefined;
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
  framework: undefined,
  addScripts: true,
  addComponent: undefined,
  componentFile: undefined,
  addAgentsMd: false,
});

const toPosix = (path: string): string => path.replaceAll('\\', '/');

// Only a missing file is "missing"; an unreadable one must not be treated as free to create.
const readText = async (path: string): Promise<string | undefined> => {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
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

type FrameworkFacts = Pick<ProjectFacts, 'usesReact' | 'usesAstro'>;

/** Flag first, then the dependencies. Astro wins when both are present: the choice is reported, never silent. */
export const resolveFramework = (
  options: InitOptions,
  facts: FrameworkFacts,
): {
  readonly framework: Framework | undefined;
  readonly source: FrameworkSource | undefined;
} => {
  if (options.framework !== undefined) {
    return { framework: options.framework, source: FrameworkSource.FLAG };
  }
  if (facts.usesAstro) {
    return { framework: Framework.ASTRO, source: FrameworkSource.DETECTED };
  }
  if (facts.usesReact) {
    return { framework: Framework.REACT, source: FrameworkSource.DETECTED };
  }
  return { framework: undefined, source: undefined };
};

const COMPONENT_EXTENSION = {
  [Framework.REACT]: /\.[jt]sx$/,
  [Framework.ASTRO]: /\.astro$/,
} as const;

/** `--component-file` must carry the extension of the framework `init` writes for. */
export const frameworkProblem = (
  options: InitOptions,
  facts: FrameworkFacts,
): string | undefined => {
  const { framework } = resolveFramework(options, facts);
  const file = options.componentFile;
  if (framework === undefined || file === undefined) return undefined;
  if (COMPONENT_EXTENSION[framework].test(file)) return undefined;
  return `--component-file "${file}" does not match the ${framework} component (${framework === Framework.ASTRO ? '.astro' : '.tsx or .jsx'})`;
};

export const componentFileFor = (
  options: InitOptions,
  hasSrcFolder: boolean,
  framework: Framework | undefined,
): string => {
  const name = framework === Framework.ASTRO ? 'Icon.astro' : 'icon.tsx';
  return toPosix(
    options.componentFile ??
      (hasSrcFolder ? `src/components/${name}` : `components/${name}`),
  );
};

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
  const usesReact = deps.has('react') || deps.has('next');
  const usesAstro = deps.has('astro');
  const componentFile = componentFileFor(
    options,
    hasSrcFolder,
    resolveFramework(options, { usesReact, usesAstro }).framework,
  );
  const existing: Record<string, string> = {};
  for (const path of [options.configFile, componentFile, 'AGENTS.md']) {
    const text = await readText(join(cwd, path));
    if (text !== undefined) existing[toPosix(path)] = text;
  }
  return {
    hasPackageJson: packageText !== undefined,
    packageJson,
    usesReact,
    usesAstro,
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

// `svgworm` as a command word, not as part of `svgworm-foo` or `my-svgworm-wrapper`.
const RUNS_SVGWORM = /(?:^|[\s&|;(])svgworm(?=$|[\s&|;)])/;

/** The build command the scripts and docs should run: plain, or with the custom config file. */
const buildCommand = (options: InitOptions): string =>
  options.configFile === DEFAULT_CONFIG_FILE
    ? 'svgworm'
    : `svgworm --config ${options.configFile}`;

const planScripts = (facts: ProjectFacts, command: string): InitAction => {
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
      scripts[hook] = command;
      changed = true;
    } else if (typeof current === 'string' && !RUNS_SVGWORM.test(current)) {
      // Keep what is there, run svgworm first so the output exists before the app starts.
      scripts[hook] = `${command} && ${current}`;
      changed = true;
    }
  }
  if (!changed) return { path, status: InitStatus.UNCHANGED };
  const next = { ...pkg.value, scripts };
  // Like npm itself: re-serialized with the file's own indent and line endings.
  const text =
    JSON.stringify(next, null, pkg.indent).replaceAll('\n', pkg.newline) +
    (pkg.hasTrailingNewline ? pkg.newline : '');
  return {
    path,
    status: InitStatus.UPDATED,
    content: text,
    previous: pkg.text,
  };
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

const astroComponentContent = (
  componentFile: string,
  moduleDir: string,
): string => {
  const target = toPosix(
    relative(dirname(componentFile), join(moduleDir, 'icons.js')),
  );
  const specifier = target.startsWith('.') ? target : `./${target}`;
  return `---
// Generated by \`svgworm init\`. Renders the same markup as \`createIcon\` from @svgworm/react,
// with no client JavaScript. Keep the delivery logic in step with that adapter.
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
if (version !== 1) {
  throw new Error(
    \`Unsupported svgworm manifest version \${String(version)}; this component reads version 1. Update svgworm and run it again.\`,
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

// An own property only: a runtime name such as "constructor" must not find Object.prototype.
const icon = Object.hasOwn(icons, name) ? icons[name] : undefined;
if (!icon) {
  throw new Error(\`Unknown icon "\${name}". It is not in the svgworm manifest.\`);
}

const fileUrl = (kind: 'sprite' | 'stack'): string => {
  const file = sprites[icon.sprite]?.[kind];
  if (!file) {
    throw new Error(
      \`Icon "\${name}" needs the \${kind} file of "\${icon.sprite}", but the manifest has none. Run svgworm again.\`,
    );
  }
  return \`\${file.url}#\${icon.id}\`;
};

const accessibleName = title ?? label;
const a11y =
  accessibleName === undefined
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img' } as const);
// A bare number is pixels, as in React's style prop.
const length = (value: string | number | null): string =>
  typeof value === 'number' ? \`\${value}px\` : (value ?? '');
const userStyle = typeof style === 'string' ? style : '';
const maskStyle =
  icon.delivery === 'mask'
    ? \`display:inline-block;width:\${length(width)};height:\${length(height)};background-color:currentColor;mask:url("\${fileUrl('stack')}") center / contain no-repeat;\${userStyle}\`
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
      viewBox={icon.viewBox}
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

const agentsSection = (
  options: InitOptions,
  componentFile: string | undefined,
  command: string,
): string => {
  const moduleDir = options.moduleDir ?? DEFAULT_MODULE_DIR;
  const outDir = options.outDir ?? 'public/icons';
  const lines = [
    AGENTS_START,
    '## Icons (svgworm)',
    '',
    `- SVG icons live in \`${options.sources.join('`, `')}\`. Do not edit the generated files.`,
    `- \`${command}\` (runs before \`dev\` and \`build\`) writes the hashed sprite to \`${outDir}/\` and the manifest and types to \`${moduleDir}/\`.`,
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

const pathProblem = (cwd: string, value: string): string | undefined => {
  if (/[\n\r`'"\\]/.test(value)) {
    return 'must not contain quotes, backticks, backslashes or line breaks';
  }
  if (isAbsolute(value)) return 'must be relative to the project folder';
  const inside = relative(resolve(cwd), resolve(cwd, value));
  if (inside === '' || inside.startsWith('..')) {
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
    const problem = pathProblem(cwd, value);
    if (problem !== undefined) issues.push(`${flag} "${value}" ${problem}`);
  }
  options.sources.forEach((source) => {
    const problem = pathProblem(cwd, source);
    if (problem !== undefined) issues.push(`--source "${source}" ${problem}`);
  });
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

/** Pure: turns options and facts into the files to write. Nothing is touched here. */
export const planInit = (
  options: InitOptions,
  facts: ProjectFacts,
): InitPlan => {
  const configPath = toPosix(options.configFile);
  const { framework, source: frameworkSource } = resolveFramework(
    options,
    facts,
  );
  const addComponent = options.addComponent ?? framework !== undefined;
  const componentFile = componentFileFor(
    options,
    facts.hasSrcFolder,
    framework,
  );
  const moduleDir = options.moduleDir ?? DEFAULT_MODULE_DIR;
  const command = buildCommand(options);

  const actions: InitAction[] = [
    planFile(
      configPath,
      configContent(options),
      facts.existing[configPath],
      sameJson,
    ),
  ];
  if (options.addScripts) actions.push(planScripts(facts, command));
  if (addComponent) {
    actions.push(
      planFile(
        componentFile,
        framework === Framework.ASTRO
          ? astroComponentContent(componentFile, moduleDir)
          : componentContent(componentFile, moduleDir),
        facts.existing[componentFile],
      ),
    );
  } else if (options.addComponent === undefined) {
    actions.push({
      path: componentFile,
      status: InitStatus.SKIPPED,
      reason:
        'no react, next or astro dependency found; pass --component to write it anyway',
    });
  }
  if (options.addAgentsMd) {
    actions.push(
      planAgentsMd(
        agentsSection(
          options,
          addComponent ? componentFile : undefined,
          command,
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
        framework !== Framework.ASTRO &&
        !deps.has('@svgworm/react'),
  );
  const runner =
    facts.packageManager === PackageManager.NPM ? 'npx' : facts.packageManager;
  const configFlag =
    options.configFile === DEFAULT_CONFIG_FILE
      ? ''
      : ` --config ${options.configFile}`;
  const nextSteps = [
    ...install.map((line) => `Install: ${line}`),
    `Put SVG files in ${options.sources.join(', ')}/ and run: ${runner} svgworm${configFlag}`,
    ...(addComponent && framework === Framework.ASTRO
      ? [
          `In an .astro file, import Icon from the path of ${componentFile} and render <Icon name="…" />`,
          'If astro.config sets "base", write the sprites under it: run init with --public-path <base>/icons (or set publicPath in the config)',
        ]
      : addComponent
        ? [
            `Import { Icon } from ${posix.join('.', componentFile.replace(/\.tsx?$/, ''))} in a Server Component and render <Icon name="…" />`,
          ]
        : []),
    `In CI, run: ${runner} svgworm check${configFlag}`,
  ];
  return { framework, frameworkSource, actions, nextSteps };
};
