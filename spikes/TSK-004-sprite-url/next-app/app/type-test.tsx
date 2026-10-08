// Checked by `tsc --noEmit` and by `next build`: an unknown icon name is a type error.
import { Icon } from './_ui/icon';

export const valid = <Icon name="brand/sunset" />;
// @ts-expect-error "nope" is not an IconName
export const invalid = <Icon name="nope" />;
