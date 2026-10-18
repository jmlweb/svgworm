import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { isSupportedTypeScript } from './typescript.ts';

describe('isSupportedTypeScript', () => {
  const api = (versionMajorMinor: string) => ({
    createSourceFile: () => undefined,
    versionMajorMinor,
  });

  it('accepts TypeScript 5 and 6, including the installed one', () => {
    expect(isSupportedTypeScript(ts)).toBe(true);
    expect(isSupportedTypeScript(api('5.0'))).toBe(true);
    expect(isSupportedTypeScript(api('6.0'))).toBe(true);
  });

  it('rejects TypeScript 4, and TypeScript 7 whose main entry has no compiler API', () => {
    expect(isSupportedTypeScript(api('4.9'))).toBe(false);
    expect(isSupportedTypeScript(api('7.0'))).toBe(false);
    expect(isSupportedTypeScript({ version: '7.0.2' })).toBe(false);
    expect(isSupportedTypeScript(undefined)).toBe(false);
  });
});
