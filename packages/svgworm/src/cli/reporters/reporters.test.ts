import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CliIo } from '../io.ts';

import { run } from '../run.ts';

const sampleSource = new URL(
  '../../../../../docs/samples/output-contract-v0.1/source',
  import.meta.url,
).pathname;
const snapshots = new URL('../__snapshots__/', import.meta.url).pathname;

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
  it('prints one stable line per event, then the summary', async () => {
    const { stdout, stderr } = await exec(['--source', 'icons']);
    expect(stderr).toBe('');
    await expect(stable(stdout)).toMatchFileSnapshot(
      `${snapshots}plain-success.txt`,
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

  it('reports a usage error as a document too', async () => {
    const { code, stdout } = await exec(['--bogus', '--json']);
    expect(code).toBe(2);
    expect(JSON.parse(stdout)).toMatchObject({ ok: false });
  });
});
