import { createIcon } from '@svgworm/react';

import { manifest } from '../../svgworm/icons.js';

// Rendered to static HTML at build time (src/pages/index.astro). No JS ships.
export const Icon = createIcon(manifest);

export type { IconName } from '../../svgworm/icons.js';
