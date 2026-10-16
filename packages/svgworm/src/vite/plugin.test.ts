import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  build as viteBuild,
  createLogger,
  createServer,
  type Logger,
  type Plugin,
  type ResolvedConfig as ViteResolvedConfig,
  type ViteDevServer,
} from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveConfig, type WatcherFactory } from '../core/index.ts';
import {
  createSvgwormPlugin,
  describeBaseMismatch,
  svgworm,
} from './plugin.ts';

// Rebuilds on a slow CI runner can take longer than vi.waitFor's 1 s default (RPT-009).
const WAIT = { timeout: 5000 };

/**
 * A watcher the test fires by hand. With real fs.watch, the macOS CI runner aborted after this
 * file (suspected FSEvents teardown racing the temp-folder removal), and the plugin does not
 * own that timing: the core watch tests do.
 */
const fakeWatcher = () => {
  const listeners: ((fileName: string | null) => void)[] = [];
  let open = 0;
  const factory: WatcherFactory = (_path, onChange) => {
    listeners.push(onChange);
    open += 1;
    return { close: () => void (open -= 1) };
  };
  return {
    factory,
    openCount: () => open,
    fire: (fileName: string) => {
      listeners.forEach((listener) => {
        listener(fileName);
      });
    },
  };
};

let root = '';
let server: ViteDevServer | undefined;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-vite-'));
  await writeFile(
    join(root, 'index.html'),
    '<!doctype html><script type="module" src="/main.js"></script>',
  );
  await writeFile(
    join(root, 'main.js'),
    "import { manifest } from './svgworm/icons.js';\nconsole.log(manifest);\n",
  );
});
afterEach(async () => {
  await server?.close();
  server = undefined;
  await rm(root, { recursive: true, force: true });
});

const svg = (d = 'M0 0h24v24H0z'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}"/></svg>`;

const put = async (relative: string, content: string): Promise<void> => {
  const path = join(root, relative);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
};

const readManifest = (): Promise<string> =>
  readFile(join(root, 'svgworm/icons.js'), 'utf8');

/** A Vite logger whose calls the test can read; nothing reaches the terminal. */
const spyLogger = (): Logger & {
  readonly errors: string[];
  readonly infos: string[];
} => {
  const base = createLogger('silent');
  const errors: string[] = [];
  const infos: string[] = [];
  return {
    ...base,
    errors,
    infos,
    error: (message) => void errors.push(message),
    info: (message) => void infos.push(message),
  };
};

const startServer = async (
  logger: Logger,
  options: { readonly base?: string; readonly watcher?: WatcherFactory } = {},
): Promise<ViteDevServer> => {
  server = await createServer({
    root,
    base: options.base ?? '/',
    configFile: false,
    customLogger: logger,
    // Vite's own watcher is off: the svgworm watcher is the one under test.
    server: { middlewareMode: true, ws: false, watch: null },
    plugins: [
      createSvgwormPlugin(
        {},
        options.watcher === undefined ? {} : { createWatcher: options.watcher },
      ),
    ],
  });
  return server;
};

type Hook = (this: unknown, ...args: never[]) => unknown;

/** Calls a plugin hook directly, for orderings a real Vite run cannot force. */
const callHook = (
  plugin: Plugin,
  name: 'configResolved' | 'configureServer' | 'closeServer' | 'buildStart',
  context: unknown,
  ...args: unknown[]
): Promise<unknown> => {
  const hook = plugin[name] as unknown as Hook;
  return Promise.resolve(hook.call(context, ...(args as never[])));
};

const fakeViteConfig = (command: 'serve' | 'build'): ViteResolvedConfig =>
  ({
    root,
    base: '/',
    command,
    logger: createLogger('silent'),
  }) as unknown as ViteResolvedConfig;

/** The parts of a dev server the plugin touches, with the overlay traffic recorded. */
const fakeServer = () => {
  const sent: { readonly type: string }[] = [];
  const connectListeners: ((
    data: unknown,
    client: { send: (payload: { readonly type: string }) => void },
  ) => void)[] = [];
  const server = {
    config: { logger: createLogger('silent') },
    ws: {
      send: (payload: { readonly type: string }) => void sent.push(payload),
      on: (event: string, listener: (typeof connectListeners)[number]) => {
        if (event === 'vite:client:connect') connectListeners.push(listener);
      },
    },
  } as unknown as ViteDevServer;
  return {
    server,
    sent,
    connect: () => {
      const received: { readonly type: string }[] = [];
      connectListeners.forEach((listener) => {
        listener(undefined, { send: (payload) => void received.push(payload) });
      });
      return received;
    },
  };
};

const buildApp = (options: { readonly base?: string } = {}) =>
  viteBuild({
    root,
    configFile: false,
    logLevel: 'silent',
    base: options.base ?? '/',
    build: { write: false },
    plugins: [svgworm()],
  });

describe('describeBaseMismatch', () => {
  const config = (input: object) =>
    resolveConfig({ sources: 'icons', ...input }, root);

  it.each([
    '/',
    '',
    './',
    'https://cdn.example.com/app/',
    '//cdn.example.com/',
  ])('accepts base %j with the default publicPath', (base) => {
    expect(describeBaseMismatch(config({}), base)).toBeUndefined();
  });

  it.each([
    ['/app/', {}, '/app/icons'],
    ['/app', {}, '/app/icons'],
    ['/app/', { outDir: 'public/sprites' }, '/app/sprites'],
    ['/app/', { outDir: 'public' }, '/app'],
  ])(
    'rejects base %j when publicPath is not set (%j), suggesting %j',
    (base, input, suggested) => {
      const message = describeBaseMismatch(config(input), base);
      expect(message).toContain(`Vite base is "${base}"`);
      expect(message).toContain(`"publicPath": "${suggested}"`);
    },
  );

  it.each(['/app/icons', '/static/icons'])(
    'trusts an explicit publicPath %j',
    (publicPath) => {
      expect(
        describeBaseMismatch(config({ publicPath }), '/app/'),
      ).toBeUndefined();
    },
  );
});

describe('svgworm vite plugin, build', () => {
  it('builds the sprite and manifest before Vite reads the app', async () => {
    await put('icons/home.svg', svg());
    await buildApp();
    expect(await readManifest()).toContain('"/icons/icons.');
  });

  it('fails the Vite build when base is set and publicPath is not, and writes nothing', async () => {
    await put('icons/home.svg', svg());
    await expect(buildApp({ base: '/app/' })).rejects.toThrow(
      /"publicPath": "\/app\/icons"/,
    );
    await expect(readManifest()).rejects.toThrow(/ENOENT/);
  });

  it('uses the publicPath from the config under a base', async () => {
    await put('icons/home.svg', svg());
    await put(
      'svgworm.config.json',
      JSON.stringify({ sources: ['icons'], publicPath: '/app/icons' }),
    );
    await buildApp({ base: '/app/' });
    expect(await readManifest()).toContain('"/app/icons/icons.');
  });

  it('fails the Vite build on an invalid icon and writes nothing', async () => {
    await put('icons/broken.svg', '<svg');
    await expect(buildApp()).rejects.toThrow(/svg\/not-svg-root/);
    await expect(readManifest()).rejects.toThrow(/ENOENT/);
  });

  it('fails the Vite build on an invalid config', async () => {
    await put('icons/home.svg', svg());
    await put('svgworm.config.json', '{ "flatten": "yes" }');
    await expect(buildApp()).rejects.toThrow(/Invalid configuration/);
  });
});

describe('svgworm vite plugin, build hooks', () => {
  it('makes every buildStart call wait for the one build', async () => {
    await put('icons/home.svg', svg());
    const plugin = svgworm();
    await callHook(
      plugin,
      'configResolved',
      undefined,
      fakeViteConfig('build'),
    );
    const context = {
      error: (message: string) => {
        throw new Error(message);
      },
    };
    // `vite build --app`: two environments start together. Each must see the manifest.
    const seen = await Promise.all(
      [0, 1].map(() =>
        callHook(plugin, 'buildStart', context).then(() => readManifest()),
      ),
    );
    seen.forEach((manifest) => {
      expect(manifest).toContain('"home"');
    });
  });
});

describe('svgworm vite plugin, dev', () => {
  it('builds before the server starts and rebuilds on an svg change', async () => {
    await put('icons/home.svg', svg());
    const logger = spyLogger();
    const watcher = fakeWatcher();
    await startServer(logger, { watcher: watcher.factory });
    expect(await readManifest()).toContain('"home"');

    await put(
      'icons/star.svg',
      svg('M12 0l3 9h9l-7 5 3 10-8-6-8 6 3-10-7-5h9z'),
    );
    watcher.fire('star.svg');
    await vi.waitFor(async () => {
      expect(await readManifest()).toContain('"star"');
    }, WAIT);
    expect(logger.errors).toEqual([]);
  });

  it('reports a failed build through the Vite logger and keeps watching', async () => {
    await put('icons/broken.svg', '<svg');
    const logger = spyLogger();
    const watcher = fakeWatcher();
    await startServer(logger, { watcher: watcher.factory });
    expect(logger.errors.join('\n')).toMatch(/svg\/not-svg-root/);
    await expect(readManifest()).rejects.toThrow(/ENOENT/);

    await put('icons/broken.svg', svg());
    watcher.fire('broken.svg');
    await vi.waitFor(async () => {
      expect(await readManifest()).toContain('"broken"');
    }, WAIT);
  });

  it('refuses to start when base is set and publicPath is not', async () => {
    await put('icons/home.svg', svg());
    await expect(
      startServer(spyLogger(), {
        base: '/app/',
        watcher: fakeWatcher().factory,
      }),
    ).rejects.toThrow(/every icon would 404/);
  });

  it('closes its watchers when the server closes', async () => {
    await put('icons/home.svg', svg());
    const watcher = fakeWatcher();
    await startServer(spyLogger(), { watcher: watcher.factory });
    expect(watcher.openCount()).toBe(1);
    await server?.close();
    server = undefined;
    expect(watcher.openCount()).toBe(0);
  });

  it('stops cleanly when the server closes during the first build', async () => {
    await put('icons/home.svg', svg());
    const watcher = fakeWatcher();
    const plugin = createSvgwormPlugin({}, { createWatcher: watcher.factory });
    const { server: fake } = fakeServer();
    await callHook(
      plugin,
      'configResolved',
      undefined,
      fakeViteConfig('serve'),
    );
    const starting = callHook(plugin, 'configureServer', undefined, fake);
    await callHook(plugin, 'closeServer', undefined, { reason: 'close' });
    await starting;
    expect(watcher.openCount()).toBe(0);
  });

  it('shows a failed build to every client that connects, until it is fixed', async () => {
    await put('icons/broken.svg', '<svg');
    const watcher = fakeWatcher();
    const plugin = createSvgwormPlugin({}, { createWatcher: watcher.factory });
    const fake = fakeServer();
    await callHook(
      plugin,
      'configResolved',
      undefined,
      fakeViteConfig('serve'),
    );
    await callHook(plugin, 'configureServer', undefined, fake.server);

    expect(fake.connect().map((payload) => payload.type)).toEqual(['error']);
    expect(fake.connect().map((payload) => payload.type)).toEqual(['error']);

    await put('icons/broken.svg', svg());
    watcher.fire('broken.svg');
    await vi.waitFor(() => {
      expect(fake.sent.map((payload) => payload.type)).toContain('full-reload');
    }, WAIT);
    expect(fake.connect()).toEqual([]);
    await callHook(plugin, 'closeServer', undefined, { reason: 'close' });
  });
});
