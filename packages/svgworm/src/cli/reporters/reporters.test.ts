import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CliIo } from '../io.ts';

import { run } from '../run.ts';

const sampleSource = fileURLToPath(
  new URL(
    '../../../../../docs/samples/output-contract-v0.1/source',
    import.meta.url,
  ),
);
const snapshots = fileURLToPath(new URL('../__snapshots__/', import.meta.url));

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-report-'));
  await cp(sampleSource, join(root, 'icons'), { recursive: true });
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const exec = async (
  argv: readonly string[],
  env: Record<string, string> = {},
) => {
  let stdout = '';
  let stderr = '';
  const io: CliIo = {
    stdout: { write: (text) => (stdout += text) },
    stderr: { write: (text) => (stderr += text) },
    env,
    isTTY: false,
    cwd: root,
  };
  const code = await run(argv, io);
  return { code, stdout, stderr };
};

// Timing is the only run-to-run difference.
const stable = (text: string): string =>
  text
    .replace(/"durationMs": [\d.e+-]+/g, '"durationMs": 0')
    .replace(/^( {2}time {2,})\S+ \S+$/gm, '$1<time>');

describe('plain reporter', () => {
  it('prints the files written and the summary, not one line per icon', async () => {
    const { stdout, stderr } = await exec(['--source', 'icons']);
    expect(stderr).toBe('');
    expect(stdout).not.toMatch(/^icon /m);
    await expect(stable(stdout)).toMatchFileSnapshot(
      `${snapshots}plain-success.txt`,
    );
  });

  it('prints one line per icon with --verbose', async () => {
    const { stdout } = await exec(['--source', 'icons', '--verbose']);
    expect(stdout).toContain('icon home mono use');
    await expect(stable(stdout)).toMatchFileSnapshot(
      `${snapshots}plain-success-verbose.txt`,
    );
  });

  it('prints diagnostics to stderr and keeps stdout free of the summary', async () => {
    await writeFile(join(root, 'icons/broken.svg'), '<svg');
    const { stdout, stderr } = await exec(['--source', 'icons']);
    expect(stdout).not.toContain('build done');
    await expect(stderr).toMatchFileSnapshot(`${snapshots}plain-failure.txt`);
  });

  it('adds no ANSI codes unless FORCE_COLOR is set', async () => {
    const plain = await exec(['--source', 'icons']);
    expect(plain.stdout).not.toContain('\u001B[');
    await rm(join(root, 'svgworm'), { recursive: true });
    const forced = await exec(['--source', 'icons'], { FORCE_COLOR: '1' });
    expect(forced.stdout).toContain('\u001B[');
  });
});

describe('json reporter', () => {
  it('prints exactly one document on stdout', async () => {
    const { stdout, stderr } = await exec(['--source', 'icons', '--json']);
    expect(stderr).toBe('');
    expect((JSON.parse(stdout) as { ok: boolean }).ok).toBe(true);
    await expect(stable(stdout)).toMatchFileSnapshot(
      `${snapshots}json-success.json`,
    );
  });

  it('reports errors in the document and on stderr', async () => {
    await writeFile(join(root, 'icons/broken.svg'), '<svg');
    const { code, stdout, stderr } = await exec([
      '--source',
      'icons',
      '--json',
    ]);
    expect(code).toBe(1);
    expect(stderr).toContain('svg/not-svg-root');
    await expect(stable(stdout)).toMatchFileSnapshot(
      `${snapshots}json-failure.json`,
    );
  });

  it('reports a config error as a document too', async () => {
    await mkdir(join(root, 'empty'));
    const { code, stdout } = await exec(['--source', 'missing', '--json']);
    expect(code).toBe(2);
    const document = JSON.parse(stdout) as {
      ok: boolean;
      errors: { code: string }[];
    };
    expect(document.ok).toBe(false);
    expect(document.errors.map((error) => error.code)).toEqual(['cli/usage']);
  });

  it('reports a missing config as a document with a fix hint', async () => {
    await rm(join(root, 'icons'), { recursive: true });
    const { code, stdout } = await exec(['--json']);
    expect(code).toBe(2);
    await expect(stdout.replaceAll(root, '<cwd>')).toMatchFileSnapshot(
      `${snapshots}json-no-config.json`,
    );
  });

  it('reports a usage error as a document too', async () => {
    const { code, stdout } = await exec(['--bogus', '--json']);
    expect(code).toBe(2);
    expect(JSON.parse(stdout)).toMatchObject({ ok: false });
  });
});

describe('plain reporter: missing config', () => {
  it('says how to fix it instead of the raw validation issue', async () => {
    await rm(join(root, 'icons'), { recursive: true });
    const { code, stdout, stderr } = await exec([]);
    expect(code).toBe(2);
    expect(stdout).toBe('');
    await expect(stderr.replaceAll(root, '<cwd>')).toMatchFileSnapshot(
      `${snapshots}plain-no-config.txt`,
    );
  });
});

describe('check reporters', () => {
  it('plain: prints the verdict alone when up to date', async () => {
    await exec(['--source', 'icons']);
    const { code, stdout, stderr } = await exec(['check', '--source', 'icons']);
    expect(code).toBe(0);
    expect(stderr).toBe('');
    expect(stdout).toBe(
      'svgworm: reading 4 SVG file(s)\nsvgworm: output is up to date (5 file(s))\n',
    );
  });

  it('plain: lists stale files on stdout and the verdict on stderr', async () => {
    await exec(['--source', 'icons']);
    await rm(join(root, 'icons/home.svg'));
    await writeFile(
      join(root, 'icons/plus.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1h22v22H1z"/></svg>',
    );
    const { code, stdout, stderr } = await exec(['check', '--source', 'icons']);
    expect(code).toBe(1);
    await expect(stable(stdout)).toMatchFileSnapshot(
      `${snapshots}plain-check-stale.txt`,
    );
    await expect(stderr).toMatchFileSnapshot(
      `${snapshots}plain-check-stale.stderr.txt`,
    );
  });

  it('json: prints one document with the stale entries and the icon diff', async () => {
    await exec(['--source', 'icons']);
    await rm(join(root, 'icons/home.svg'));
    const { stdout } = await exec(['check', '--source', 'icons', '--json']);
    await expect(stable(stdout)).toMatchFileSnapshot(
      `${snapshots}json-check-stale.json`,
    );
  });
});

describe('init reporters', () => {
  // A fresh React app with no icons yet: the first run adds the sample and builds it.
  beforeEach(async () => {
    await rm(join(root, 'icons'), { recursive: true });
    await writeFile(
      join(root, 'package.json'),
      '{ "name": "app", "dependencies": { "react": "19.3.0" } }\n',
    );
  });

  it('plain: one line per file, the first build, then the next steps', async () => {
    const { code, stdout, stderr } = await exec(['init']);
    expect(code).toBe(0);
    expect(stderr).toBe('');
    await expect(stdout).toMatchFileSnapshot(`${snapshots}plain-init.txt`);
  });

  it('json: one document with the actions and the first build', async () => {
    const { code, stdout, stderr } = await exec(['init', '--json']);
    expect(code).toBe(0);
    expect(stderr).toBe('');
    await expect(stdout).toMatchFileSnapshot(`${snapshots}json-init.json`);
  });
});
