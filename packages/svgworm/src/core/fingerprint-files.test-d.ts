import { expectTypeOf, test } from 'vitest';

import { fingerprintFiles, type SourceFile } from './fingerprint-files.ts';

test('fingerprintFiles takes readonly source files and returns a string', () => {
  expectTypeOf(fingerprintFiles).parameters.toEqualTypeOf<
    [readonly SourceFile[]]
  >();
  expectTypeOf(fingerprintFiles).returns.toBeString();
});

test('a source file needs both path and content', () => {
  // @ts-expect-error content is required
  fingerprintFiles([{ path: 'a.svg' }]);
});
