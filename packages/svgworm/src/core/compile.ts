import type { BuildEventHandler, BuildStats } from './events.ts';
import type { TransformCache } from './svg/cache.ts';

import { contentHash, spriteFileName, stackFileName } from './assemble/hash.ts';
import {
  assembleSprite,
  assembleStack,
  type SymbolMarkup,
} from './assemble/sprite.ts';
import { comparePaths, findCollisions, toDisplayPath } from './collisions.ts';
import { compareCodePoints } from './compare-code-units.ts';
import { ColorMode, type ColorRule } from './config/schema.ts';
import {
  toFileReference,
  type ManifestIcon,
  type ManifestInput,
} from './emit/manifest.ts';
import { emitManifestJson, emitModule, emitTypes } from './emit/module.ts';
import { DiagnosticCode, type Diagnostic } from './errors.ts';
import { deriveName, toSymbolId } from './naming.ts';
import { ColorKind } from './svg/color/classify.ts';
import { resolveColorMode } from './svg/color/overrides.ts';
import { Delivery } from './svg/references.ts';
import {
  transformIcon,
  type IconMarkup,
  type TransformInput,
} from './svg/transform.ts';

export type SourceInput = {
  /** Path used in messages and as a sort key. */
  readonly path: string;
  /** Path relative to its source folder. Input of the naming rules. */
  readonly relativePath: string;
  readonly content: Uint8Array;
};

export type CompileOptions = {
  readonly flatten: boolean;
  /** Normalized: no trailing slash, "" for the site root. */
  readonly publicPath: string;
  readonly color: readonly Pick<ColorRule, 'match' | 'color'>[];
  /** Reuses per-icon transforms across compiles of one process (`watch`, ADR-0015). */
  readonly cache?: TransformCache;
};

/** A generated file. `target` says which configured folder it belongs in. */
export type OutputFile = {
  readonly target: 'outDir' | 'moduleDir';
  readonly name: string;
  readonly content: string;
};

export type IconSummary = ManifestIcon & { readonly file: string };

export type CompileSuccess = {
  readonly ok: true;
  readonly files: readonly OutputFile[];
  readonly manifest: ManifestInput;
  readonly icons: readonly IconSummary[];
  readonly warnings: readonly Diagnostic[];
  readonly stats: BuildStats;
};

export type CompileResult =
  | CompileSuccess
  | {
      readonly ok: false;
      readonly errors: readonly Diagnostic[];
      readonly warnings: readonly Diagnostic[];
    };

const byteLength = (text: string): number =>
  new TextEncoder().encode(text).byteLength;

const sortDiagnostics = (items: readonly Diagnostic[]): readonly Diagnostic[] =>
  items.toSorted(
    (a, b) =>
      comparePaths(a.file, b.file) ||
      compareCodePoints(a.code, b.code) ||
      compareCodePoints(a.message, b.message),
  );

type Processed = {
  readonly source: SourceInput;
  readonly file: string;
  readonly name: string;
  readonly id: string;
  readonly icon: IconMarkup;
};

const toSymbol = (item: Processed): SymbolMarkup => ({
  id: item.id,
  viewBox: item.icon.viewBox,
  attributes: item.icon.attributes,
  inner: item.icon.inner,
});

const countBy = (items: readonly Processed[], delivery: Delivery): number =>
  items.filter((item) => item.icon.delivery === delivery).length;

/**
 * The pure pipeline: bytes in, files out, no file system and no output (R-33). It collects
 * every problem before giving up, so one run reports them all (R-04).
 */
export const compile = (
  sources: readonly SourceInput[],
  options: CompileOptions,
  onEvent: BuildEventHandler = () => undefined,
): CompileResult => {
  const startedAt = performance.now();
  const ordered = sources
    .map((source) => ({ source, file: toDisplayPath(source.path) }))
    .toSorted((a, b) => comparePaths(a.file, b.file));

  if (ordered.length === 0) {
    return {
      ok: false,
      errors: [
        {
          code: DiagnosticCode.NO_ICONS,
          file: '',
          message: 'no .svg files found in the source folders',
        },
      ],
      warnings: [],
    };
  }
  onEvent({ type: 'start', total: ordered.length });

  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];
  const named = ordered.map((entry) => {
    const result = deriveName(entry.source.relativePath, {
      flatten: options.flatten,
    });
    if (!result.ok) errors.push({ ...result.error, file: entry.file });
    return { ...entry, name: result.ok ? result.name : undefined };
  });
  errors.push(
    ...findCollisions(
      named.flatMap((entry) =>
        entry.name === undefined
          ? []
          : [{ name: entry.name, path: entry.file }],
      ),
    ),
  );

  const cache = options.cache;
  const transformCached = (
    input: TransformInput,
  ): {
    readonly result: ReturnType<typeof transformIcon>;
    readonly fromCache: boolean;
  } => {
    const hit = cache?.get(input);
    if (hit !== undefined) return { result: hit, fromCache: true };
    const result = transformIcon(input);
    cache?.set(input, result);
    return { result, fromCache: false };
  };

  const processed: Processed[] = [];
  named.forEach((entry, index) => {
    const name = entry.name;
    const id = toSymbolId(name ?? 'invalid');
    const { result, fromCache } = transformCached({
      content: entry.source.content,
      file: entry.file,
      symbolId: id,
      mode:
        name === undefined
          ? ColorMode.AUTO
          : resolveColorMode(name, options.color),
    });
    if (!result.ok) {
      errors.push(...result.errors);
      return;
    }
    if (name === undefined) return;
    if (result.icon.isViewBoxDerived) {
      const diagnostic = {
        code: DiagnosticCode.VIEWBOX_DERIVED,
        file: entry.file,
        message: `no viewBox: derived viewBox="${result.icon.viewBox}" from width and height`,
      };
      warnings.push(diagnostic);
      onEvent({ type: 'warning', diagnostic });
    }
    onEvent({
      type: 'icon',
      name,
      file: entry.file,
      index: index + 1,
      total: ordered.length,
      color: result.icon.color,
      delivery: result.icon.delivery,
      fromCache,
    });
    processed.push({
      source: entry.source,
      file: entry.file,
      name,
      id,
      icon: result.icon,
    });
  });

  // Entries the icons of this compile did not touch belong to deleted or changed files.
  cache?.sweep();

  if (errors.length > 0) {
    return {
      ok: false,
      errors: sortDiagnostics(errors),
      warnings: sortDiagnostics(warnings),
    };
  }

  const icons = processed.toSorted((a, b) => compareCodePoints(a.name, b.name));
  const inSprite = icons.filter((item) => item.icon.delivery === Delivery.USE);
  const inStack = icons.filter((item) => item.icon.delivery !== Delivery.USE);
  const spriteText =
    inSprite.length === 0 ? null : assembleSprite(inSprite.map(toSymbol));
  const stackText =
    inStack.length === 0 ? null : assembleStack(inStack.map(toSymbol));
  const spriteName =
    spriteText === null
      ? null
      : spriteFileName(contentHash(new TextEncoder().encode(spriteText)));
  const stackName =
    stackText === null
      ? null
      : stackFileName(contentHash(new TextEncoder().encode(stackText)));

  const manifest: ManifestInput = {
    sprite:
      spriteName === null
        ? null
        : toFileReference(spriteName, options.publicPath),
    stack:
      stackName === null
        ? null
        : toFileReference(stackName, options.publicPath),
    icons: icons.map((item) => ({
      name: item.name,
      id: item.id,
      viewBox: item.icon.viewBox,
      color: item.icon.color,
      delivery: item.icon.delivery,
    })),
  };

  const files: OutputFile[] = [
    ...(spriteName === null || spriteText === null
      ? []
      : [{ target: 'outDir' as const, name: spriteName, content: spriteText }]),
    ...(stackName === null || stackText === null
      ? []
      : [{ target: 'outDir' as const, name: stackName, content: stackText }]),
    { target: 'moduleDir', name: 'icons.js', content: emitModule(manifest) },
    {
      target: 'moduleDir',
      name: 'icons.d.ts',
      content: emitTypes(manifest.icons.map((icon) => icon.name)),
    },
    {
      target: 'moduleDir',
      name: 'manifest.json',
      content: emitManifestJson(manifest),
    },
  ];

  const sourceBytes = icons.reduce(
    (sum, item) => sum + item.source.content.byteLength,
    0,
  );
  const spriteBytes = spriteText === null ? 0 : byteLength(spriteText);
  const stackBytes = stackText === null ? 0 : byteLength(stackText);
  const stats: BuildStats = {
    icons: icons.length,
    mono: icons.filter((item) => item.icon.color === ColorKind.MONO).length,
    multicolor: icons.filter((item) => item.icon.color === ColorKind.MULTICOLOR)
      .length,
    delivery: {
      use: countBy(icons, Delivery.USE),
      img: countBy(icons, Delivery.IMG),
      mask: countBy(icons, Delivery.MASK),
    },
    sourceBytes,
    spriteBytes,
    stackBytes,
    savingsBytes: sourceBytes - spriteBytes - stackBytes,
    durationMs: performance.now() - startedAt,
  };

  return {
    ok: true,
    files,
    manifest,
    icons: icons.map((item) => ({
      name: item.name,
      id: item.id,
      viewBox: item.icon.viewBox,
      color: item.icon.color,
      delivery: item.icon.delivery,
      file: item.file,
    })),
    warnings: sortDiagnostics(warnings),
    stats,
  };
};
