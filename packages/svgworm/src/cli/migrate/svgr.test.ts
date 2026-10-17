import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { migrateSvgr, type IconLookup } from './svgr.ts';

const ICONS: Readonly<Record<string, string>> = {
  './logo.svg': 'logo',
  './icons/arrow-left.svg': 'arrows/left',
  '@/icons/star.svg': 'star',
};

const lookup = (specifier: string): IconLookup => {
  const path = specifier.replace(/\?.*$/, '');
  const name = ICONS[path];
  return name === undefined
    ? { kind: 'skip', reason: 'is outside the configured sources' }
    : { kind: 'icon', name };
};

const ICON_IMPORTS: ReadonlySet<string> = new Set([
  '../components/icon',
  '@/components/icon',
]);

const migrate = (content: string, path = 'app/page.tsx') => {
  const [result] = migrateSvgr({
    ts,
    lookup,
    isIconImport: (specifier) => ICON_IMPORTS.has(specifier),
    files: [
      {
        path,
        absolutePath: `/project/${path}`,
        content,
        iconImport: '../components/icon',
      },
    ],
  });
  if (result === undefined) throw new Error('no result');
  return result;
};

describe('migrateSvgr: conversions', () => {
  it('rewrites a default import (Next.js @svgr/webpack) and keeps the props', () => {
    const result = migrate(
      [
        "import Link from 'next/link';",
        "import Logo from './logo.svg';",
        '',
        'export const Header = () => (',
        '  <Link href="/">',
        '    <Logo className="h-6" aria-label="Home" />',
        '  </Link>',
        ');',
        '',
      ].join('\n'),
    );
    expect(result.output).toBe(
      [
        "import Link from 'next/link';",
        "import { Icon } from '../components/icon';",
        '',
        'export const Header = () => (',
        '  <Link href="/">',
        '    <Icon name="logo" className="h-6" aria-label="Home" />',
        '  </Link>',
        ');',
        '',
      ].join('\n'),
    );
    expect(result.changes).toEqual([
      {
        line: 6,
        from: '<Logo className="h-6" aria-label="Home" />',
        to: '<Icon name="logo" className="h-6" aria-label="Home" />',
      },
    ]);
    expect(result.skipped).toEqual([]);
  });

  it('rewrites a named ReactComponent import with an alias (CRA) and keeps the URL import', () => {
    const result = migrate(
      [
        'import logoUrl, { ReactComponent as LogoIcon } from "./logo.svg"',
        '',
        'export const A = () => <><img src={logoUrl} /><LogoIcon width={16} /></>',
        '',
      ].join('\n'),
    );
    expect(result.output).toBe(
      [
        'import logoUrl from "./logo.svg"',
        'import { Icon } from "../components/icon"',
        '',
        'export const A = () => <><img src={logoUrl} /><Icon name="logo" width={16} /></>',
        '',
      ].join('\n'),
    );
  });

  it('rewrites a ?react import (vite-plugin-svgr) and folder names', () => {
    const result = migrate(
      [
        "import ArrowLeft from './icons/arrow-left.svg?react';",
        '',
        'export const B = () => <ArrowLeft></ArrowLeft>;',
        '',
      ].join('\n'),
    );
    expect(result.output).toBe(
      [
        "import { Icon } from '../components/icon';",
        '',
        'export const B = () => <Icon name="arrows/left" />;',
        '',
      ].join('\n'),
    );
  });

  it('reuses an existing Icon import and removes every converted svg import', () => {
    const result = migrate(
      [
        "import { Icon } from '../components/icon';",
        "import Logo from './logo.svg';",
        "import Star from '@/icons/star.svg';",
        '',
        'export const C = () => <><Icon name="logo" /><Logo /><Star /></>;',
        '',
      ].join('\n'),
    );
    expect(result.output).toBe(
      [
        "import { Icon } from '../components/icon';",
        '',
        'export const C = () => <><Icon name="logo" /><Icon name="logo" /><Icon name="star" /></>;',
        '',
      ].join('\n'),
    );
  });

  it('does not touch a local that shadows the import', () => {
    const result = migrate(
      [
        "import Logo from './logo.svg';",
        '',
        'export const D = () => <Logo />;',
        'export const E = ({ Logo }: { Logo: () => null }) => <Logo />;',
        '',
      ].join('\n'),
    );
    expect(result.output).toContain(
      'export const D = () => <Icon name="logo" />;',
    );
    expect(result.output).toContain(
      'export const E = ({ Logo }: { Logo: () => null }) => <Logo />;',
    );
  });

  it('leaves files without svg imports and plain URL imports alone', () => {
    expect(migrate("import a from './a';\nexport const x = a;\n").output).toBe(
      undefined,
    );
    const url = migrate(
      "import logo from './logo.svg';\nexport const F = () => <img src={logo} />;\n",
    );
    expect(url).toEqual({
      file: 'app/page.tsx',
      output: undefined,
      changes: [],
      skipped: [],
    });
    expect(
      migrate(
        "import logo from './logo.svg?url';\nexport const G = () => <logo />;\n",
      ).output,
    ).toBe(undefined);
  });
});

describe('migrateSvgr: unconvertible imports', () => {
  const reasons = (content: string) =>
    migrate(content).skipped.map(({ line, binding, reason }) => ({
      line,
      binding,
      reason,
    }));

  it('lists a ref, children, an SVGR-only prop and fill, and leaves the file untouched', () => {
    const content = [
      "import Logo from './logo.svg';",
      "import { ReactComponent as Star } from '@/icons/star.svg';",
      "import Arrow from './icons/arrow-left.svg';",
      "import Brand from './logo.svg?react';",
      '',
      'export const H = ({ r }) => (',
      '  <>',
      '    <Logo ref={r} />',
      '    <Star><title>Star</title></Star>',
      '    <Arrow titleId="a" />',
      '    <Brand fill="red" />',
      '  </>',
      ');',
      '',
    ].join('\n');
    const result = migrate(content);
    expect(result.output).toBe(undefined);
    expect(reasons(content)).toEqual([
      {
        line: 8,
        binding: 'Logo',
        reason: 'passes a ref; the svgworm Icon takes no ref',
      },
      {
        line: 9,
        binding: 'Star',
        reason: 'passes children; the svgworm Icon renders none',
      },
      { line: 10, binding: 'Arrow', reason: 'sets titleId, an SVGR-only prop' },
      {
        line: 11,
        binding: 'Brand',
        reason:
          'sets fill, which SVGR applies to the inline paths; color a sprite icon with color or CSS (currentColor)',
      },
    ]);
  });

  it('lists a component also used as a value, and one used only as a value', () => {
    expect(
      reasons(
        [
          "import Logo from './logo.svg';",
          "import { ReactComponent as Star } from '@/icons/star.svg';",
          '',
          'export const I = () => <Logo />;',
          'export const icons = [Logo];',
          'export const J = styled(Star);',
          '',
        ].join('\n'),
      ),
    ).toEqual([
      {
        line: 1,
        binding: 'Logo',
        reason:
          'is also used as a value on line 5, not only as a JSX tag; rewrite it by hand with <Icon name="logo" />',
      },
      {
        line: 6,
        binding: 'Star',
        reason:
          'is used as a value, not as a JSX tag; rewrite it by hand with <Icon name="star" />',
      },
    ]);
  });

  it('lists an svg outside the sources and converts the rest', () => {
    const result = migrate(
      [
        "import Logo from './logo.svg';",
        "import Other from '../elsewhere/other.svg';",
        '',
        'export const K = () => <><Logo /><Other /></>;',
        '',
      ].join('\n'),
    );
    expect(result.output).toBe(
      [
        "import { Icon } from '../components/icon';",
        "import Other from '../elsewhere/other.svg';",
        '',
        'export const K = () => <><Icon name="logo" /><Other /></>;',
        '',
      ].join('\n'),
    );
    expect(result.skipped).toEqual([
      {
        file: 'app/page.tsx',
        line: 2,
        specifier: '../elsewhere/other.svg',
        binding: 'Other',
        reason: 'is outside the configured sources',
      },
    ]);
  });

  it('converts nothing when the file already defines another Icon', () => {
    const result = migrate(
      [
        "import { Icon } from 'some-icon-lib';",
        "import Logo from './logo.svg';",
        '',
        'export const L = () => <><Icon /><Logo /></>;',
        '',
      ].join('\n'),
    );
    expect(result.output).toBe(undefined);
    expect(result.skipped.map(({ reason }) => reason)).toEqual([
      'this file already declares Icon (line 1); rename it, then run again',
    ]);
  });

  it.each([
    [
      'a type-only Icon import',
      "import type { Icon } from '../components/icon';",
      1,
    ],
    ['a type named Icon', 'type Icon = string;', 1],
    ['a nested Icon', 'export const M = ({ Icon }) => <Icon />;', 1],
  ])('converts nothing when the file declares %s', (_label, line, at) => {
    const result = migrate(
      [
        line,
        "import Logo from './logo.svg';",
        'export const N = () => <Logo />;',
        '',
      ].join('\n'),
    );
    expect(result.output).toBe(undefined);
    expect(result.skipped.map(({ reason }) => reason)).toEqual([
      `this file already declares Icon (line ${String(at)}); rename it, then run again`,
    ]);
  });

  it('lists a binding used as a shorthand property or exported, and keeps its import', () => {
    const result = migrate(
      [
        "import Logo from './logo.svg?react';",
        "import Star from '@/icons/star.svg?react';",
        '',
        'export const map = { Logo };',
        'export { Star };',
        'export const O = () => <><Logo /><Star /></>;',
        '',
      ].join('\n'),
    );
    expect(result.output).toBe(undefined);
    expect(
      result.skipped.map(({ line, binding }) => ({ line, binding })),
    ).toEqual([
      { line: 1, binding: 'Logo' },
      { line: 2, binding: 'Star' },
    ]);
  });

  it('lists a re-export of an svg component', () => {
    const result = migrate(
      [
        "export { default as Logo } from './logo.svg?react';",
        "export { ReactComponent as Star } from '@/icons/star.svg';",
        "export { default as logoUrl } from './logo.svg?url';",
        '',
      ].join('\n'),
    );
    expect(result.output).toBe(undefined);
    expect(result.skipped).toEqual([
      {
        file: 'app/page.tsx',
        line: 1,
        specifier: './logo.svg?react',
        binding: 'Logo',
        reason:
          'is re-exported; import it where it is used, or rewrite the export by hand with <Icon name="logo" />',
      },
      {
        file: 'app/page.tsx',
        line: 2,
        specifier: '@/icons/star.svg',
        binding: 'Star',
        reason:
          'is re-exported; import it where it is used, or rewrite the export by hand with <Icon name="star" />',
      },
    ]);
  });
});

describe('migrateSvgr: existing imports and line endings', () => {
  it('reuses an Icon import written with an alias', () => {
    const result = migrate(
      [
        "import { Icon } from '@/components/icon';",
        "import Logo from './logo.svg';",
        'export const P = () => <><Icon name="star" /><Logo /></>;',
        '',
      ].join('\n'),
    );
    expect(result.output).toBe(
      [
        "import { Icon } from '@/components/icon';",
        'export const P = () => <><Icon name="star" /><Icon name="logo" /></>;',
        '',
      ].join('\n'),
    );
  });

  it('keeps CRLF line endings when it inserts the Icon import', () => {
    const result = migrate(
      [
        "import logoUrl, { ReactComponent as Logo } from './logo.svg';",
        'export const Q = () => <><img src={logoUrl} /><Logo /></>;',
        '',
      ].join('\r\n'),
    );
    expect(result.output).toBe(
      [
        "import logoUrl from './logo.svg';",
        "import { Icon } from '../components/icon';",
        'export const Q = () => <><img src={logoUrl} /><Icon name="logo" /></>;',
        '',
      ].join('\r\n'),
    );
  });
});
