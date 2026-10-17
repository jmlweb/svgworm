import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

import type { TypeScriptApi } from './typescript.ts';

import { type ResolvedConfig } from '../../core/api.ts';
import { toPosix } from '../../core/fs.ts';
import {
  createIconImportMatcher,
  createLookup,
  createSvgResolver,
  DEFAULT_COMPONENT_FILES,
  findCodeFiles,
  indexIcons,
  toSources,
} from './project.ts';
import {
  migrateSvgr,
  type MigrationChange,
  type MigrationSkip,
} from './svgr.ts';

export type MigrationReport = {
  /** `--write`: the files were changed. Otherwise a dry run that changed nothing. */
  readonly isWrite: boolean;
  readonly componentFile: string;
  readonly files: readonly {
    readonly file: string;
    readonly changes: readonly MigrationChange[];
  }[];
  /** Imports left on SVGR, with why. */
  readonly skipped: readonly MigrationSkip[];
};

export type MigrationOptions = {
  readonly isWrite: boolean;
  readonly componentFile: string | undefined;
};

export class MissingComponentError extends Error {
  override readonly name = 'MissingComponentError';
}

const findComponentFile = (
  cwd: string,
  componentFile: string | undefined,
): string => {
  const candidates =
    componentFile === undefined ? DEFAULT_COMPONENT_FILES : [componentFile];
  // An absolute --component-file works too; the rest of the run uses paths from cwd.
  const found = candidates
    .map((file) => toPosix(relative(cwd, resolve(cwd, file))))
    .find((file) => existsSync(join(cwd, file)));
  if (found === undefined) {
    throw new MissingComponentError(
      componentFile === undefined
        ? `no Icon component at ${DEFAULT_COMPONENT_FILES.join(' or ')}\n  run svgworm init first, or pass --component-file <path>`
        : `--component-file "${componentFile}" does not exist`,
    );
  }
  return found;
};

/** Plans the SVGR migration of the project and, with `isWrite`, applies it. */
export const runSvgrMigration = async (
  config: ResolvedConfig,
  options: MigrationOptions,
  ts: TypeScriptApi,
): Promise<MigrationReport> => {
  const componentFile = findComponentFile(config.cwd, options.componentFile);
  const sourceDirs = config.sources.map((source) => source.dir);
  const [icons, files] = await Promise.all([
    indexIcons(config),
    findCodeFiles(config.cwd, [config.outDir, config.moduleDir]),
  ]);
  const results = migrateSvgr({
    ts,
    files: toSources(files, config.cwd, componentFile),
    isIconImport: createIconImportMatcher(ts, config.cwd, componentFile),
    lookup: createLookup(icons, createSvgResolver(ts, config.cwd), sourceDirs),
  });
  if (options.isWrite) {
    for (const result of results) {
      if (result.output !== undefined) {
        // In place, so the file keeps its mode and a symlinked file stays linked.
        await writeFile(join(config.cwd, result.file), result.output);
      }
    }
  }
  return {
    isWrite: options.isWrite,
    componentFile,
    files: results.flatMap(({ file, changes }) =>
      changes.length === 0 ? [] : [{ file, changes }],
    ),
    skipped: results.flatMap(({ skipped }) => skipped),
  };
};
