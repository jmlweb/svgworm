import { watch as watchPath } from 'node:fs';
import { basename, join } from 'node:path';

import type { ResolvedConfig } from './config/resolve.ts';
import type { BuildEventHandler } from './events.ts';

import { build, type BuildResult } from './build.ts';
import { createTransformCache } from './svg/cache.ts';

export type Watcher = { readonly close: () => void };

/** Watches `path` recursively and calls `onChange` with the changed file name, when known. */
export type WatcherFactory = (
  path: string,
  onChange: (fileName: string | null) => void,
) => Watcher;

export type WatchOptions = {
  /** Called with every build's outcome, including the first one. */
  readonly onResult: (result: BuildResult) => void;
  /** Called when a build throws (an unexpected I/O failure). Watching continues. */
  readonly onError?: (error: unknown) => void;
  readonly onEvent?: BuildEventHandler;
  /** Stops watching. Without it, `watch` never resolves. */
  readonly signal?: AbortSignal;
  /** Quiet time after the last change before a rebuild. Default 100 ms. */
  readonly debounceMs?: number;
  /** Replaces `fs.watch`, for tests. */
  readonly createWatcher?: WatcherFactory;
};

const DEFAULT_DEBOUNCE_MS = 100;

const createFsWatcher: WatcherFactory = (path, onChange) => {
  // The callback form gives a synchronous `close()` and an error event; the promise form has neither.
  // oxlint-disable-next-line n/prefer-promises/fs
  const watcher = watchPath(path, { recursive: true }, (_event, fileName) => {
    onChange(fileName);
  });
  // A folder that vanishes mid-watch is reported by the next build, not by a crash.
  watcher.on('error', () => undefined);
  return {
    close: () => {
      watcher.close();
    },
  };
};

/** Only `.svg` files and folders (which may hold icons) can change the output. */
const mayHoldIcons = (fileName: string | null): boolean => {
  if (fileName === null) return true;
  const name = basename(fileName.replaceAll('\\', '/'));
  if (name.startsWith('.')) return false;
  return /\.svg$/i.test(name) || !name.includes('.');
};

/**
 * Builds once, then rebuilds after each change in a source folder (R-30). Every file is read
 * and the output is reassembled on each rebuild, but only icons whose content changed are
 * re-optimized (ADR-0015). Network file systems and container bind mounts can miss
 * `fs.watch` events (ADR-0008).
 */
export const watch = async (
  config: ResolvedConfig,
  options: WatchOptions,
): Promise<void> => {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const createWatcher = options.createWatcher ?? createFsWatcher;
  const onEvent = options.onEvent ?? (() => undefined);
  const onError = options.onError ?? (() => undefined);
  // Only icons whose bytes changed are re-optimized on a rebuild (ADR-0015).
  const cache = createTransformCache();

  let isBuilding = false;
  let isDirty = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const rebuild = async (): Promise<void> => {
    if (isBuilding) {
      isDirty = true;
      return;
    }
    isBuilding = true;
    try {
      options.onResult(await build(config, onEvent, { cache }));
    } catch (error) {
      onError(error);
    } finally {
      isBuilding = false;
    }
    if (isDirty) {
      isDirty = false;
      schedule();
    }
  };
  const schedule = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void rebuild();
    }, debounceMs);
  };

  // The first build throws like `build` does, so a missing source folder is a config error.
  options.onResult(await build(config, onEvent, { cache }));
  if (options.signal?.aborted === true) return;

  const watchers = config.sources.map((source) =>
    createWatcher(join(config.cwd, source), (fileName) => {
      if (mayHoldIcons(fileName)) schedule();
    }),
  );

  await new Promise<void>((resolve) => {
    options.signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        watchers.forEach((watcher) => {
          watcher.close();
        });
        resolve();
      },
      { once: true },
    );
  });
};
