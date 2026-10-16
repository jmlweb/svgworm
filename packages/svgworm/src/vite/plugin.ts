import type { Logger, Plugin, ViteDevServer } from 'vite';

import {
  build,
  ConfigError,
  loadConfig,
  watch,
  type BuildEventHandler,
  type BuildResult,
  type Diagnostic,
  type ResolvedConfig,
  type WatcherFactory,
} from '../core/index.ts';

export type SvgwormPluginOptions = {
  /** Config file, relative to Vite's `root`. Default `svgworm.config.json`. */
  readonly configFile?: string;
};

const PLUGIN_NAME = 'svgworm';

const describe = (diagnostic: Diagnostic): string =>
  diagnostic.file === ''
    ? `[${diagnostic.code}] ${diagnostic.message}`
    : `[${diagnostic.code}] ${diagnostic.file}: ${diagnostic.message}`;

const describeFailure = (errors: readonly Diagnostic[]): string =>
  [
    `build failed with ${String(errors.length)} error(s), nothing was written`,
    ...errors.map((error) => `  ${describe(error)}`),
  ].join('\n');

const describeSuccess = (
  result: Extract<BuildResult, { readonly ok: true }>,
): string => `built ${String(result.icons.length)} icon(s)`;

/**
 * Why the config cannot serve the sprites under Vite's `base`, or `undefined` when it can
 * (ADR-0033). The plugin never rewrites `publicPath`: the CLI does not read
 * `vite.config.*`, so a derived URL would make `svgworm check` and `svgworm` disagree with
 * the plugin. A forgotten base is a build error instead of a 404 on every icon. An
 * explicit `publicPath` is trusted, and a relative or full-URL `base` is not checked.
 */
export const describeBaseMismatch = (
  config: ResolvedConfig,
  base: string,
): string | undefined => {
  if (!config.isDefaultPublicPath) return undefined;
  if (!base.startsWith('/') || base.startsWith('//')) return undefined;
  const prefix = base.replace(/\/+$/, '');
  if (prefix === '') return undefined;
  const suggested = `${prefix}${config.publicPath}`;
  return `Vite base is "${base}" but svgworm publicPath is "${config.publicPath || '/'}", so every icon would 404
  set "publicPath": "${suggested}" in svgworm.config.json`;
};

const warnWith =
  (logger: Logger): BuildEventHandler =>
  (event) => {
    if (event.type === 'warning') {
      logger.warn(`svgworm: ${describe(event.diagnostic)}`, {
        timestamp: true,
      });
    }
  };

type ErrorPayload = {
  readonly type: 'error';
  readonly err: { message: string; stack: string; plugin: string };
};

type WatchSession = {
  /** Resolves once the first build has finished, whatever its outcome. */
  readonly ready: Promise<void>;
  /** Resolves after the signal aborts and any build in flight has finished. */
  readonly stopped: Promise<void>;
};

/** Tests replace the file watcher; users never pass this. */
export type PluginInternals = {
  readonly createWatcher?: WatcherFactory;
};

/** Runs `watch` until `signal` aborts. Returns at once, so a close during the first build stops it. */
const startWatching = (
  config: ResolvedConfig,
  server: ViteDevServer,
  signal: AbortSignal,
  internals: PluginInternals,
): WatchSession => {
  if (signal.aborted) {
    return { ready: Promise.resolve(), stopped: Promise.resolve() };
  }
  const { logger } = server.config;
  let lastError: ErrorPayload | undefined;
  let markReady = (): void => undefined;
  const ready = new Promise<void>((resolve) => {
    markReady = resolve;
  });

  // Vite replays an error sent before any client connects to the first client only, so a
  // reload or a second tab would miss it.
  server.ws.on(
    'vite:client:connect',
    (
      _data: unknown,
      client: { readonly send: (payload: ErrorPayload) => void },
    ) => {
      if (lastError !== undefined) client.send(lastError);
    },
  );

  const showError = (message: string): void => {
    lastError = {
      type: 'error',
      err: { message, stack: '', plugin: PLUGIN_NAME },
    };
    logger.error(`svgworm: ${message}`, { timestamp: true });
    server.ws.send(lastError);
  };
  const onResult = (result: BuildResult): void => {
    if (result.ok) {
      logger.info(`svgworm: ${describeSuccess(result)}`, { timestamp: true });
      // A fix may write nothing (same output as before the error), so no HMR update would
      // clear the overlay.
      if (lastError !== undefined) server.ws.send({ type: 'full-reload' });
      lastError = undefined;
    } else {
      showError(describeFailure(result.errors));
    }
    markReady();
  };
  const onError = (error: unknown): void => {
    showError(error instanceof Error ? error.message : String(error));
    markReady();
  };

  const stopped = watch(config, {
    signal,
    onResult,
    onError,
    onEvent: warnWith(logger),
    ...(internals.createWatcher === undefined
      ? {}
      : { createWatcher: internals.createWatcher }),
  }).catch((error: unknown) => {
    // `watch` rejects only when it cannot go on (a source folder cannot be watched), so
    // later icon changes would be ignored without this hint.
    onError(
      new Error(
        `${error instanceof Error ? error.message : String(error)}
  svgworm stopped watching; restart vite dev to rebuild icons on change`,
      ),
    );
  });
  return { ready, stopped };
};

/** {@link svgworm} with test seams. Not exported from `svgworm/vite`. */
export const createSvgwormPlugin = (
  options: SvgwormPluginOptions,
  internals: PluginInternals,
): Plugin => {
  let root = process.cwd();
  let base = '/';
  let logger: Logger | undefined;
  let isBuild = false;
  let building: Promise<BuildResult> | undefined;
  let stop: (() => Promise<void>) | undefined;

  const resolveSvgwormConfig = async (): Promise<ResolvedConfig> => {
    const config = await loadConfig({
      cwd: root,
      ...(options.configFile === undefined
        ? {}
        : { configFile: options.configFile }),
    });
    const mismatch = describeBaseMismatch(config, base);
    if (mismatch !== undefined) throw new ConfigError(mismatch);
    return config;
  };

  return {
    name: PLUGIN_NAME,
    configResolved(config) {
      root = config.root;
      base = config.base;
      isBuild = config.command === 'build';
      ({ logger } = config);
    },
    async configureServer(server) {
      // Created before any await, so a close while the config loads or the first build runs
      // still stops the watcher.
      const controller = new AbortController();
      const starting = resolveSvgwormConfig().then((config) =>
        startWatching(config, server, controller.signal, internals),
      );
      stop = async () => {
        controller.abort();
        const session = await starting.catch(() => undefined);
        await session?.stopped;
      };
      // A config error stops `vite dev` before it listens, like the CLI's exit code 2.
      await (
        await starting
      ).ready;
    },
    async closeServer() {
      await stop?.();
      stop = undefined;
    },
    async buildStart() {
      // Dev builds come from the watcher. `vite build --app` calls this once per
      // environment: each call waits for the one build, so none reads the manifest early.
      if (!isBuild) return;
      building ??= resolveSvgwormConfig().then((config) =>
        build(config, logger === undefined ? undefined : warnWith(logger)),
      );
      const result = await building;
      if (!result.ok) this.error(describeFailure(result.errors));
    },
  };
};

/**
 * Builds svgworm output inside Vite: once before `vite build`, and on every icon change
 * during `vite dev` (ADR-0033). Optional sugar over the CLI, which stays the documented path
 * for every other bundler.
 */
export const svgworm = (options: SvgwormPluginOptions = {}): Plugin =>
  createSvgwormPlugin(options, {});
