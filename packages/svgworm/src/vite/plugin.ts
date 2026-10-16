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

/** Runs `watch` for the dev server's lifetime and resolves once the first build is done. */
const startWatching = async (
  config: ResolvedConfig,
  server: ViteDevServer,
): Promise<() => Promise<void>> => {
  const { logger } = server.config;
  const controller = new AbortController();
  let hasFailed = false;
  let markReady = (): void => undefined;
  const ready = new Promise<void>((resolve) => {
    markReady = resolve;
  });

  const showError = (message: string): void => {
    hasFailed = true;
    logger.error(`svgworm: ${message}`, { timestamp: true });
    server.ws.send({
      type: 'error',
      err: { message, stack: '', plugin: PLUGIN_NAME },
    });
  };
  const onResult = (result: BuildResult): void => {
    if (result.ok) {
      logger.info(`svgworm: ${describeSuccess(result)}`, { timestamp: true });
      // A fix may write nothing (same output as before the error), so no HMR update would
      // clear the overlay.
      if (hasFailed) server.ws.send({ type: 'full-reload' });
      hasFailed = false;
    } else {
      showError(describeFailure(result.errors));
    }
    markReady();
  };
  const onError = (error: unknown): void => {
    showError(error instanceof Error ? error.message : String(error));
    markReady();
  };

  const watching = watch(config, {
    signal: controller.signal,
    onResult,
    onError,
    onEvent: warnWith(logger),
  }).catch(onError);
  await ready;
  return async () => {
    controller.abort();
    await watching;
  };
};

/**
 * Builds svgworm output inside Vite: once before `vite build`, and on every icon change
 * during `vite dev` (ADR-0033). Optional sugar over the CLI, which stays the documented path
 * for every other bundler.
 */
export const svgworm = (options: SvgwormPluginOptions = {}): Plugin => {
  let root = process.cwd();
  let base = '/';
  let logger: Logger | undefined;
  let isBuild = false;
  let hasBuilt = false;
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
      // A config error stops `vite dev` before it listens, like the CLI's exit code 2.
      stop = await startWatching(await resolveSvgwormConfig(), server);
    },
    async closeServer() {
      await stop?.();
      stop = undefined;
    },
    async buildStart() {
      // Dev builds come from the watcher; `vite build --app` calls this per environment.
      if (!isBuild || hasBuilt) return;
      hasBuilt = true;
      const config = await resolveSvgwormConfig();
      const result = await build(
        config,
        logger === undefined ? undefined : warnWith(logger),
      );
      if (!result.ok) this.error(describeFailure(result.errors));
    },
  };
};
