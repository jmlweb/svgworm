// What a user writes once (TSK-012 shape): bind the generated module to the adapter.
import { manifest } from '../../svgworm/icons.js';
import { createIcon } from './create-icon';

export const Icon = createIcon(manifest);
