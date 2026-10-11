export * from './api.ts';
export { compareCodeUnits } from './compare-code-units.ts';
// Removed together with the placeholder once the fingerprint script uses the real build.
export {
  DuplicatePathError,
  fingerprintFiles,
  normalizePath,
} from './fingerprint-files.ts';
export type { SourceFile } from './fingerprint-files.ts';
