import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { compile } from './compile.ts';
import { readSources } from './fixture-sources.test-helper.ts';

const sampleRoot = 'docs/samples/output-contract-v0.1';
const sampleUrl = new URL(`../../../../${sampleRoot}/`, import.meta.url);
const folders = { outDir: 'public-icons', moduleDir: 'svgworm' } as const;

describe('output contract sample', () => {
  const result = compile(readSources(`${sampleRoot}/source`), {
    flatten: false,
    publicPath: '/icons',
    color: [],
  });

  it('is reproduced byte for byte by the core', () => {
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    const produced = result.files.map(
      (file) => `${folders[file.target]}/${file.name}`,
    );
    const committed = Object.values(folders)
      .flatMap((folder) =>
        readdirSync(new URL(`${folder}/`, sampleUrl)).map(
          (name) => `${folder}/${name}`,
        ),
      )
      .toSorted();
    expect(produced.toSorted()).toEqual(committed);
    result.files.forEach((file) => {
      const expected = readFileSync(
        new URL(`${folders[file.target]}/${file.name}`, sampleUrl),
        'utf8',
      );
      expect(file.content).toBe(expected);
    });
  });
});
