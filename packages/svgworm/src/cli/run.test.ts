import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CliIo } from './io.ts';

import { ExitCode } from './exit-codes.ts';
import { run } from './run.ts';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-cli-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

const put = async (relative: string, content = svg): Promise<void> => {
  const path = join(root, relative);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
};

const exists = (relative: string): Promise<boolean> =>
  stat(join(root, relative)).then(
    () => true,
    () => false,
  );

const exec = async (
  argv: readonly string[],
  signal?: AbortSignal,
  cwd = root,
) => {
  let stdout = '';
  let stderr = '';
  const io: CliIo = {
    stdout: { write: (text) => (stdout += text) },
    stderr: { write: (text) => (stderr += text) },
    env: {},
    isTTY: false,
    cwd,
    ...(signal === undefined ? {} : { signal }),
  };
  const code = await run(argv, io);
  return { code, stdout, stderr };
};

describe('run: exit codes', () => {
  it('exits 0 and writes the output', async () => {
    await put('icons/home.svg');
    const { code, stderr } = await exec(['--source', 'icons']);
    expect(code).toBe(ExitCode.OK);
    expect(stderr).toBe('');
    expect(await exists('svgworm/manifest.json')).toBe(true);
  });

  it('exits 0 for --help and --version', async () => {
    expect((await exec(['--help'])).stdout).toContain('Exit codes:');
    expect((await exec(['--version'])).stdout).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('exits 1 on an invalid SVG and writes nothing (R-04)', async () => {
    await put('icons/home.svg');
    await put('icons/broken.svg', '<svg');
    const { code, stdout, stderr } = await exec(['--source', 'icons']);
    expect(code).toBe(ExitCode.FAILED);
    expect(stderr).toContain('svg/not-svg-root');
    expect(stderr).toContain('icons/broken.svg');
    expect(stdout).not.toContain('build done');
    expect(await exists('public')).toBe(false);
    expect(await exists('svgworm')).toBe(false);
  });

  it('exits 1 on a name collision and lists both files', async () => {
    await put('icons/arrow_left.svg');
    await put('icons/arrow-left.svg');
    const { code, stderr } = await exec(['--source', 'icons']);
    expect(code).toBe(ExitCode.FAILED);
    expect(stderr).toContain('icons/arrow-left.svg, icons/arrow_left.svg');
  });

  it('exits 1 on an unexpected I/O failure', async () => {
    await put('icons/home.svg');
    await put('svgworm', 'a file where the module folder should go');
    const { code, stderr } = await exec(['--source', 'icons']);
    expect(code).toBe(ExitCode.FAILED);
    expect(stderr).toContain('unexpected failure');
  });

  it('exits 2 when there are no icons', async () => {
    await mkdir(join(root, 'icons'));
    const { code, stderr } = await exec(['--source', 'icons']);
    expect(code).toBe(ExitCode.USAGE);
    expect(stderr).toContain('build/no-icons');
    expect(await exists('svgworm')).toBe(false);
  });

  it.each([
    ['an unknown flag', ['--bogus']],
    ['an unknown command', ['deploy']],
    ['a missing source folder', ['--source', 'missing']],
    ['no sources at all', []],
    [
      '--out-dir without --public-path',
      ['--source', 'icons', '--out-dir', 'x'],
    ],
    ['a relative publicPath', ['--source', 'icons', '--public-path', 'icons']],
    [
      'a remote publicPath',
      ['--source', 'icons', '--public-path', 'https://cdn.example.com/icons'],
    ],
    ['a missing --config file', ['--config', 'nope.json', '--source', 'icons']],
  ])('exits 2 for %s', async (_label, argv) => {
    await put('icons/home.svg');
    const { code, stdout, stderr } = await exec(argv);
    expect(code).toBe(ExitCode.USAGE);
    expect(stdout).toBe('');
    expect(stderr).toContain('svgworm:');
    expect(await exists('svgworm')).toBe(false);
  });

  it('exits 2 for a config file that is not valid', async () => {
    await put('icons/home.svg');
    await put(
      'svgworm.config.json',
      '{ "sources": ["icons"], "flatten": "yes" }',
    );
    const { code, stderr } = await exec([]);
    expect(code).toBe(ExitCode.USAGE);
    expect(stderr).toContain('flatten');
  });
});

describe('run: config file and flags', () => {
  it('reads svgworm.config.json from the working directory', async () => {
    await put('icons/home.svg');
    await put(
      'svgworm.config.json',
      '{ "sources": ["icons"], "moduleDir": "gen" }',
    );
    expect((await exec([])).code).toBe(ExitCode.OK);
    expect(await exists('gen/manifest.json')).toBe(true);
  });

  it('lets flags override the config file', async () => {
    await put('icons/a/close.svg');
    await put('icons/b/close.svg');
    await put(
      'svgworm.config.json',
      '{ "sources": ["icons"], "flatten": true }',
    );
    expect((await exec([])).code).toBe(ExitCode.FAILED);
    expect((await exec(['--no-flatten'])).code).toBe(ExitCode.OK);
  });

  it('removes stale sprites on a rebuild', async () => {
    await put('icons/home.svg');
    await exec(['--source', 'icons']);
    await put('icons/more.svg', svg.replace('M0 0', 'M1 1'));
    const { stdout } = await exec(['--source', 'icons']);
    expect(stdout).toContain('remove public/icons/icons.');
    expect(await readdir(join(root, 'public/icons'))).toHaveLength(1);
  });
});

describe('run: sources with include and exclude', () => {
  it('builds only the icons an object source selects', async () => {
    await put('node_modules/pkg/icons/house.svg');
    await put('node_modules/pkg/icons/menu.svg', svg.replace('M0 0', 'M1 1'));
    await put('node_modules/pkg/icons/draft.svg', svg.replace('M0 0', 'M2 2'));
    await put(
      'svgworm.config.json',
      JSON.stringify({
        sources: [
          {
            dir: 'node_modules/pkg/icons',
            include: ['*.svg'],
            exclude: ['draft.svg'],
          },
        ],
      }),
    );
    const { code } = await exec([]);
    expect(code).toBe(ExitCode.OK);
    const manifest = JSON.parse(
      await readFile(join(root, 'svgworm/manifest.json'), 'utf8'),
    ) as { icons: Record<string, unknown> };
    expect(Object.keys(manifest.icons)).toEqual(['house', 'menu']);
  });
});

describe('run: check (R-31)', () => {
  it('exits 1 with a diff summary when the output is stale, and writes nothing', async () => {
    await put('icons/home.svg');
    const { code, stdout, stderr } = await exec(['check', '--source', 'icons']);
    expect(code).toBe(ExitCode.FAILED);
    expect(stdout).toContain('check svgworm/manifest.json missing');
    expect(stderr).toContain('output is stale (4 file(s)); icons added: home');
    expect(stderr).toContain('Run "svgworm build"');
    expect(await exists('svgworm')).toBe(false);
  });

  it('exits 0 when the output is up to date', async () => {
    await put('icons/home.svg');
    await exec(['--source', 'icons']);
    const { code, stdout, stderr } = await exec(['check', '--source', 'icons']);
    expect(code).toBe(ExitCode.OK);
    expect(stderr).toBe('');
    expect(stdout).toContain('svgworm: output is up to date (4 file(s))');
  });

  it('exits 1 on invalid input like build', async () => {
    await put('icons/broken.svg', '<svg');
    const { code, stderr } = await exec(['check', '--source', 'icons']);
    expect(code).toBe(ExitCode.FAILED);
    expect(stderr).toContain('svg/not-svg-root');
  });

  it('exits 2 for a config error like build', async () => {
    const { code } = await exec(['check', '--source', 'missing']);
    expect(code).toBe(ExitCode.USAGE);
  });

  it('with --json prints one document whose ok mirrors the exit code', async () => {
    await put('icons/home.svg');
    const stale = await exec(['check', '--source', 'icons', '--json']);
    expect(stale.code).toBe(ExitCode.FAILED);
    expect(JSON.parse(stale.stdout)).toMatchObject({
      ok: false,
      upToDate: false,
      iconDiff: { added: ['home'], removed: [] },
      errors: [],
    });
    await exec(['--source', 'icons']);
    const fresh = await exec(['check', '--source', 'icons', '--json']);
    expect(fresh.code).toBe(ExitCode.OK);
    expect(JSON.parse(fresh.stdout)).toMatchObject({
      ok: true,
      upToDate: true,
      differences: [],
      stale: [],
    });
  });
});

describe('run: watch (R-30)', () => {
  it('builds, reports that it is watching, and exits 0 when aborted', async () => {
    await put('icons/home.svg');
    const controller = new AbortController();
    const pending = exec(['watch', '--source', 'icons'], controller.signal);
    await vi.waitFor(async () => {
      expect(await exists('svgworm/manifest.json')).toBe(true);
    });
    controller.abort();
    const { code, stdout } = await pending;
    expect(code).toBe(ExitCode.OK);
    expect(stdout).toContain('svgworm: build done');
    expect(stdout).toContain('svgworm: watching icons for changes');
  });

  it('exits 2 at once for a config error', async () => {
    const { code } = await exec(['watch', '--source', 'missing']);
    expect(code).toBe(ExitCode.USAGE);
  });
});

describe('run: init (R-56)', () => {
  const readJson = async (relative: string) =>
    JSON.parse(await readFile(join(root, relative), 'utf8')) as Record<
      string,
      unknown
    >;

  it('completes with flags and no TTY, writing config, scripts and the Icon wiring', async () => {
    await put(
      'package.json',
      JSON.stringify(
        {
          name: 'app',
          scripts: { dev: 'next dev', build: 'next build' },
          dependencies: { next: '16.4.0', react: '19.3.0' },
        },
        null,
        2,
      ) + '\n',
    );
    await mkdir(join(root, 'src/app'), { recursive: true });
    const { code, stdout, stderr } = await exec([
      'init',
      '--source',
      'assets/icons',
      '--agents-md',
    ]);
    expect(code).toBe(ExitCode.OK);
    expect(stderr).toBe('');
    expect(stdout).toContain('init svgworm.config.json created');
    expect(stdout).toContain('init package.json updated');
    expect(stdout).toContain('init src/components/icon.tsx created');
    expect(stdout).toContain('init AGENTS.md created');
    expect(stdout).toContain('Next steps:');
    expect(await readJson('svgworm.config.json')).toEqual({
      $schema: 'https://unpkg.com/svgworm/svgworm.schema.json',
      sources: ['assets/icons'],
    });
    expect((await readJson('package.json'))['scripts']).toEqual({
      dev: 'next dev',
      build: 'next build',
      predev: 'svgworm',
      prebuild: 'svgworm',
    });
    expect(
      await readFile(join(root, 'src/components/icon.tsx'), 'utf8'),
    ).toContain("from '../../svgworm/icons.js'");
    expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toContain(
      '<!-- svgworm:start -->',
    );
  });

  it('runs svgworm inside dev and build on Yarn 2+, and warns about a script it cannot reach', async () => {
    await put(
      'package.json',
      '{ "name": "app", "packageManager": "yarn@4.9.0", "scripts": { "build": "next build" } }\n',
    );
    const { code, stdout, stderr } = await exec(['init']);
    expect(code).toBe(ExitCode.OK);
    expect(stdout).toContain('init package.json updated');
    expect(stderr).toContain(
      'warning package.json: Yarn 2+ does not run predev or prebuild, and there is no "dev" script',
    );
    expect((await readJson('package.json'))['scripts']).toEqual({
      build: 'svgworm && next build',
    });

    const json = await exec(['init', '--json']);
    const document = JSON.parse(json.stdout) as {
      actions: { path: string; status: string; warning?: string }[];
    };
    const action = document.actions.find(
      (item) => item.path === 'package.json',
    );
    expect(action?.status).toBe('unchanged');
    expect(action?.warning).toContain('there is no "dev" script');
  });

  it('is idempotent: a second run changes nothing', async () => {
    await put(
      'package.json',
      '{ "name": "app", "dependencies": { "react": "19.3.0" } }\n',
    );
    await exec(['init', '--agents-md']);
    const before = {
      config: await readFile(join(root, 'svgworm.config.json'), 'utf8'),
      pkg: await readFile(join(root, 'package.json'), 'utf8'),
      icon: await readFile(join(root, 'components/icon.tsx'), 'utf8'),
      agents: await readFile(join(root, 'AGENTS.md'), 'utf8'),
    };
    const { code, stdout } = await exec(['init', '--agents-md']);
    expect(code).toBe(ExitCode.OK);
    expect(stdout.match(/ unchanged$/gm)).toHaveLength(4);
    expect(await readFile(join(root, 'svgworm.config.json'), 'utf8')).toBe(
      before.config,
    );
    expect(await readFile(join(root, 'package.json'), 'utf8')).toBe(before.pkg);
    expect(await readFile(join(root, 'components/icon.tsx'), 'utf8')).toBe(
      before.icon,
    );
    expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toBe(before.agents);
  });

  it('leaves a project that builds before the user has any icon', async () => {
    await put(
      'package.json',
      '{ "name": "app", "dependencies": { "react": "19.3.0" } }\n',
    );
    const first = await exec(['init']);
    expect(first.code).toBe(ExitCode.OK);
    expect(first.stdout).toContain('init icons/svgworm.svg created');
    expect(first.stdout).toContain('init build 1 icon(s)');
    expect(await exists('svgworm/icons.js')).toBe(true);
    expect(await exists('svgworm/icons.d.ts')).toBe(true);
    // What the predev and prebuild hooks run.
    expect((await exec([])).code).toBe(ExitCode.OK);
    expect((await exec(['check'])).code).toBe(ExitCode.OK);

    const output = await readdir(join(root, 'svgworm'));
    const second = await exec(['init']);
    expect(second.code).toBe(ExitCode.OK);
    expect(second.stdout).not.toContain('icons/svgworm.svg');
    expect(await readdir(join(root, 'svgworm'))).toEqual(output);
  });

  it('adds no sample to a folder that has icons, and builds them', async () => {
    await put('icons/nested/home.svg');
    const { code, stdout } = await exec(['init']);
    expect(code).toBe(ExitCode.OK);
    expect(stdout).not.toContain('svgworm.svg');
    expect(await exists('icons/svgworm.svg')).toBe(false);
    expect(await readFile(join(root, 'svgworm/icons.d.ts'), 'utf8')).toContain(
      '"nested/home"',
    );
  });

  it('exits 1 with the errors when the first build fails, keeping what it wrote', async () => {
    await put('icons/broken.svg', '<svg');
    const plain = await exec(['init']);
    expect(plain.code).toBe(ExitCode.FAILED);
    expect(plain.stdout).toContain('init svgworm.config.json created');
    expect(plain.stderr).toContain('icons/broken.svg');
    expect(plain.stderr).toContain(
      'svgworm: init done, but the first build failed',
    );
    expect(await exists('svgworm/icons.js')).toBe(false);

    const json = await exec(['init', '--json']);
    expect(json.code).toBe(ExitCode.FAILED);
    expect(JSON.parse(json.stdout)).toMatchObject({
      ok: false,
      build: { ok: false },
      errors: [{ file: 'icons/broken.svg' }],
    });
  });

  it('never overwrites a file with different content', async () => {
    await put('svgworm.config.json', '{ "sources": ["svg"] }\n');
    await put('svg/home.svg');
    const { code, stdout } = await exec(['init']);
    expect(code).toBe(ExitCode.OK);
    expect(stdout).toContain(
      'init svgworm.config.json skipped (exists with different content',
    );
    expect(await readFile(join(root, 'svgworm.config.json'), 'utf8')).toBe(
      '{ "sources": ["svg"] }\n',
    );
  });

  it('with --json prints one document and no prompt', async () => {
    const { code, stdout, stderr } = await exec([
      'init',
      '--json',
      '--no-scripts',
    ]);
    expect(code).toBe(ExitCode.OK);
    expect(stderr).toBe('');
    const document = JSON.parse(stdout) as {
      ok: boolean;
      actions: { path: string; status: string }[];
      build: unknown;
      nextSteps: string[];
    };
    expect(document.ok).toBe(true);
    expect(
      document.actions.map((action) => [action.path, action.status]),
    ).toEqual([
      ['svgworm.config.json', 'created'],
      ['icons/svgworm.svg', 'created'],
      ['components/icon.tsx', 'skipped'],
    ]);
    expect(document.build).toMatchObject({ ok: true, icons: 1 });
    expect(document.nextSteps.length).toBeGreaterThan(0);
  });

  it('refuses to run from a subfolder of a package and names the package root', async () => {
    await put('package.json', '{ "name": "app" }\n');
    await mkdir(join(root, 'src/app'), { recursive: true });
    const { code, stderr } = await exec(
      ['init', '--yes'],
      undefined,
      join(root, 'src/app'),
    );
    expect(code).toBe(ExitCode.USAGE);
    expect(stderr).toContain(`no package.json in ${join(root, 'src/app')}`);
    expect(stderr).toContain(`found one in ${root}`);
    expect(await exists('src/app/svgworm.config.json')).toBe(false);
  });

  it('rejects init-only flags on other commands', async () => {
    await put('icons/home.svg');
    const { code, stderr } = await exec([
      'build',
      '--source',
      'icons',
      '--yes',
    ]);
    expect(code).toBe(ExitCode.USAGE);
    expect(stderr).toContain('--yes only applies to "svgworm init"');
    expect(await exists('svgworm')).toBe(false);
  });

  it('refuses paths outside the project and configs the next build would reject, writing nothing', async () => {
    const escape = await exec([
      'init',
      '--component',
      '--component-file',
      '../outside/icon.tsx',
    ]);
    expect(escape.code).toBe(ExitCode.USAGE);
    expect(escape.stderr).toContain('--component-file');
    expect(await exists('../outside/icon.tsx')).toBe(false);
    expect(await exists('svgworm.config.json')).toBe(false);

    const invalid = await exec(['init', '--out-dir', 'static/icons']);
    expect(invalid.code).toBe(ExitCode.USAGE);
    expect(invalid.stderr).toContain('outDir');
    expect(await exists('svgworm.config.json')).toBe(false);
  });

  it('skips the wiring without React unless --component is given', async () => {
    await put('package.json', '{ "name": "api" }\n');
    const skipped = await exec(['init']);
    expect(skipped.stdout).toContain(
      'init components/icon.tsx skipped (no react, next or astro dependency',
    );
    const forced = await exec([
      'init',
      '--component',
      '--component-file',
      'ui/icon.tsx',
    ]);
    expect(forced.stdout).toContain('init ui/icon.tsx created');
    expect(await exists('ui/icon.tsx')).toBe(true);
  });
  describe('with Astro', () => {
    const astroPackage = JSON.stringify({
      name: 'site',
      dependencies: { astro: '7.0.0' },
    });

    it('writes Icon.astro and reports the detected framework in plain and --json output', async () => {
      await put('package.json', astroPackage);
      const plain = await exec(['init']);
      expect(plain.code).toBe(ExitCode.OK);
      expect(plain.stdout).toContain('init components/Icon.astro created');
      expect(plain.stdout).toContain('init framework astro (detected)');
      expect(await exists('components/Icon.astro')).toBe(true);

      const json = await exec(['init', '--json']);
      expect(JSON.parse(json.stdout)).toMatchObject({
        ok: true,
        framework: 'astro',
        frameworkSource: 'detected',
      });
    });

    it('lets --framework override detection and reports it as a flag', async () => {
      await put(
        'package.json',
        JSON.stringify({ dependencies: { astro: '7.0.0', react: '19.3.0' } }),
      );
      const { code, stdout } = await exec(['init', '--framework', 'react']);
      expect(code).toBe(ExitCode.OK);
      expect(stdout).toContain('init framework react (flag)');
      expect(await exists('components/icon.tsx')).toBe(true);
      expect(await exists('components/Icon.astro')).toBe(false);
    });

    it.each([
      [
        ['--framework', 'astro', '--component-file', 'ui/icon.tsx'],
        'ui/icon.tsx',
      ],
      [
        ['--framework', 'react', '--component-file', 'ui/Icon.astro'],
        'ui/Icon.astro',
      ],
    ])(
      'exits 2 and writes nothing for a mismatched component file %j',
      async (flags, file) => {
        await put('package.json', astroPackage);
        const { code, stderr } = await exec(['init', ...flags]);
        expect(code).toBe(ExitCode.USAGE);
        expect(stderr).toContain(file);
        expect(await exists('svgworm.config.json')).toBe(false);
      },
    );
  });
});

describe('run: crossOrigin inject (ADR-0027)', () => {
  const cdn = [
    '--source',
    'icons',
    '--out-dir',
    'public/icons',
    '--public-path',
    'https://cdn.example.com/icons',
  ];

  it('exits 2 for an https publicPath without --cross-origin inject, naming the key', async () => {
    await put('icons/home.svg');
    const { code, stderr } = await exec(cdn);
    expect(code).toBe(ExitCode.USAGE);
    expect(stderr).toContain('"crossOrigin": "inject"');
  });

  it('writes the loader and a version 2 manifest', async () => {
    await put('icons/home.svg');
    const { code, stdout } = await exec([
      ...cdn,
      '--cross-origin',
      'inject',
      '--json',
    ]);
    expect(code).toBe(ExitCode.OK);
    expect(JSON.parse(stdout)).toMatchObject({ ok: true });
    expect(
      (await readdir(join(root, 'public/icons'))).some((name) =>
        /^icons\.loader\.[0-9a-f]{8}\.js$/.test(name),
      ),
    ).toBe(true);
    const manifest = await readFile(
      join(root, 'svgworm/manifest.json'),
      'utf8',
    );
    expect(manifest).toContain('"crossOrigin": "inject"');
    const check = await exec(['check', ...cdn, '--cross-origin', 'inject']);
    expect(check.code).toBe(ExitCode.OK);
  });

  it('writes crossOrigin and the CDN url from init --cdn-url', async () => {
    await put(
      'package.json',
      JSON.stringify({ dependencies: { react: '19.3.0' } }),
    );
    const { code } = await exec([
      'init',
      '--yes',
      '--cdn-url',
      'https://cdn.example.com/icons',
    ]);
    expect(code).toBe(ExitCode.OK);
    const config = JSON.parse(
      await readFile(join(root, 'svgworm.config.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(config).toMatchObject({
      publicPath: 'https://cdn.example.com/icons',
      crossOrigin: 'inject',
    });
    expect(await readFile(join(root, 'components/icon.tsx'), 'utf8')).toContain(
      'createSpriteLoader',
    );
  });
});
