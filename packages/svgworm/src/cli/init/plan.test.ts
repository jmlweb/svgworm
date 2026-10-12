import { describe, expect, it } from 'vitest';

import {
  defaultInitOptions,
  InitStatus,
  PackageManager,
  planInit,
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
  return { text, value, indent, hasTrailingNewline: true };
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
