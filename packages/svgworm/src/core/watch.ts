import { watch as watchPath } from 'node:fs';
import { basename, join } from 'node:path';

import type { ResolvedConfig } from './config/resolve.ts';
import type { BuildEventHandler } from './events.ts';

import { build, type BuildResult } from './build.ts';
import { toPosix } from './fs.ts';
import { createTransformCache } from './svg/cache.ts';

export type Watcher = { readonly close: () => void };

/**
 * Watches `path` recursively. Calls `onChange` with the changed file name, when known, and
 * `onError` when the watcher itself fails (folder gone, descriptor limit); no events follow.
 */
export type WatcherFactory = (
  path: string,
  onChange: (fileName: string | null) => void,
  onError: (error: unknown) => void,
) => Watcher;

export type WatchOptions = {
  /** Called with every build's outcome, including the first one. */
  readonly onResult: (result: BuildResult) => void;
  /** Called when a build throws (an unexpected I/O failure) or a watcher fails. Watching continues. */
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

const createFsWatcher: WatcherFactory = (path, onChange, onError) => {
  // The callback form gives a synchronous `close()` and an error event; the promise form has neither.
  // oxlint-disable-next-line n/prefer-promises/fs
  const watcher = watchPath(path, { recursive: true }, (_event, fileName) => {
    onChange(fileName);
  });
  watcher.on('error', onError);
  return {
    close: () => {
      watcher.close();
    },
  };
};

/** Only `.svg` files and folders (which may hold icons) can change the output. */
const mayHoldIcons = (fileName: string | null): boolean => {
  if (fileName === null) return true;
  const name = basename(toPosix(fileName));
  if (name.startsWith('.')) return false;
  return /\.svg$/i.test(name) || !name.includes('.');
};

/**
 * Builds once, then rebuilds after each change in a source folder (R-30). Every file is read
 * and the output is reassembled on each rebuild, but only icons whose content changed are
 * re-optimized (ADR-0015). Network file systems and container bind mounts can miss
 * `fs.watch` events (ADR-0008).
 *
 * The watchers attach before the first build, so a change made during it is not lost. The
 * returned promise resolves after the signal aborts and any build in flight has finished, so
 * nothing is written after the caller believes the watch is over.
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
  let isStopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: Promise<void> | undefined;

  const scheduleIfDirty = (): void => {
    if (isDirty && !isStopped) {
      isDirty = false;
      schedule();
    }
  };
  const rebuild = async (): Promise<void> => {
    isBuilding = true;
    try {
      const result = await build(config, onEvent, { cache });
      if (!isStopped) options.onResult(result);
    } catch (error) {
      if (!isStopped) onError(error);
    } finally {
      isBuilding = false;
      inFlight = undefined;
    }
    scheduleIfDirty();
  };
  const schedule = (): void => {
    if (isStopped) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (isStopped) return;
      if (isBuilding) {
        isDirty = true;
        return;
      }
      inFlight = rebuild();
    }, debounceMs);
  };
  const onChange = (fileName: string | null): void => {
    if (!mayHoldIcons(fileName)) return;
    if (isBuilding) {
      // Coalesce with the running build; it reschedules when it finishes.
      isDirty = true;
      return;
    }
    schedule();
  };

  // A function, so the check after the first build is not narrowed away by the one before it.
  const isAborted = (): boolean => options.signal?.aborted === true;

  if (isAborted()) {
    options.onResult(await build(config, onEvent, { cache }));
    return;
  }

  // Attach first so edits during the first build are seen. If a folder cannot be watched,
  // the first build explains why (a missing source is a config error) before the watcher
  // error is raised.
  const watchers: Watcher[] = [];
  let attachError: unknown;
  for (const { dir: source } of config.sources) {
    try {
      watchers.push(
        createWatcher(join(config.cwd, source), onChange, (error) => {
          onError(error);
          // The next build reports a vanished folder through the normal path.
          schedule();
        }),
      );
    } catch (error) {
      attachError = error;
      break;
    }
  }
  const closeAll = (): void => {
    watchers.forEach((watcher) => {
      watcher.close();
    });
  };

  isBuilding = true;
  try {
    options.onResult(await build(config, onEvent, { cache }));
  } catch (error) {
    closeAll();
    throw error;
  } finally {
    isBuilding = false;
  }
  if (attachError !== undefined) {
    closeAll();
    throw attachError instanceof Error
      ? attachError
      : new Error('cannot watch a source folder', { cause: attachError });
  }
  if (isAborted()) {
    closeAll();
    return;
  }
  scheduleIfDirty();

  await new Promise<void>((resolve) => {
    options.signal?.addEventListener(
      'abort',
      () => {
        isStopped = true;
        clearTimeout(timer);
        closeAll();
        resolve(inFlight);
      },
      { once: true },
    );
  });
};
