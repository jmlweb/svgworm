import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CliIo } from './io.ts';

import { runMigrateCommand } from './commands/migrate.ts';
import { ExitCode } from './exit-codes.ts';
import { createPlainReporter } from './reporters/plain.ts';
import { run } from './run.ts';

const snapshots = './__snapshots__/';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-migrate-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
const animated =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"><animate attributeName="r" values="8;10;8" dur="1s" repeatCount="indefinite"/></circle></svg>';

const put = async (relative: string, content: string): Promise<void> => {
  const path = join(root, relative);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
};

const read = (relative: string): Promise<string> =>
  readFile(join(root, relative), 'utf8');

const PAGE = [
  "import Link from 'next/link';",
  "import Logo from '../icons/logo.svg';",
  "import ArrowLeft from '@/icons/arrows/left.svg';",
  '',
  'export default function Page() {',
  '  return (',
  '    <Link href="/">',
  '      <Logo className="h-6 w-6" aria-label="Home" />',
  '      <ArrowLeft></ArrowLeft>',
  '    </Link>',
  '  );',
  '}',
  '',
].join('\n');

const HEADER = [
  "import { ReactComponent as BrandLogo } from '../icons/logo.svg';",
  '',
  'export const Header = (props) => <header><BrandLogo {...props} /></header>;',
  '',
].join('\n');

const LEFTOVERS = [
  "import { useRef } from 'react';",
  "import Spinner from '../icons/spinner.svg';",
  "import Legacy from '../../assets/legacy.svg';",
  "import Logo from '../icons/logo.svg';",
  '',
  'export const Loading = () => {',
  '  const ref = useRef(null);',
  '  return (',
  '    <>',
  '      <Spinner />',
  '      <Legacy />',
  '      <Logo ref={ref} />',
  '    </>',
  '  );',
  '};',
  '',
].join('\n');

/** A Next.js-style app on SVGR: default, named ReactComponent and `@/` alias imports. */
const setUpProject = async (
  { withLeftovers }: { readonly withLeftovers: boolean } = {
    withLeftovers: true,
  },
): Promise<void> => {
  await put('package.json', '{ "name": "app", "private": true }\n');
  await put(
    'tsconfig.json',
    '{ "compilerOptions": { "jsx": "preserve", "paths": { "@/*": ["./src/*"] } } }\n',
  );
  await put('svgworm.config.json', '{ "sources": ["src/icons"] }\n');
  await put(
    'src/components/icon.tsx',
    'export const Icon = (props: { name: string }) => null;\n',
  );
  await put('src/icons/logo.svg', svg);
  await put('src/icons/arrows/left.svg', svg);
  await put('src/app/page.tsx', PAGE);
  await put('src/app/header.jsx', HEADER);
  // Not scanned: build output and dependencies.
  await put('node_modules/pkg/index.jsx', HEADER);
  await put('.next/server/page.js', PAGE);
  if (withLeftovers) {
    await put('src/icons/spinner.svg', animated);
    await put('assets/legacy.svg', svg);
    await put('src/app/loading.tsx', LEFTOVERS);
  }
};

const io = (): CliIo & { out: () => string; err: () => string } => {
  let stdout = '';
  let stderr = '';
  return {
    stdout: { write: (text) => (stdout += text) },
    stderr: { write: (text) => (stderr += text) },
    env: {},
    isTTY: false,
    cwd: root,
    out: () => stdout,
    err: () => stderr,
  };
};

const exec = async (argv: readonly string[]) => {
  const host = io();
  const code = await run(argv, host);
  return { code, stdout: host.out(), stderr: host.err() };
};

describe('migrate svgr: dry run', () => {
  it('lists the rewrites and the imports left, changes nothing and exits 1', async () => {
    await setUpProject();
    const { code, stdout, stderr } = await exec(['migrate', 'svgr']);
    expect(code).toBe(ExitCode.FAILED);
    await expect(stdout).toMatchFileSnapshot(`${snapshots}plain-migrate.txt`);
    await expect(stderr).toMatchFileSnapshot(
      `${snapshots}plain-migrate.stderr.txt`,
    );
    expect(await read('src/app/page.tsx')).toBe(PAGE);
    expect(await read('src/app/loading.tsx')).toBe(LEFTOVERS);
  });

  it('with --json prints one document whose ok mirrors the exit code', async () => {
    await setUpProject();
    const { code, stdout } = await exec(['migrate', 'svgr', '--json']);
    expect(code).toBe(ExitCode.FAILED);
    expect(JSON.parse(stdout)).toMatchObject({ ok: false, write: false });
    await expect(stdout).toMatchFileSnapshot(`${snapshots}json-migrate.json`);
  });

  it('exits 0 when every import converts', async () => {
    await setUpProject({ withLeftovers: false });
    const { code, stdout, stderr } = await exec(['migrate', 'svgr']);
    expect(code).toBe(ExitCode.OK);
    expect(stderr).toBe('');
    expect(stdout).toContain(
      'svgworm: migrate svgr: 3 use(s) in 2 file(s) would be rewritten. Run again with --write to apply',
    );
  });

  it('lists an import of an icon that does not build', async () => {
    await setUpProject({ withLeftovers: false });
    await put('src/icons/broken.svg', '<svg');
    await put(
      'src/app/broken.tsx',
      "import Broken from '../icons/broken.svg';\nexport const B = () => <Broken />;\n",
    );
    const { code, stderr } = await exec(['migrate', 'svgr']);
    expect(code).toBe(ExitCode.FAILED);
    expect(stderr).toMatch(
      /^skip src\/app\/broken\.tsx:1 Broken from "\.\.\/icons\/broken\.svg" is not a valid icon: /m,
    );
  });

  it('exits 0 and says so when there is nothing to migrate', async () => {
    await put('svgworm.config.json', '{ "sources": ["icons"] }\n');
    await put('icons/home.svg', svg);
    await put('components/icon.tsx', 'export const Icon = () => null;\n');
    const { code, stdout } = await exec(['migrate', 'svgr']);
    expect(code).toBe(ExitCode.OK);
    expect(stdout).toBe('svgworm: migrate svgr: no SVGR imports found\n');
  });
});

describe('migrate svgr --write', () => {
  it('rewrites the convertible files and leaves the rest untouched', async () => {
    await setUpProject();
    const { code, stderr } = await exec(['migrate', 'svgr', '--write']);
    expect(code).toBe(ExitCode.FAILED);
    expect(stderr).toContain(
      'svgworm: migrate svgr: rewrote 3 use(s) in 2 file(s)',
    );
    await expect(await read('src/app/page.tsx')).toMatchFileSnapshot(
      `${snapshots}migrate-page.tsx.txt`,
    );
    expect(await read('src/app/header.jsx')).toBe(
      [
        "import { Icon } from '../components/icon';",
        '',
        'export const Header = (props) => <header><Icon name="logo" {...props} /></header>;',
        '',
      ].join('\n'),
    );
    expect(await read('src/app/loading.tsx')).toBe(LEFTOVERS);
    expect(await read('node_modules/pkg/index.jsx')).toBe(HEADER);
    expect(await read('.next/server/page.js')).toBe(PAGE);
  });

  it('is idempotent: a second run finds nothing left to convert', async () => {
    await setUpProject({ withLeftovers: false });
    expect((await exec(['migrate', 'svgr', '--write'])).code).toBe(ExitCode.OK);
    const again = await exec(['migrate', 'svgr', '--write']);
    expect(again.code).toBe(ExitCode.OK);
    expect(again.stdout).toBe('svgworm: migrate svgr: no SVGR imports found\n');
  });

  it('scans nested build-like folders, reuses an aliased Icon import and skips root output', async () => {
    await setUpProject({ withLeftovers: false });
    await put(
      'src/build/steps.tsx',
      [
        "import { Icon } from '@/components/icon';",
        "import Logo from '@/icons/logo.svg';",
        'export const Steps = () => <><Icon name="logo" /><Logo /></>;',
        '',
      ].join('\n'),
    );
    await put('dist/page.js', PAGE);
    const { code } = await exec(['migrate', 'svgr', '--write']);
    expect(code).toBe(ExitCode.OK);
    expect(await read('src/build/steps.tsx')).toBe(
      [
        "import { Icon } from '@/components/icon';",
        'export const Steps = () => <><Icon name="logo" /><Icon name="logo" /></>;',
        '',
      ].join('\n'),
    );
    expect(await read('dist/page.js')).toBe(PAGE);
  });

  it('takes an absolute --component-file', async () => {
    await setUpProject({ withLeftovers: false });
    const { code } = await exec([
      'migrate',
      'svgr',
      '--write',
      '--component-file',
      join(root, 'src/components/icon.tsx'),
    ]);
    expect(code).toBe(ExitCode.OK);
    expect(await read('src/app/header.jsx')).toContain(
      "import { Icon } from '../components/icon';",
    );
  });

  it('imports the Icon from --component-file', async () => {
    await setUpProject({ withLeftovers: false });
    await put('src/ui/svg-icon.tsx', 'export const Icon = () => null;\n');
    const { code } = await exec([
      'migrate',
      'svgr',
      '--write',
      '--component-file',
      'src/ui/svg-icon.tsx',
    ]);
    expect(code).toBe(ExitCode.OK);
    expect(await read('src/app/header.jsx')).toContain(
      "import { Icon } from '../ui/svg-icon';",
    );
  });
});

describe('migrate svgr: usage errors', () => {
  it('exits 2 when there is no Icon component', async () => {
    await put('svgworm.config.json', '{ "sources": ["icons"] }\n');
    await put('icons/home.svg', svg);
    const { code, stderr } = await exec(['migrate', 'svgr']);
    expect(code).toBe(ExitCode.USAGE);
    expect(stderr).toContain(
      'run svgworm init first, or pass --component-file',
    );
  });

  it('exits 2 without TypeScript 5 or 6 and says how to run it', async () => {
    await setUpProject();
    const host = io();
    const code = await runMigrateCommand(
      { cwd: root, configFile: undefined, overrides: {} },
      { isWrite: false, componentFile: undefined },
      createPlainReporter(host),
      () => Promise.resolve(undefined),
    );
    expect(code).toBe(ExitCode.USAGE);
    expect(host.err()).toContain(
      'npx -p typescript@6 -p svgworm svgworm migrate svgr',
    );
  });

  it('exits 2 for a missing or unknown target and for --write on another command', async () => {
    expect((await exec(['migrate'])).stderr).toContain(
      'migrate needs a source to migrate from: svgworm migrate svgr',
    );
    expect((await exec(['migrate', 'svgo'])).code).toBe(ExitCode.USAGE);
    const misplaced = await exec(['build', '--write']);
    expect(misplaced.code).toBe(ExitCode.USAGE);
    expect(misplaced.stderr).toContain(
      '--write only applies to "svgworm migrate"',
    );
  });
});

describe('migrate svgr --write: a file that cannot be written', () => {
  it.skipIf(process.platform === 'win32' || process.getuid?.() === 0)(
    'writes the others, lists the failure and exits 1',
    async () => {
      await setUpProject({ withLeftovers: false });
      await chmod(join(root, 'src/app/header.jsx'), 0o444);
      const { code, stdout, stderr } = await exec([
        'migrate',
        'svgr',
        '--write',
        '--json',
      ]);
      expect(code).toBe(ExitCode.FAILED);
      const document: unknown = JSON.parse(stdout);
      expect(document).toMatchObject({
        ok: false,
        files: [{ file: 'src/app/page.tsx' }],
        errors: [{ code: 'cli/unexpected', file: 'src/app/header.jsx' }],
      });
      expect(stderr).toContain(
        'error src/app/header.jsx: could not write the rewrite, the file is unchanged:',
      );
      expect(await read('src/app/header.jsx')).toBe(HEADER);
      expect(await read('src/app/page.tsx')).toContain('<Icon name="logo"');
    },
  );
});
