import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  build as viteBuild,
  createLogger,
  createServer,
  type Logger,
  type ViteDevServer,
} from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveConfig } from '../core/index.ts';
import { describeBaseMismatch, svgworm } from './plugin.ts';

// Real fs.watch events on a slow CI runner can take longer than vi.waitFor's 1 s default.
const WAIT = { timeout: 5000 };

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
  base = '/',
): Promise<ViteDevServer> => {
  server = await createServer({
    root,
    base,
    configFile: false,
    customLogger: logger,
    server: { middlewareMode: true, ws: false },
    plugins: [svgworm()],
  });
  return server;
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

describe('svgworm vite plugin, dev', () => {
  it('builds before the server starts and rebuilds on an svg change', async () => {
    await put('icons/home.svg', svg());
    const logger = spyLogger();
    await startServer(logger);
    const first = await readManifest();
    expect(first).toContain('"home"');

    await put(
      'icons/star.svg',
      svg('M12 0l3 9h9l-7 5 3 10-8-6-8 6 3-10-7-5h9z'),
    );
    await vi.waitFor(async () => {
      expect(await readManifest()).toContain('"star"');
    }, WAIT);
    expect(logger.errors).toEqual([]);
  });

  it('reports a failed build through the Vite logger and keeps watching', async () => {
    await put('icons/broken.svg', '<svg');
    const logger = spyLogger();
    await startServer(logger);
    expect(logger.errors.join('\n')).toMatch(/svg\/not-svg-root/);
    await expect(readManifest()).rejects.toThrow(/ENOENT/);

    await put('icons/broken.svg', svg());
    await vi.waitFor(async () => {
      expect(await readManifest()).toContain('"broken"');
    }, WAIT);
  });

  it('refuses to start when base is set and publicPath is not', async () => {
    await put('icons/home.svg', svg());
    await expect(startServer(spyLogger(), '/app/')).rejects.toThrow(
      /every icon would 404/,
    );
  });

  it('stops watching when the server closes', async () => {
    await put('icons/home.svg', svg());
    const logger = spyLogger();
    await startServer(logger);
    await server?.close();
    server = undefined;
    const builds = logger.infos.length;

    await put('icons/star.svg', svg());
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await readManifest()).not.toContain('"star"');
    expect(logger.infos).toHaveLength(builds);
  });
});
