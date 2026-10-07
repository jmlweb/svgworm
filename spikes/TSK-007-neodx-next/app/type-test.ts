import type { IconName } from './_ui/sprite-icon';
// @ts-expect-error invalid icon name must be a type error
export const bad: IconName = 'general:nope';
export const good: IconName = 'general:stroke';
