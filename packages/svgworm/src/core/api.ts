export { build, compileFromDisk } from './build.ts';
export type { BuildOptions, BuildResult, BuildSuccess } from './build.ts';
export { createTransformCache } from './svg/cache.ts';
export type { TransformCache } from './svg/cache.ts';
export { check, CheckStatus } from './check.ts';
export type {
  CheckEntry,
  CheckOutcome,
  CheckResult,
  IconDiff,
} from './check.ts';
export { watch } from './watch.ts';
export type { Watcher, WatcherFactory, WatchOptions } from './watch.ts';
export { compile } from './compile.ts';
export type {
  CompileOptions,
  CompileResult,
  CompileSuccess,
  IconSummary,
  OutputFile,
  SourceInput,
} from './compile.ts';
export { loadConfig, resolveConfig } from './config/resolve.ts';
export type { ConfigOverrides, ResolvedConfig } from './config/resolve.ts';
export { ColorMode, getConfigJsonSchema } from './config/schema.ts';
export type { ColorRule, ConfigInput } from './config/schema.ts';
export { BuildFailedError, ConfigError, DiagnosticCode } from './errors.ts';
export type { Diagnostic } from './errors.ts';
export type { BuildEvent, BuildEventHandler, BuildStats } from './events.ts';
