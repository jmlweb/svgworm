import type { ComponentProps } from 'svelte';

import type Icon from './components/Icon.svelte';

type Props = ComponentProps<typeof Icon>;

export const valid: Props = { name: 'home', label: 'Home', width: 24 };
// @ts-expect-error an unknown icon name is a type error
export const invalid: Props = { name: 'nope' };
