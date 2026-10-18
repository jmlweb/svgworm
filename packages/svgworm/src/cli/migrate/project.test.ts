import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createIconImportMatcher,
  createSvgResolver,
  iconImportFor,
  readPathAliases,
  type PathAliases,
} from './project.ts';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-project-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const put = async (relative: string, content = ''): Promise<void> => {
  const path = join(root, relative);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
};

const from = (relative: string): string => join(root, relative);

describe('readPathAliases', () => {
  it('reads paths through extends, relative to the config that declares them', async () => {
    await put(
      'tsconfig.base.json',
      '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }',
    );
    await put('tsconfig.json', '{ "extends": "./tsconfig.base.json" }');
    const aliases = readPathAliases(ts, root);
    expect(aliases?.paths).toEqual({ '@/*': ['./src/*'] });
    await put('src/icons/logo.svg');
    expect(
      createSvgResolver(aliases)('@/icons/logo.svg', from('src/app/page.tsx')),
    ).toBe(from('src/icons/logo.svg'));
  });

  it('falls back to jsconfig.json, and gives nothing without paths', async () => {
    expect(readPathAliases(ts, root)).toBe(undefined);
    await put('jsconfig.json', '{ "compilerOptions": { "strict": true } }');
    expect(readPathAliases(ts, root)).toBe(undefined);
  });
});

describe('createSvgResolver', () => {
  const aliases = (): PathAliases => ({
    base: root,
    paths: {
      '@/*': ['./src/*'],
      '@/icons/*': ['./assets/svg/*', './src/icons/*'],
      '~logo': ['./brand/logo.svg'],
    },
  });

  it('resolves relative specifiers and drops the query', () => {
    expect(
      createSvgResolver(undefined)(
        '../icons/a.svg?react',
        from('src/app/page.tsx'),
      ),
    ).toBe(from('src/icons/a.svg'));
  });

  it('takes the longest alias prefix and the first target that exists', async () => {
    await put('src/icons/a.svg');
    await put('brand/logo.svg');
    const resolveSvg = createSvgResolver(aliases());
    expect(resolveSvg('@/icons/a.svg', from('src/page.tsx'))).toBe(
      from('src/icons/a.svg'),
    );
    expect(resolveSvg('~logo', from('src/page.tsx'))).toBe(
      from('brand/logo.svg'),
    );
  });

  it('gives nothing for a root path or a package that does not resolve', () => {
    const resolveSvg = createSvgResolver(aliases());
    expect(resolveSvg('/icons/a.svg', from('src/page.tsx'))).toBe(undefined);
    expect(resolveSvg('no-such-pkg/a.svg', from('src/page.tsx'))).toBe(
      undefined,
    );
  });
});

describe('createIconImportMatcher', () => {
  // Built per test: `root` is set in beforeEach.
  const matches = (specifier: string, fromAbsolutePath: string): boolean =>
    createIconImportMatcher(
      { base: root, paths: { '@/*': ['./src/*'] } },
      root,
      'src/components/icon.tsx',
    )(specifier, fromAbsolutePath);
  const page = (): string => from('src/app/page.tsx');

  it.each([
    '../components/icon',
    '../components/icon.tsx',
    '../components/icon.js',
    '@/components/icon',
  ])('matches %s', (specifier) => {
    expect(matches(specifier, page())).toBe(true);
  });

  it('matches a folder index and rejects other modules', () => {
    const indexMatcher = createIconImportMatcher(
      undefined,
      root,
      'src/components/icon/index.tsx',
    );
    expect(indexMatcher('../components/icon', page())).toBe(true);
    expect(matches('../components/icons', page())).toBe(false);
    expect(matches('some-icon-lib', page())).toBe(false);
  });
});

describe('iconImportFor', () => {
  it('gives an extensionless relative specifier', () => {
    expect(iconImportFor('src/app/page.tsx', 'src/components/icon.tsx')).toBe(
      '../components/icon',
    );
    expect(
      iconImportFor('src/components/menu.tsx', 'src/components/icon.tsx'),
    ).toBe('./icon');
  });
});
