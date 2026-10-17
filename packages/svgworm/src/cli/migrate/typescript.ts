import type * as TypeScript from 'typescript';

import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export type TypeScriptApi = typeof TypeScript;

export const MISSING_TYPESCRIPT_HINT =
  'migrate svgr parses your code with the TypeScript compiler API (TypeScript 5 or 6), and none was found; TypeScript 7 has no JS compiler API yet.\n  run it with one: npx -p typescript@6 -p svgworm svgworm migrate svgr';

// TypeScript 7 ships no JS compiler API in its main entry, only `unstable/*` IPC APIs, so
// this check is what limits the codemod to TypeScript 5 and 6.
const isApi = (value: unknown): value is TypeScriptApi =>
  typeof value === 'object' &&
  value !== null &&
  'createSourceFile' in value &&
  typeof value.createSourceFile === 'function';

const loadFrom = async (base: string): Promise<TypeScriptApi | undefined> => {
  try {
    const path = createRequire(base).resolve('typescript');
    const loaded: unknown = await import(pathToFileURL(path).href);
    const api =
      typeof loaded === 'object' && loaded !== null && 'default' in loaded
        ? loaded.default
        : loaded;
    return isApi(api) ? api : undefined;
  } catch {
    return undefined;
  }
};

/**
 * The project's own TypeScript first, then one installed next to svgworm (`npx -p`). It is an
 * optional peer, never a dependency (ADR-0035).
 */
export const loadTypeScript = async (
  cwd: string,
): Promise<TypeScriptApi | undefined> =>
  (await loadFrom(join(cwd, 'package.json'))) ??
  (await loadFrom(import.meta.url));
