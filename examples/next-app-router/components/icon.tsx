import { createIcon } from '@svgworm/react';

import { manifest } from '../svgworm/icons.js';

// A Server Component: no hooks, no 'use client'. Created once, used anywhere on the server.
export const Icon = createIcon(manifest);

export type { IconName } from '../svgworm/icons.js';
