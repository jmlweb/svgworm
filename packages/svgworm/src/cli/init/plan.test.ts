import { describe, expect, it } from 'vitest';

import {
  defaultInitOptions,
  InitStatus,
  PackageManager,
  planInit,
  validateInitOptions,
  type ProjectFacts,
} from './plan.ts';

const facts = (overrides: Partial<ProjectFacts> = {}): ProjectFacts => ({
  hasPackageJson: overrides.packageJson !== undefined,
  packageJson: undefined,
  usesReact: false,
  hasSrcFolder: false,
  packageManager: PackageManager.NPM,
  existing: {},
  ...overrides,
});

const pkg = (value: Record<string, unknown>, indent = '  ') => {
  const text = `${JSON.stringify(value, null, indent)}\n`;
  return {
    text,
    value,
    indent,
    newline: '\n' as const,
    hasTrailingNewline: true,
  };
};

const statusOf = (plan: ReturnType<typeof planInit>, path: string) =>
  plan.actions.find((action) => action.path === path);

describe('planInit', () => {
  it('creates the config with the schema and sources, and nothing else without package.json', () => {
    const plan = planInit(defaultInitOptions(), facts());
    expect(statusOf(plan, 'svgworm.config.json')).toMatchObject({
      status: InitStatus.CREATED,
      content: `{\n  "$schema": "https://unpkg.com/svgworm/svgworm.schema.json",\n  "sources": [\n    "icons"\n  ]\n}\n`,
    });
    expect(statusOf(plan, 'package.json')).toMatchObject({
      status: InitStatus.SKIPPED,
      reason: 'no package.json in this folder',
    });
    expect(statusOf(plan, 'components/icon.tsx')).toMatchObject({
      status: InitStatus.SKIPPED,
    });
    expect(plan.nextSteps[0]).toBe('Install: npm install -D svgworm');
  });

  it('writes only the given config keys', () => {
    const plan = planInit(
      {
        ...defaultInitOptions(),
        sources: ['assets/icons'],
        outDir: 'public/sprites',
        publicPath: '/docs/sprites',
        flatten: true,
      },
      facts(),
    );
    expect(
      JSON.parse(statusOf(plan, 'svgworm.config.json')?.content ?? ''),
    ).toEqual({
      $schema: 'https://unpkg.com/svgworm/svgworm.schema.json',
      sources: ['assets/icons'],
      outDir: 'public/sprites',
      publicPath: '/docs/sprites',
      flatten: true,
    });
  });

  it('adds predev and prebuild, chaining svgworm before existing scripts', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({
        packageJson: pkg({
          name: 'app',
          scripts: { dev: 'next dev', prebuild: 'tsc --noEmit' },
        }),
      }),
    );
    const action = statusOf(plan, 'package.json');
    expect(action?.status).toBe(InitStatus.UPDATED);
    expect(JSON.parse(action?.content ?? '')).toEqual({
      name: 'app',
      scripts: {
        dev: 'next dev',
        prebuild: 'svgworm && tsc --noEmit',
        predev: 'svgworm',
      },
    });
  });

  it('keeps package.json indentation and leaves scripts that already run svgworm', () => {
    const existing = pkg(
      {
        name: 'app',
        scripts: { predev: 'svgworm', prebuild: 'svgworm --json' },
      },
      '\t',
    );
    const plan = planInit(
      defaultInitOptions(),
      facts({ packageJson: existing }),
    );
    expect(statusOf(plan, 'package.json')?.status).toBe(InitStatus.UNCHANGED);

    const tabbed = planInit(
      defaultInitOptions(),
      facts({ packageJson: pkg({ name: 'app' }, '\t') }),
    );
    expect(statusOf(tabbed, 'package.json')?.content).toContain(
      '\n\t"scripts"',
    );
  });

  it('keeps CRLF line endings and remembers the text it planned against', () => {
    const value = { name: 'app', scripts: { dev: 'next dev' } };
    const text = `${JSON.stringify(value, null, 2)}\n`.replaceAll('\n', '\r\n');
    const plan = planInit(
      defaultInitOptions(),
      facts({
        packageJson: {
          text,
          value,
          indent: '  ',
          newline: '\r\n',
          hasTrailingNewline: true,
        },
      }),
    );
    const action = statusOf(plan, 'package.json');
    expect(action?.previous).toBe(text);
    expect(action?.content).toMatch(/^\{\r\n {2}"name"/);
    expect(action?.content?.endsWith('}\r\n')).toBe(true);
    expect(action?.content).not.toMatch(/[^\r]\n/);
  });

  it('does not mistake svgworm-like names for a script that already runs svgworm', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({
        packageJson: pkg({
          scripts: { predev: 'svgworm-icons', prebuild: 'my-svgworm-wrapper' },
        }),
      }),
    );
    expect(
      (
        JSON.parse(statusOf(plan, 'package.json')?.content ?? '') as {
          scripts: Record<string, string>;
        }
      ).scripts,
    ).toEqual({
      predev: 'svgworm && svgworm-icons',
      prebuild: 'svgworm && my-svgworm-wrapper',
    });
  });

  it('passes a custom config file to the scripts, the next steps and AGENTS.md', () => {
    const plan = planInit(
      {
        ...defaultInitOptions(),
        configFile: 'config/svgworm.json',
        addAgentsMd: true,
      },
      facts({ packageJson: pkg({ name: 'app' }) }),
    );
    expect(
      (
        JSON.parse(statusOf(plan, 'package.json')?.content ?? '') as {
          scripts: Record<string, string>;
        }
      ).scripts,
    ).toEqual({
      predev: 'svgworm --config config/svgworm.json',
      prebuild: 'svgworm --config config/svgworm.json',
    });
    expect(plan.nextSteps.at(-1)).toBe(
      'In CI, run: npx svgworm check --config config/svgworm.json',
    );
    expect(statusOf(plan, 'AGENTS.md')?.content).toContain(
      '`svgworm --config config/svgworm.json`',
    );
  });

  it('leaves AGENTS.md alone when a marker is unpaired', () => {
    const plan = planInit(
      { ...defaultInitOptions(), addAgentsMd: true },
      facts({ existing: { 'AGENTS.md': '# x\n<!-- svgworm:end -->\n' } }),
    );
    expect(statusOf(plan, 'AGENTS.md')).toMatchObject({
      status: InitStatus.SKIPPED,
      reason: expect.stringContaining('unpaired') as string,
    });
  });

  it('writes the Icon wiring for a React project, under src/ when it exists', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ usesReact: true, hasSrcFolder: true }),
    );
    const action = statusOf(plan, 'src/components/icon.tsx');
    expect(action?.status).toBe(InitStatus.CREATED);
    expect(action?.content).toContain(
      "import { manifest } from '../../svgworm/icons.js';",
    );
    expect(action?.content).toContain(
      'export const Icon = createIcon(manifest);',
    );
    expect(action?.content).not.toMatch(/use client|useState/);
  });

  it('honors --component-file and a custom moduleDir in the import path', () => {
    const plan = planInit(
      {
        ...defaultInitOptions(),
        addComponent: true,
        componentFile: 'app/ui/icon.tsx',
        moduleDir: 'generated/icons',
      },
      facts(),
    );
    expect(statusOf(plan, 'app/ui/icon.tsx')?.content).toContain(
      "from '../../generated/icons/icons.js'",
    );
  });

  it('does not overwrite a different existing file, and reports an identical one as unchanged', () => {
    const first = planInit(defaultInitOptions(), facts({ usesReact: true }));
    const component = statusOf(first, 'components/icon.tsx')?.content ?? '';
    const second = planInit(
      defaultInitOptions(),
      facts({
        usesReact: true,
        existing: {
          'svgworm.config.json':
            '{"sources":["icons"],"$schema":"https://unpkg.com/svgworm/svgworm.schema.json"}',
          'components/icon.tsx': component,
        },
      }),
    );
    expect(statusOf(second, 'svgworm.config.json')?.status).toBe(
      InitStatus.UNCHANGED,
    );
    expect(statusOf(second, 'components/icon.tsx')?.status).toBe(
      InitStatus.UNCHANGED,
    );
    const third = planInit(
      defaultInitOptions(),
      facts({
        usesReact: true,
        existing: {
          'svgworm.config.json': '{"sources":["svg"]}',
          'components/icon.tsx': 'export const Icon = () => null;',
        },
      }),
    );
    expect(statusOf(third, 'svgworm.config.json')).toMatchObject({
      status: InitStatus.SKIPPED,
    });
    expect(statusOf(third, 'components/icon.tsx')).toMatchObject({
      status: InitStatus.SKIPPED,
    });
  });

  it('creates, appends to, updates and leaves AGENTS.md through its markers', () => {
    const options = { ...defaultInitOptions(), addAgentsMd: true };
    const created = statusOf(planInit(options, facts()), 'AGENTS.md');
    expect(created?.status).toBe(InitStatus.CREATED);
    expect(created?.content).toMatch(/^# AGENTS\.md\n\n<!-- svgworm:start -->/);

    const appended = statusOf(
      planInit(
        options,
        facts({ existing: { 'AGENTS.md': '# My app\n\nRules.\n' } }),
      ),
      'AGENTS.md',
    );
    expect(appended?.status).toBe(InitStatus.UPDATED);
    expect(
      appended?.content?.startsWith(
        '# My app\n\nRules.\n\n<!-- svgworm:start -->',
      ),
    ).toBe(true);

    const same = statusOf(
      planInit(
        options,
        facts({ existing: { 'AGENTS.md': appended?.content ?? '' } }),
      ),
      'AGENTS.md',
    );
    expect(same?.status).toBe(InitStatus.UNCHANGED);

    const updated = statusOf(
      planInit(
        { ...options, sources: ['svg'] },
        facts({ existing: { 'AGENTS.md': appended?.content ?? '' } }),
      ),
      'AGENTS.md',
    );
    expect(updated?.status).toBe(InitStatus.UPDATED);
    expect(updated?.content).toContain('`svg`');
    expect(updated?.content).not.toContain('`icons`');
    expect(updated?.content?.match(/svgworm:start/g)).toHaveLength(1);
  });

  it('reports a package.json with a blank line after the brace with a two-space indent', () => {
    // `\s+` would have captured the blank line as part of the indent and corrupted the file.
    const text = '{\n\n  "name": "app"\n}\n';
    const plan = planInit(
      defaultInitOptions(),
      facts({
        packageJson: {
          text,
          value: { name: 'app' },
          indent: '  ',
          newline: '\n',
          hasTrailingNewline: true,
        },
      }),
    );
    expect(statusOf(plan, 'package.json')?.content).toContain('\n  "scripts"');
  });

  it('tailors next steps to the package manager and installed packages', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({
        usesReact: true,
        packageManager: PackageManager.PNPM,
        packageJson: pkg({
          name: 'app',
          dependencies: { react: '19.3.0' },
          devDependencies: { svgworm: '0.1.0' },
        }),
      }),
    );
    expect(plan.nextSteps).toEqual([
      'Install: pnpm add @svgworm/react',
      'Put SVG files in icons/ and run: pnpm svgworm',
      'Import { Icon } from components/icon in a Server Component and render <Icon name="…" />',
      'In CI, run: pnpm svgworm check',
    ]);
  });
});

describe('validateInitOptions', () => {
  const cwd = '/proj';

  it('accepts the defaults and ordinary relative paths', () => {
    expect(validateInitOptions(defaultInitOptions(), cwd)).toEqual([]);
    expect(
      validateInitOptions(
        {
          ...defaultInitOptions(),
          sources: ['assets/icons', 'brand'],
          outDir: 'public/sprites',
          publicPath: '/sprites',
          moduleDir: 'src/generated',
          componentFile: 'src/ui/icon.tsx',
          configFile: 'config/svgworm.json',
        },
        cwd,
      ),
    ).toEqual([]);
  });

  it.each([
    [{ componentFile: '../victim/icon.tsx' }, '--component-file', 'inside'],
    [{ configFile: '/etc/svgworm.json' }, '--config', 'relative'],
    [{ moduleDir: '.' }, '--module-dir', 'inside'],
    [
      { outDir: 'public/x', publicPath: '/x', sources: ['../shared'] },
      '--source',
      'inside',
    ],
    [{ sources: ["ic'ons"] }, '--source', 'quotes'],
    [{ moduleDir: 'a`b' }, '--module-dir', 'quotes'],
  ])('rejects %j', (overrides, flag, word) => {
    const issues = validateInitOptions(
      { ...defaultInitOptions(), ...overrides },
      cwd,
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain(flag);
    expect(issues[0]).toContain(word);
  });

  it('rejects options that would write a config the next build refuses', () => {
    const issues = validateInitOptions(
      { ...defaultInitOptions(), outDir: 'static/icons' },
      cwd,
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('the config would be invalid: outDir');
    expect(
      validateInitOptions(
        { ...defaultInitOptions(), sources: ['icons', 'icons/brand'] },
        cwd,
      )[0],
    ).toContain('overlap');
  });
});
