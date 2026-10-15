import { readFile, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, posix, relative, resolve } from 'node:path';
import { z } from 'zod';

import { ConfigError } from '../errors.ts';
import { isMissing } from '../fs.ts';
import {
  configSchema,
  CrossOrigin,
  normalizePublicPath,
  toSourceSpec,
  type ColorRule,
  type ConfigInput,
  type SourceSpec,
} from './schema.ts';

export const DEFAULT_CONFIG_FILE = 'svgworm.config.json';
const DEFAULT_OUT_DIR = 'public/icons';
const DEFAULT_PUBLIC_PATH = '/icons';
/** The one folder tried when `sources` is not set. Fixed, so svgworm never picks between candidates (ADR-0029). */
export const DEFAULT_SOURCE = 'icons';
const PUBLIC_DIR = 'public';
const DEFAULT_MODULE_DIR = 'svgworm';

export type ResolvedConfig = {
  /** Absolute working directory. Every other path is relative to it. */
  readonly cwd: string;
  /** Normalized: a string entry becomes `{ dir }`. */
  readonly sources: readonly SourceSpec[];
  readonly outDir: string;
  /** Normalized: no trailing slash, and the empty string for the site root. */
  readonly publicPath: string;
  readonly moduleDir: string;
  readonly flatten: boolean;
  readonly color: readonly ColorRule[];
  readonly crossOrigin: CrossOrigin;
  /** True when `sources` was not set and {@link DEFAULT_SOURCE} stands in for it. */
  readonly isDefaultSources: boolean;
};

export type ConfigOverrides = Partial<ConfigInput>;

const isInside = (parent: string, child: string): boolean => {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
};

const formatIssues = (error: z.ZodError): readonly string[] =>
  error.issues.map((issue) => {
    const path = issue.path.map(String).join('.');
    return path === '' ? issue.message : `${path}: ${issue.message}`;
  });

/**
 * The URL path of an `outDir` under `public/`, which Next.js, Vite and Astro serve at the
 * site root (ADR-0029). `undefined` for anything else: absolute paths, paths that leave
 * the project, and folders outside `public/`. It compares whole segments, so
 * `publicity/x` does not match.
 */
const derivePublicPath = (outDir: string): string | undefined => {
  const normalized = posix.normalize(outDir.replaceAll('\\', '/'));
  if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) {
    return undefined;
  }
  const [first, ...rest] = normalized.split('/').filter((part) => part !== '');
  if (first !== PUBLIC_DIR || rest.includes('..')) return undefined;
  return rest.length === 0 ? '/' : `/${rest.join('/')}`;
};

/** Validates a config object and applies defaults. Throws {@link ConfigError}. */
export const resolveConfig = (input: unknown, cwd: string): ResolvedConfig => {
  const parsed = configSchema.safeParse(input);
  if (!parsed.success) {
    throw new ConfigError(
      `Invalid configuration\n${z.prettifyError(parsed.error)}`,
      formatIssues(parsed.error),
    );
  }
  const value = parsed.data;
  const issues: string[] = [];

  const derivedPublicPath =
    value.outDir === undefined ? undefined : derivePublicPath(value.outDir);
  if (
    value.outDir !== undefined &&
    value.publicPath === undefined &&
    derivedPublicPath === undefined
  ) {
    issues.push(
      'outDir: set together with publicPath, because svgworm can only derive the URL of an outDir under public/ (public/sprites gives /sprites)',
    );
  }
  const crossOrigin = value.crossOrigin ?? CrossOrigin.NONE;
  const publicPath = normalizePublicPath(
    value.publicPath ?? derivedPublicPath ?? DEFAULT_PUBLIC_PATH,
    { crossOrigin },
  );
  const outDir = value.outDir ?? DEFAULT_OUT_DIR;
  const moduleDir = value.moduleDir ?? DEFAULT_MODULE_DIR;

  const absoluteCwd = resolve(cwd);
  const isDefaultSources = value.sources === undefined;
  const sources = [value.sources ?? DEFAULT_SOURCE].flat().map(toSourceSpec);
  const sourcePaths = sources.map((source) => resolve(absoluteCwd, source.dir));
  sourcePaths.forEach((a, i) => {
    sourcePaths.slice(i + 1).forEach((b, offset) => {
      if (isInside(a, b) || isInside(b, a)) {
        issues.push(
          `sources: "${sources[i]?.dir ?? ''}" and "${sources[i + 1 + offset]?.dir ?? ''}" overlap, so a file would be seen twice`,
        );
      }
    });
  });
  const outPath = resolve(absoluteCwd, outDir);
  if (sourcePaths.some((source) => isInside(source, outPath))) {
    issues.push(
      `outDir: "${outDir}" is inside a source folder, so the next build would read the sprites as icons. Move the icons out of that folder (for example to icons/), or write the sprites elsewhere with --out-dir or "outDir"`,
    );
  }
  if (isInside(outPath, resolve(absoluteCwd, moduleDir))) {
    issues.push(
      `moduleDir: "${moduleDir}" is inside outDir "${outDir}", which is served to browsers`,
    );
  }

  if (issues.length > 0 || !publicPath.ok) {
    const all = publicPath.ok
      ? issues
      : [...issues, `publicPath: ${publicPath.message}`];
    throw new ConfigError(
      `Invalid configuration\n${all.map((issue) => `  - ${issue}`).join('\n')}`,
      all,
    );
  }

  return {
    cwd: absoluteCwd,
    sources,
    outDir,
    publicPath: publicPath.value,
    moduleDir,
    flatten: value.flatten ?? false,
    color: value.color ?? [],
    crossOrigin,
    isDefaultSources,
  };
};

/** The nearest folder above `cwd` that holds a default config file, if any. */
const findConfigAbove = async (cwd: string): Promise<string | undefined> => {
  let dir = dirname(cwd);
  for (;;) {
    const found = await stat(join(dir, DEFAULT_CONFIG_FILE)).then(
      (info) => info.isFile(),
      () => false,
    );
    if (found) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
};

/**
 * The first error most users see, so it says what to do instead of showing a validation
 * issue. `hasConfigFile` is true when a config file exists but sets no `sources`.
 */
const describeMissingSources = async (
  cwd: string,
  hasConfigFile: boolean,
): Promise<string> => {
  const above = await findConfigAbove(cwd);
  const where = hasConfigFile
    ? `${DEFAULT_CONFIG_FILE} in ${cwd} sets no sources and there is no default ${DEFAULT_SOURCE}/ folder`
    : `no ${DEFAULT_CONFIG_FILE} found in ${cwd} and no default ${DEFAULT_SOURCE}/ folder`;
  if (hasConfigFile) {
    return `${where}
  set "sources" in the config, or pass --source <dir>`;
  }
  return above === undefined
    ? `${where}
  run "svgworm init" to create one, or pass --source <dir>`
    : `${where}; found one in ${above}
  run svgworm from there, or pass --source <dir>`;
};

const isDirectory = (path: string): Promise<boolean> =>
  stat(path).then(
    (info) => info.isDirectory(),
    () => false,
  );

/** Returns `undefined` when the default config file does not exist. */
const readConfigFile = async (
  cwd: string,
  configFile: string | undefined,
): Promise<unknown> => {
  const explicit = configFile !== undefined;
  const path = join(cwd, configFile ?? DEFAULT_CONFIG_FILE);
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    const missing = isMissing(error);
    if (missing && !explicit) return undefined;
    throw new ConfigError(
      missing
        ? `Config file not found: ${configFile ?? ''}`
        : `Cannot read config file ${configFile ?? DEFAULT_CONFIG_FILE}`,
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ConfigError(
      `${configFile ?? DEFAULT_CONFIG_FILE} is not valid JSON`,
    );
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Loads `svgworm.config.json` (or `configFile`), lets `overrides` win, and validates (R-32). */
export const loadConfig = async (options: {
  readonly cwd: string;
  readonly configFile?: string;
  readonly overrides?: ConfigOverrides;
}): Promise<ResolvedConfig> => {
  const fromFile = await readConfigFile(options.cwd, options.configFile);
  const isFileObject = isRecord(fromFile);
  const merged = isFileObject
    ? { ...fromFile, ...options.overrides }
    : (fromFile ?? { ...options.overrides });
  const hasSources =
    options.overrides?.sources !== undefined ||
    (isFileObject && fromFile['sources'] !== undefined);
  const cwd = resolve(options.cwd);
  if (!hasSources && !(await isDirectory(join(cwd, DEFAULT_SOURCE)))) {
    throw new ConfigError(
      await describeMissingSources(cwd, fromFile !== undefined),
    );
  }
  return resolveConfig(merged, options.cwd);
};
