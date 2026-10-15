import { expectTypeOf, test } from 'vitest';

import { createIcon, createSpriteLoader } from './create-icon.js';
import { injectManifest, manifest } from './fixture-manifest.js';

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

test('a version 2 manifest types the same names and a loader component', () => {
  const Injected = createIcon(injectManifest);
  expectTypeOf<Parameters<typeof Injected>[0]['name']>().toEqualTypeOf<
    'brand/sunset' | 'café' | 'home'
  >();
  expectTypeOf(createSpriteLoader(injectManifest)).toBeCallableWith();
  expectTypeOf(createSpriteLoader(manifest)).toBeCallableWith();
});
