import { expectTypeOf, test } from 'vitest';

// Snapshots are never published, and this file is a test only.
// oxlint-disable-next-line n/no-unpublished-import
import { manifest, type IconName } from './__snapshots__/fixtures/icons.js';

// The snapshot is the generated `icons.d.ts` of the fixture corpus, so this checks the
// types a consumer actually gets.
const takeIcon = (_name: IconName): void => undefined;

test('a known name is accepted', () => {
  takeIcon('non-ascii/café');
  takeIcon('mono-fill/heroicons-home');
});

test('an unknown name is a type error', () => {
  // @ts-expect-error not an icon of the corpus
  takeIcon('does-not-exist');
  // @ts-expect-error names are lowercase
  takeIcon('Mono-Fill/Heroicons-Home');
});

test('the manifest is keyed by icon name', () => {
  expectTypeOf(manifest.icons['non-ascii/café'].delivery).toEqualTypeOf<
    'use' | 'img' | 'mask'
  >();
  // @ts-expect-error not an icon of the corpus
  void manifest.icons['does-not-exist'];
});

test('IconName is a union of string literals', () => {
  expectTypeOf<IconName>().toExtend<string>();
  expectTypeOf<string>().not.toExtend<IconName>();
});
