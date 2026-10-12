import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BuildResult } from './build.ts';
import type { BuildEvent } from './events.ts';

import { resolveConfig, type ResolvedConfig } from './config/resolve.ts';
import { watch, type WatcherFactory } from './watch.ts';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-watch-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

const put = async (relative: string, content = svg): Promise<void> => {
  const path = join(root, relative);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
};

const config = (): ResolvedConfig =>
  resolveConfig({ sources: ['icons'] }, root);

/** A watcher the test fires by hand, so the debounce is the only timing involved. */
const fakeWatcher = () => {
  const listeners: ((fileName: string | null) => void)[] = [];
  const errorListeners: ((error: unknown) => void)[] = [];
  const closed: string[] = [];
  const factory: WatcherFactory = (path, onChange, onError) => {
    listeners.push(onChange);
    errorListeners.push(onError);
    return { close: () => void closed.push(path) };
  };
  return {
    factory,
    closed,
    fire: (fileName: string | null) => {
      listeners.forEach((listener) => {
        listener(fileName);
      });
    },
    fail: (error: unknown) => {
      errorListeners.forEach((listener) => {
        listener(error);
      });
    },
  };
};

describe('watch', () => {
  it('builds once at start, rebuilds on an svg change, and stops on abort', async () => {
    await put('icons/home.svg');
    const results: BuildResult[] = [];
    const watcher = fakeWatcher();
    const controller = new AbortController();
    const done = watch(config(), {
      onResult: (result) => results.push(result),
      createWatcher: watcher.factory,
      debounceMs: 5,
      signal: controller.signal,
    });
    await vi.waitFor(() => {
      expect(results).toHaveLength(1);
    });

    await put('icons/more.svg', svg.replace('M0 0', 'M1 1'));
    watcher.fire('more.svg');
    watcher.fire('more.svg');
    await vi.waitFor(() => {
      expect(results).toHaveLength(2);
    });
    const second = results[1];
    expect(
      second?.ok && second.manifest.icons.map((icon) => icon.name),
    ).toEqual(['home', 'more']);

    controller.abort();
    await done;
    expect(watcher.closed).toEqual([join(root, 'icons')]);
  });

  it('ignores changes to files that are not svg', async () => {
    await put('icons/home.svg');
    const results: BuildResult[] = [];
    const watcher = fakeWatcher();
    const controller = new AbortController();
    const done = watch(config(), {
      onResult: (result) => results.push(result),
      createWatcher: watcher.factory,
      debounceMs: 5,
      signal: controller.signal,
    });
    await vi.waitFor(() => {
      expect(results).toHaveLength(1);
    });
    watcher.fire('notes.txt');
    watcher.fire('.DS_Store');
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(results).toHaveLength(1);
    // A folder rename has no extension and may contain icons.
    watcher.fire('subfolder');
    await vi.waitFor(() => {
      expect(results).toHaveLength(2);
    });
    controller.abort();
    await done;
  });

  it('keeps watching after a failed build and reports the failure', async () => {
    await put('icons/home.svg');
    const results: BuildResult[] = [];
    const watcher = fakeWatcher();
    const controller = new AbortController();
    const done = watch(config(), {
      onResult: (result) => results.push(result),
      createWatcher: watcher.factory,
      debounceMs: 5,
      signal: controller.signal,
    });
    await vi.waitFor(() => {
      expect(results).toHaveLength(1);
    });
    await put('icons/broken.svg', '<svg');
    watcher.fire('broken.svg');
    await vi.waitFor(() => {
      expect(results).toHaveLength(2);
    });
    expect(results[1]?.ok).toBe(false);
    await rm(join(root, 'icons/broken.svg'));
    watcher.fire('broken.svg');
    await vi.waitFor(() => {
      expect(results).toHaveLength(3);
    });
    expect(results[2]?.ok).toBe(true);
    controller.abort();
    await done;
  });

  it('sees a change made during the first build', async () => {
    await put('icons/home.svg');
    const results: BuildResult[] = [];
    const watcher = fakeWatcher();
    const controller = new AbortController();
    const done = watch(config(), {
      onResult: (result) => {
        results.push(result);
        // The watchers are attached by now, and the first build is still running.
        if (results.length === 1) watcher.fire('more.svg');
      },
      createWatcher: watcher.factory,
      debounceMs: 5,
      signal: controller.signal,
    });
    await put('icons/more.svg', svg.replace('M0 0', 'M1 1'));
    await vi.waitFor(() => {
      expect(results).toHaveLength(2);
    });
    const second = results[1];
    expect(
      second?.ok && second.manifest.icons.map((icon) => icon.name),
    ).toEqual(['home', 'more']);
    controller.abort();
    await done;
  });

  it('does not rebuild after abort, even with a change pending from the running build', async () => {
    await put('icons/home.svg');
    const results: BuildResult[] = [];
    const watcher = fakeWatcher();
    const controller = new AbortController();
    const done = watch(config(), {
      onResult: (result) => {
        results.push(result);
        if (results.length === 1) {
          watcher.fire('home.svg');
          controller.abort();
        }
      },
      createWatcher: watcher.factory,
      debounceMs: 5,
      signal: controller.signal,
    });
    await done;
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(results).toHaveLength(1);
    expect(watcher.closed).toEqual([join(root, 'icons')]);
  });

  it('reports a watcher failure and rebuilds, so a vanished folder is not silent', async () => {
    await put('icons/home.svg');
    const results: BuildResult[] = [];
    const errors: unknown[] = [];
    const watcher = fakeWatcher();
    const controller = new AbortController();
    const done = watch(config(), {
      onResult: (result) => results.push(result),
      onError: (error) => errors.push(error),
      createWatcher: watcher.factory,
      debounceMs: 5,
      signal: controller.signal,
    });
    await vi.waitFor(() => {
      expect(results).toHaveLength(1);
    });
    const failure = new Error('EMFILE: too many open files');
    watcher.fail(failure);
    await vi.waitFor(() => {
      expect(results).toHaveLength(2);
    });
    expect(errors).toEqual([failure]);
    controller.abort();
    await done;
  });

  it('resolves at once when the signal is already aborted', async () => {
    await put('icons/home.svg');
    const results: BuildResult[] = [];
    const watcher = fakeWatcher();
    await watch(config(), {
      onResult: (result) => results.push(result),
      createWatcher: watcher.factory,
      signal: AbortSignal.abort(),
    });
    expect(results).toHaveLength(1);
    expect(watcher.closed).toEqual([]);
  });

  it('rebuilds on a real file system change', async () => {
    await put('icons/home.svg');
    const results: BuildResult[] = [];
    const controller = new AbortController();
    const done = watch(config(), {
      onResult: (result) => results.push(result),
      debounceMs: 20,
      signal: controller.signal,
    });
    await vi.waitFor(() => {
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
    // FSEvents on macOS can replay the folder creation once the watcher attaches, so let
    // any such build settle before counting.
    await new Promise((resolve) => setTimeout(resolve, 300));
    const before = results.length;
    await put('icons/more.svg', svg.replace('M0 0', 'M1 1'));
    await vi.waitFor(
      () => {
        expect(results.length).toBeGreaterThan(before);
      },
      { timeout: 5000 },
    );
    controller.abort();
    await done;
  });
});

describe('watch: incremental rebuilds (ADR-0015)', () => {
  it('re-optimizes only the icons whose content changed', async () => {
    await put('icons/home.svg');
    await put('icons/other.svg', svg.replace('M0 0', 'M2 2'));
    const events: BuildEvent[] = [];
    const results: BuildResult[] = [];
    const watcher = fakeWatcher();
    const controller = new AbortController();
    const done = watch(config(), {
      onEvent: (event) => events.push(event),
      onResult: (result) => results.push(result),
      createWatcher: watcher.factory,
      debounceMs: 5,
      signal: controller.signal,
    });
    await vi.waitFor(() => {
      expect(results).toHaveLength(1);
    });
    expect(events.filter((e) => e.type === 'icon' && e.fromCache)).toHaveLength(
      0,
    );

    await put('icons/home.svg', svg.replace('M0 0', 'M1 1'));
    events.length = 0;
    watcher.fire('home.svg');
    await vi.waitFor(() => {
      expect(results).toHaveLength(2);
    });
    expect(
      events.flatMap((e) => (e.type === 'icon' ? [[e.name, e.fromCache]] : [])),
    ).toEqual([
      ['home', false],
      ['other', true],
    ]);
    controller.abort();
    await done;
  });
});
