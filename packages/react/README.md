# @svgworm/react

React Server Component `Icon` for [svgworm](https://github.com/jmlweb/svgworm) sprites. No hooks, no `'use client'`, zero client JavaScript, icon names checked at compile time.

```tsx
import { createIcon } from '@svgworm/react';

import { manifest } from '../svgworm/icons.js';

export const Icon = createIcon(manifest);

// <Icon name="home" /> or <Icon name="home" title="Go home" width={32} height={32} />
```

The icon is `aria-hidden` unless you pass `title` or `label`. Size, `className` and `style` are standard props. Peer dependency: `react` ^19.

Quick start and docs: <https://github.com/jmlweb/svgworm#readme>.

Pre-alpha: v0.1 in progress.
