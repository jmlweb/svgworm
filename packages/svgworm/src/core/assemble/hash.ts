import { createHash } from 'node:crypto';

/** First 8 lowercase hex characters of SHA-256 over the exact bytes (output contract). */
export const contentHash = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex').slice(0, 8);

export const SPRITE_GROUP = 'icons';

export const spriteFileName = (hash: string): string =>
  `${SPRITE_GROUP}.${hash}.svg`;

export const stackFileName = (hash: string): string =>
  `${SPRITE_GROUP}.stack.${hash}.svg`;
