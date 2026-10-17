import type * as TypeScript from 'typescript';

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

import type { TypeScriptApi } from './typescript.ts';

import { compileFromDisk, type ResolvedConfig } from '../../core/api.ts';
import { comparePaths } from '../../core/collisions.ts';
import { discoverSvgFiles } from '../../core/discover.ts';
import { toPosix } from '../../core/fs.ts';
import { deriveName } from '../../core/naming.ts';
import { type IconLookup, type SvgrSource } from './svgr.ts';

const CODE_FILE = /\.(?:[cm]?[jt]sx?)$/;
const DECLARATION_FILE = /\.d\.[cm]?ts$/;
const ROOT_OUTPUT_DIRS: ReadonlySet<string> = new Set([
  'dist',
  'build',
  'out',
  'coverage',
]);
const SVG_IMPORT_HINT = /\.svg\b/i;
// SMIL or CSS animation inside the file: SVGR keeps it in the page, a sprite icon may not.
const ANIMATION =
  /<(?:animate|animateMotion|animateTransform|set)\b|@keyframes/;

/** Icon files the codemod looks for when --component-file is not given, as `init` writes them. */
export const DEFAULT_COMPONENT_FILES = [
  'src/components/icon.tsx',
  'components/icon.tsx',
] as const;

const isInside = (parent: string, child: string): boolean => {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
};

/**
 * Code files under `cwd` that mention `.svg`, sorted. Skips dot folders and `node_modules`
 * anywhere, and build output folders only at the root, where tools write them.
 */
export const findCodeFiles = async (
  cwd: string,
  skip: readonly string[],
): Promise<readonly { readonly path: string; readonly content: string }[]> => {
  const skipped = skip.map((dir) => resolve(cwd, dir));
  const found: { path: string; content: string }[] = [];
  const walk = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        if (directory === cwd && ROOT_OUTPUT_DIRS.has(entry.name)) continue;
        if (skipped.some((dir) => isInside(dir, absolute))) continue;
        await walk(absolute);
      } else if (
        entry.isFile() &&
        CODE_FILE.test(entry.name) &&
        !DECLARATION_FILE.test(entry.name)
      ) {
        const content = await readFile(absolute, 'utf8');
        if (SVG_IMPORT_HINT.test(content)) {
          found.push({ path: toPosix(relative(cwd, absolute)), content });
        }
      }
    }
  };
  await walk(cwd);
  return found.toSorted((a, b) => comparePaths(a.path, b.path));
};

/**
 * The icon each source file becomes, keyed by absolute path, or why it cannot be one. Names
 * come from the core's naming rules, so they match what `build` writes.
 */
export const indexIcons = async (
  config: ResolvedConfig,
): Promise<ReadonlyMap<string, IconLookup>> => {
  const discovery = await discoverSvgFiles(config.cwd, config.sources);
  const compiled = await compileFromDisk(config);
  const errors = new Map(
    (compiled.ok ? [] : compiled.errors).map((error) => [
      error.file,
      error.message,
    ]),
  );
  const named = discovery.files.map((file) => ({
    file,
    result: deriveName(file.relativePath, { flatten: config.flatten }),
  }));
  const counts = named.reduce((map, { result }) => {
    if (result.ok) map.set(result.name, (map.get(result.name) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const entries = await Promise.all(
    named.map(async ({ file, result }): Promise<[string, IconLookup]> => {
      const skip = (reason: string): [string, IconLookup] => [
        resolve(file.absolutePath),
        { kind: 'skip', reason },
      ];
      if (!result.ok) {
        return skip(`is not a valid icon: ${result.error.message}`);
      }
      const error = errors.get(file.path);
      if (error !== undefined) return skip(`is not a valid icon: ${error}`);
      if ((counts.get(result.name) ?? 0) > 1) {
        return skip(`shares the icon name "${result.name}" with another file`);
      }
      const content = await readFile(file.absolutePath, 'utf8');
      if (ANIMATION.test(content)) {
        return skip(
          'is animated; keep SVGR for it, because a <use> sprite icon cannot animate or style its inner paths',
        );
      }
      return [resolve(file.absolutePath), { kind: 'icon', name: result.name }];
    }),
  );
  return new Map(entries);
};

type PathAliases = {
  readonly base: string;
  readonly paths: Readonly<Record<string, readonly string[]>>;
};

/** `compilerOptions.paths` from the project's tsconfig.json or jsconfig.json, `extends` included. */
const readPathAliases = (
  ts: TypeScriptApi,
  cwd: string,
): PathAliases | undefined => {
  const file = ['tsconfig.json', 'jsconfig.json']
    .map((name) => join(cwd, name))
    .find((path) => existsSync(path));
  if (file === undefined) return undefined;
  const parsed = ts.getParsedCommandLineOfConfigFile(
    file,
    {},
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined },
  );
  const options: TypeScript.CompilerOptions | undefined = parsed?.options;
  if (options?.paths === undefined) return undefined;
  // baseUrl is deprecated in TypeScript 6 but still common in TypeScript 5 projects.
  const baseUrl: unknown = Reflect.get(options, 'baseUrl');
  const pathsBase: unknown = options['pathsBasePath'];
  return {
    base:
      typeof baseUrl === 'string'
        ? baseUrl
        : typeof pathsBase === 'string'
          ? pathsBase
          : dirname(file),
    paths: options.paths,
  };
};

const matchAlias = (
  aliases: PathAliases,
  specifier: string,
): readonly string[] => {
  const matches = Object.entries(aliases.paths).flatMap(
    ([pattern, targets]) => {
      const star = pattern.indexOf('*');
      if (star === -1)
        return pattern === specifier
          ? [{ prefix: pattern, targets, rest: '' }]
          : [];
      const prefix = pattern.slice(0, star);
      const suffix = pattern.slice(star + 1);
      return specifier.startsWith(prefix) &&
        specifier.endsWith(suffix) &&
        specifier.length >= prefix.length + suffix.length
        ? [
            {
              prefix,
              targets,
              rest: specifier.slice(
                prefix.length,
                specifier.length - suffix.length,
              ),
            },
          ]
        : [];
    },
  );
  // TypeScript picks the pattern with the longest prefix.
  const [best] = matches.toSorted((a, b) => b.prefix.length - a.prefix.length);
  return (best?.targets ?? []).map((target) =>
    resolve(aliases.base, target.replace('*', best?.rest ?? '')),
  );
};

/** Resolves an `.svg` import the way the bundler would: relative, tsconfig paths, then packages. */
const CODE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.mts', '.mjs'];

/** Where a relative or aliased specifier points, before any extension is added. */
const specifierTargets = (
  aliases: PathAliases | undefined,
  specifier: string,
  fromAbsolutePath: string,
): readonly string[] => {
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return [resolve(dirname(fromAbsolutePath), specifier)];
  }
  return aliases === undefined ? [] : matchAlias(aliases, specifier);
};

/**
 * Whether a specifier imports `componentFile`, the way a bundler resolves it: with or without
 * the extension, as a folder index, or through a tsconfig `paths` alias.
 */
export const createIconImportMatcher = (
  ts: TypeScriptApi,
  cwd: string,
  componentFile: string,
): ((specifier: string, fromAbsolutePath: string) => boolean) => {
  const aliases = readPathAliases(ts, cwd);
  const target = resolve(cwd, componentFile);
  return (specifier, fromAbsolutePath) =>
    specifierTargets(aliases, specifier, fromAbsolutePath).some((base) => {
      // TypeScript lets `./icon.js` name `icon.tsx`.
      const stem = base.replace(/\.[cm]?[jt]sx?$/, '');
      return [base, stem].some(
        (path) =>
          path === target ||
          CODE_EXTENSIONS.some(
            (extension) =>
              `${path}${extension}` === target ||
              join(path, `index${extension}`) === target,
          ),
      );
    });
};

export const createSvgResolver = (
  ts: TypeScriptApi,
  cwd: string,
): ((specifier: string, fromAbsolutePath: string) => string | undefined) => {
  const aliases = readPathAliases(ts, cwd);
  return (specifier, fromAbsolutePath) => {
    const path = specifier.replace(/[?#].*$/, '');
    if (path.startsWith('./') || path.startsWith('../')) {
      return resolve(dirname(fromAbsolutePath), path);
    }
    if (path.startsWith('/')) return undefined;
    const aliased = specifierTargets(aliases, path, fromAbsolutePath).find(
      (candidate) => existsSync(candidate),
    );
    if (aliased !== undefined) return aliased;
    try {
      return createRequire(fromAbsolutePath).resolve(path);
    } catch {
      return undefined;
    }
  };
};

export const createLookup =
  (
    icons: ReadonlyMap<string, IconLookup>,
    resolveSvg: ReturnType<typeof createSvgResolver>,
    sources: readonly string[],
  ) =>
  (specifier: string, fromAbsolutePath: string): IconLookup => {
    const target = resolveSvg(specifier, fromAbsolutePath);
    if (target === undefined) {
      return { kind: 'skip', reason: `cannot resolve "${specifier}"` };
    }
    return (
      icons.get(resolve(target)) ?? {
        kind: 'skip',
        reason: `is outside the configured sources (${sources.join(', ')}); add its folder to "sources"`,
      }
    );
  };

/** The specifier that imports `componentFile` from `file`, without the extension. */
export const iconImportFor = (file: string, componentFile: string): string => {
  const target = toPosix(
    relative(dirname(file), componentFile).replace(/\.[cm]?[jt]sx?$/, ''),
  );
  return target.startsWith('.') ? target : `./${target}`;
};

export const toSources = (
  files: readonly { readonly path: string; readonly content: string }[],
  cwd: string,
  componentFile: string,
): readonly SvgrSource[] =>
  files.map((file) => ({
    path: file.path,
    absolutePath: resolve(cwd, file.path),
    content: file.content,
    iconImport: iconImportFor(file.path, componentFile),
  }));
