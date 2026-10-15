import { describe, expect, it } from 'vitest';

import { parseCliArgs } from './args.ts';

describe('parseCliArgs', () => {
  it('builds by default with no overrides', () => {
    expect(parseCliArgs([])).toEqual({
      kind: 'command',
      command: 'build',
      configFile: undefined,
      overrides: {},
      isJson: false,
      isVerbose: false,
    });
  });

  it('takes --verbose for build, check and watch', () => {
    expect(parseCliArgs(['--verbose'])).toMatchObject({ isVerbose: true });
    expect(parseCliArgs(['check', '--verbose'])).toMatchObject({
      isVerbose: true,
    });
  });

  it.each(['build', 'check', 'watch'] as const)(
    'accepts the %s command with the same flags',
    (command) => {
      expect(parseCliArgs([command, '--source', 'a'])).toMatchObject({
        kind: 'command',
        command,
        overrides: { sources: ['a'] },
      });
    },
  );

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
      kind: 'command',
      command: 'build',
      configFile: 'my.json',
      isJson: true,
      isVerbose: false,
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

  it('suggests the closest flag for an unknown one', () => {
    expect(parseCliArgs(['--sources', 'icons'])).toMatchObject({
      kind: 'usage-error',
      message: 'unknown flag "--sources". Did you mean "--source"?',
    });
    expect(parseCliArgs(['--bogus'])).toMatchObject({
      message: 'unknown flag "--bogus"',
    });
  });

  it('remembers --json on a usage error so the reporter can honor it', () => {
    expect(parseCliArgs(['--json', '--bogus'])).toMatchObject({
      kind: 'usage-error',
      isJson: true,
    });
  });

  it('parses --framework for init and rejects unknown values', () => {
    expect(parseCliArgs(['init', '--framework', 'astro'])).toMatchObject({
      kind: 'init',
      options: { framework: 'astro' },
    });
    expect(parseCliArgs(['init'])).toMatchObject({
      options: { framework: undefined },
    });
    expect(parseCliArgs(['init', '--framework', 'vue'])).toMatchObject({
      kind: 'usage-error',
      message: expect.stringContaining('--framework') as string,
    });
  });

  it('rejects --framework on other commands', () => {
    expect(parseCliArgs(['build', '--framework', 'astro'])).toMatchObject({
      kind: 'usage-error',
      message: '--framework only applies to "svgworm init"',
    });
  });
});
