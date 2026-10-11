import { expectTypeOf, test } from 'vitest';

import { createIcon } from './create-icon.js';
import { manifest } from './fixture-manifest.js';

const Icon = createIcon(manifest);

type Props = Parameters<typeof Icon>[0];

test('name is the union of public icon names', () => {
  expectTypeOf<Props['name']>().toEqualTypeOf<
    'brand/sunset' | 'café' | 'home'
  >();
});

test('an invalid icon name is a type error', () => {
  // @ts-expect-error not in the manifest
  Icon({ name: 'nope' });
  // @ts-expect-error the symbol id is not a public name
  Icon({ name: 'i-home' });
});

test('standard svg props are accepted', () => {
  expectTypeOf(Icon).toBeCallableWith({
    name: 'home',
    title: 'Home',
    width: 24,
  });
});
