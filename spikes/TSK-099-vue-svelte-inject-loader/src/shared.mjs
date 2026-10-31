import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(HERE, 'out');
// The page and the "CDN" are two origins: 127.0.0.1 and localhost, each on its own port.
export const CDN_PORT = 4311;
export const CDN_ORIGIN = `http://localhost:${CDN_PORT}`;
