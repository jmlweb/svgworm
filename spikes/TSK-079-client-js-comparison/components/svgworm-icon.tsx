import { createIcon } from '@svgworm/react';

import { manifest } from '../svgworm/icons.js';

// No hooks and no 'use client': usable from Server and Client Components alike.
export const Icon = createIcon(manifest);

export const svgwormNames = ["house","search","settings","user","bell","mail","heart","star","trash-2","plus","x","check","chevron-right","menu","calendar","camera","download","upload","lock","globe"] as const;
