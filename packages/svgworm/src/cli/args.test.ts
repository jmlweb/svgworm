import { describe, expect, it } from 'vitest';

import { parseCliArgs } from './args.ts';

describe('parseCliArgs', () => {
  it('builds by default with no overrides', () => {
    expect(parseCliArgs([])).toEqual({
      kind: 'build',
      configFile: undefined,
      overrides: {},
      isJson: false,
    });
  });

  it('accepts the build command', () => {
    expect(parseCliArgs(['build']).kind).toBe('build');
  });

  it('maps every flag to a config override', () => {
    expect(
      parseCliArgs([
        '--config',
        'my.json',
        '--source',
        'a',
        '--source',
        'b',
        '--out-dir',
        'static',
        '--public-path',
        '/static',
        '--module-dir',
        'gen',
        '--flatten',
        '--json',
      ]),
    ).toEqual({
      kind: 'build',
      configFile: 'my.json',
      isJson: true,
      overrides: {
        sources: ['a', 'b'],
        outDir: 'static',
        publicPath: '/static',
        moduleDir: 'gen',
        flatten: true,
      },
    });
  });

  it('lets --no-flatten turn flatten off', () => {
    expect(parseCliArgs(['--no-flatten'])).toMatchObject({
      overrides: { flatten: false },
    });
  });

  it.each([
    [['--help'], 'help'],
    [['-h'], 'help'],
    [['--version'], 'version'],
    [['-v'], 'version'],
  ] as const)('%j is %s', (argv, kind) => {
    expect(parseCliArgs(argv).kind).toBe(kind);
  });

  it('puts help before everything else', () => {
    expect(parseCliArgs(['--bogus', '--help']).kind).toBe('usage-error');
    expect(parseCliArgs(['--json', '--help']).kind).toBe('help');
  });

  it.each([
    [['--bogus']],
    [['--source']],
    [['deploy']],
    [['build', 'extra']],
    [['--flatten=yes']],
  ])('rejects %j as a usage error', (argv) => {
    expect(parseCliArgs(argv).kind).toBe('usage-error');
  });

  it('remembers --json on a usage error so the reporter can honor it', () => {
    expect(parseCliArgs(['--json', '--bogus'])).toMatchObject({
      kind: 'usage-error',
      isJson: true,
    });
  });
});
