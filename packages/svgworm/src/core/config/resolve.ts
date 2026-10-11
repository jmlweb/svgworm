import { readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { z } from 'zod';

import { ConfigError } from '../errors.ts';
import {
  configSchema,
  normalizePublicPath,
  type ColorRule,
  type ConfigInput,
} from './schema.ts';

export const DEFAULT_CONFIG_FILE = 'svgworm.config.json';
const DEFAULT_OUT_DIR = 'public/icons';
const DEFAULT_PUBLIC_PATH = '/icons';
const DEFAULT_MODULE_DIR = 'svgworm';

export type ResolvedConfig = {
  /** Absolute working directory. Every other path is relative to it. */
  readonly cwd: string;
  readonly sources: readonly string[];
  readonly outDir: string;
  /** Normalized: no trailing slash, and the empty string for the site root. */
  readonly publicPath: string;
  readonly moduleDir: string;
  readonly flatten: boolean;
  readonly color: readonly ColorRule[];
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

  if (value.outDir !== undefined && value.publicPath === undefined) {
    issues.push(
      'outDir: set together with publicPath, because svgworm cannot guess the URL of a custom output folder',
    );
  }
  const publicPath = normalizePublicPath(
    value.publicPath ?? DEFAULT_PUBLIC_PATH,
  );
  const outDir = value.outDir ?? DEFAULT_OUT_DIR;
  const moduleDir = value.moduleDir ?? DEFAULT_MODULE_DIR;

  const absoluteCwd = resolve(cwd);
  const sourcePaths = value.sources.map((source) =>
    resolve(absoluteCwd, source),
  );
  sourcePaths.forEach((a, i) => {
    sourcePaths.slice(i + 1).forEach((b, offset) => {
      if (isInside(a, b) || isInside(b, a)) {
        issues.push(
          `sources: "${value.sources[i] ?? ''}" and "${value.sources[i + 1 + offset] ?? ''}" overlap, so a file would be seen twice`,
        );
      }
    });
  });
  const outPath = resolve(absoluteCwd, outDir);
  if (sourcePaths.some((source) => isInside(source, outPath))) {
    issues.push(
      `outDir: "${outDir}" is inside a source folder, so the next build would read the sprites as icons`,
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
    sources: value.sources,
    outDir,
    publicPath: publicPath.value,
    moduleDir,
    flatten: value.flatten ?? false,
    color: value.color ?? [],
  };
};

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
    const isMissing =
      error instanceof Error && 'code' in error && error.code === 'ENOENT';
    if (isMissing && !explicit) return {};
    throw new ConfigError(
      isMissing
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

/** Loads `svgworm.config.json` (or `configFile`), lets `overrides` win, and validates (R-32). */
export const loadConfig = async (options: {
  readonly cwd: string;
  readonly configFile?: string;
  readonly overrides?: ConfigOverrides;
}): Promise<ResolvedConfig> => {
  const fromFile = await readConfigFile(options.cwd, options.configFile);
  const merged =
    typeof fromFile === 'object' &&
    fromFile !== null &&
    !Array.isArray(fromFile)
      ? { ...fromFile, ...options.overrides }
      : fromFile;
  return resolveConfig(merged, options.cwd);
};
