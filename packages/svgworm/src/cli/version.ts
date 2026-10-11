import { readFileSync } from 'node:fs';

/** Reads the published package.json: the same relative path works from `src/` and `dist/`. */
export const readVersion = (): string => {
  const manifest: unknown = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  return typeof manifest === 'object' &&
    manifest !== null &&
    'version' in manifest &&
    typeof manifest.version === 'string'
    ? manifest.version
    : 'unknown';
};
