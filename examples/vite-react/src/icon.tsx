import { createIcon } from '@svgworm/react';

import { manifest } from '../svgworm/icons.js';

// Vite has no server, so this runs in the browser and the manifest ships in the bundle.
export const Icon = createIcon(manifest);

export type { IconName } from '../svgworm/icons.js';
