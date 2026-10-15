import { readFile } from 'node:fs/promises';

import type { ResolvedConfig } from './config/resolve.ts';
import type { BuildEventHandler } from './events.ts';
import type { TransformCache } from './svg/cache.ts';

import { compareDiagnostics } from './collisions.ts';
import {
  compile,
  type CompileResult,
  type CompileSuccess,
  type SourceInput,
} from './compile.ts';
import { discoverSvgFiles, type DiscoveredFile } from './discover.ts';
import { DiagnosticCode, type Diagnostic } from './errors.ts';
import { writeOutput } from './write.ts';

export type BuildSuccess = CompileSuccess & {
  readonly written: readonly string[];
  readonly removed: readonly string[];
};

export type BuildResult =
  | BuildSuccess
  | Extract<CompileResult, { readonly ok: false }>;

export type BuildOptions = {
  /** Per-icon transform cache shared across builds of one process (`watch`, ADR-0015). */
  readonly cache?: TransformCache;
};

const READ_BATCH_SIZE = 64;

type ReadOutcome =
  | { readonly source: SourceInput }
  | { readonly error: Diagnostic };

const readOne = async (file: DiscoveredFile): Promise<ReadOutcome> => {
  try {
    return {
      source: {
        path: file.path,
        relativePath: file.relativePath,
        content: await readFile(file.absolutePath),
      },
    };
  } catch (error) {
    return {
      error: {
        code: DiagnosticCode.UNREADABLE_FILE,
        file: file.path,
        message: `cannot read file: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
};

// Batches keep the number of open file handles bounded on large icon sets.
const readAll = async (
  files: readonly DiscoveredFile[],
): Promise<readonly ReadOutcome[]> => {
  const outcomes: ReadOutcome[] = [];
  for (let start = 0; start < files.length; start += READ_BATCH_SIZE) {
    outcomes.push(
      ...(await Promise.all(
        files.slice(start, start + READ_BATCH_SIZE).map(readOne),
      )),
    );
  }
  return outcomes;
};

const sortErrors = (errors: readonly Diagnostic[]): readonly Diagnostic[] =>
  errors.toSorted(compareDiagnostics);

/** Discovers and compiles, without writing. Shared by `build` and `check`. */
export const compileFromDisk = async (
  config: ResolvedConfig,
  onEvent: BuildEventHandler = () => undefined,
  options: BuildOptions = {},
): Promise<CompileResult> => {
  const discovery = await discoverSvgFiles(config.cwd, config.sources);
  const outcomes = await readAll(discovery.files);
  const sources = outcomes.flatMap((outcome) =>
    'source' in outcome ? [outcome.source] : [],
  );
  const earlyErrors = [
    ...discovery.errors,
    ...outcomes.flatMap((outcome) =>
      'error' in outcome ? [outcome.error] : [],
    ),
  ];

  const compiled = compile(
    sources,
    {
      flatten: config.flatten,
      publicPath: config.publicPath,
      color: config.color,
      ...(options.cache === undefined ? {} : { cache: options.cache }),
    },
    onEvent,
  );

  if (compiled.ok && earlyErrors.length === 0) return compiled;
  const compileErrors = compiled.ok ? [] : compiled.errors;
  // "No icons" would only repeat what the earlier errors already explain.
  const errors = [...earlyErrors, ...compileErrors].filter(
    (error) =>
      error.code !== DiagnosticCode.NO_ICONS || earlyErrors.length === 0,
  );
  return {
    ok: false,
    errors: sortErrors(errors),
    warnings: compiled.warnings,
  };
};

/**
 * Discovers, compiles and writes. Nothing is written unless the whole input is valid
 * (R-04). Expected problems come back as `errors`; an unexpected I/O failure throws.
 */
export const build = async (
  config: ResolvedConfig,
  onEvent: BuildEventHandler = () => undefined,
  options: BuildOptions = {},
): Promise<BuildResult> => {
  const compiled = await compileFromDisk(config, onEvent, options);
  if (!compiled.ok) return compiled;

  const { written, removed } = await writeOutput(
    compiled.files,
    { cwd: config.cwd, outDir: config.outDir, moduleDir: config.moduleDir },
    onEvent,
  );
  onEvent({ type: 'done', stats: compiled.stats });
  return { ...compiled, written, removed };
};
