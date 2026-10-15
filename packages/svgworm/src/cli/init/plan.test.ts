import { describe, expect, it } from 'vitest';

import {
  defaultInitOptions,
  Framework,
  frameworkProblem,
  FrameworkSource,
  InitStatus,
  PackageManager,
  planInit,
  validateInitOptions,
  type ProjectFacts,
} from './plan.ts';
import { SAMPLE_ICON_SVG } from './sample-icon.ts';

const facts = (overrides: Partial<ProjectFacts> = {}): ProjectFacts => ({
  hasPackageJson: overrides.packageJson !== undefined,
  packageJson: undefined,
  usesReact: false,
  usesAstro: false,
  hasSrcFolder: false,
  packageManager: PackageManager.NPM,
  existing: {},
  sourcesHaveIcons: true,
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

describe('planInit: Astro', () => {
  const astroPkg = pkg({
    name: 'site',
    dependencies: { astro: '^7.0.0' },
    scripts: { build: 'astro build' },
  });

  it('writes Icon.astro for an astro dependency, under src/ when it exists', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ usesAstro: true, hasSrcFolder: true, packageJson: astroPkg }),
    );
    expect(plan.framework).toBe(Framework.ASTRO);
    expect(plan.frameworkSource).toBe(FrameworkSource.DETECTED);
    const action = statusOf(plan, 'src/components/Icon.astro');
    expect(action?.status).toBe(InitStatus.CREATED);
    expect(action?.content).toContain(
      "import { manifest } from '../../svgworm/icons.js';",
    );
    expect(action?.content).toContain(
      "import type { IconName } from '../../svgworm/icons.js';",
    );
    expect(action?.content).toContain('name: IconName');
    expect(action?.content).not.toMatch(/import .*react|client:|<script/i);
  });

  it('mirrors the createIcon contract: version check, unknown name, a11y defaults', () => {
    const content =
      statusOf(
        planInit(defaultInitOptions(), facts({ usesAstro: true })),
        'components/Icon.astro',
      )?.content ?? '';
    expect(content).toContain('!== 1');
    expect(content).toContain('Object.hasOwn(');
    expect(content).toContain('Unknown icon');
    expect(content).toContain("'1em'");
    expect(content).toContain('focusable="false"');
    expect(content).toContain("'aria-hidden': true");
    expect(content).toContain("delivery === 'img'");
    expect(content).toContain("delivery === 'mask'");
    // A bare number is pixels in the mask style, as in React (found by the site conformance test).
    expect(content).toContain('px');
  });

  it('adds predev and prebuild scripts and never overwrites a different Icon.astro', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({
        usesAstro: true,
        packageJson: astroPkg,
        existing: { 'components/Icon.astro': '<svg />' },
      }),
    );
    expect(statusOf(plan, 'package.json')?.status).toBe(InitStatus.UPDATED);
    expect(statusOf(plan, 'components/Icon.astro')?.status).toBe(
      InitStatus.SKIPPED,
    );
  });

  it('names the Astro import and the base hint in the next steps, and installs no React adapter', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ usesAstro: true, hasSrcFolder: true }),
    );
    const steps = plan.nextSteps.join('\n');
    expect(steps).toContain('src/components/Icon.astro');
    expect(steps).toContain('--public-path <base>/icons');
    expect(steps).not.toContain('@svgworm/react');
  });

  it('picks Astro when react and astro are both dependencies, and says it was detected', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ usesReact: true, usesAstro: true }),
    );
    expect(plan.framework).toBe(Framework.ASTRO);
    expect(plan.frameworkSource).toBe(FrameworkSource.DETECTED);
    expect(statusOf(plan, 'components/Icon.astro')?.status).toBe(
      InitStatus.CREATED,
    );
  });

  it('lets --framework react override detection', () => {
    const plan = planInit(
      { ...defaultInitOptions(), framework: Framework.REACT },
      facts({ usesReact: true, usesAstro: true }),
    );
    expect(plan.framework).toBe(Framework.REACT);
    expect(plan.frameworkSource).toBe(FrameworkSource.FLAG);
    expect(statusOf(plan, 'components/icon.tsx')?.status).toBe(
      InitStatus.CREATED,
    );
    expect(statusOf(plan, 'components/Icon.astro')).toBeUndefined();
  });

  it('reports the framework of a React project and none for a bare one', () => {
    const react = planInit(defaultInitOptions(), facts({ usesReact: true }));
    expect(react.framework).toBe(Framework.REACT);
    expect(react.frameworkSource).toBe(FrameworkSource.DETECTED);
    const bare = planInit(defaultInitOptions(), facts());
    expect(bare.framework).toBeUndefined();
    expect(bare.frameworkSource).toBeUndefined();
  });

  it('writes Astro wiring on --framework astro even without the dependency', () => {
    const plan = planInit(
      { ...defaultInitOptions(), framework: Framework.ASTRO },
      facts(),
    );
    expect(plan.frameworkSource).toBe(FrameworkSource.FLAG);
    expect(statusOf(plan, 'components/Icon.astro')?.status).toBe(
      InitStatus.CREATED,
    );
  });
});

describe('frameworkProblem', () => {
  it.each([
    [Framework.ASTRO, 'ui/icon.tsx'],
    [Framework.ASTRO, 'ui/icon.jsx'],
    [Framework.REACT, 'ui/Icon.astro'],
  ])('rejects --framework %s with --component-file %s', (framework, file) => {
    expect(
      frameworkProblem(
        { ...defaultInitOptions(), framework, componentFile: file },
        facts(),
      ),
    ).toContain(file);
  });

  it('checks the detected framework too', () => {
    expect(
      frameworkProblem(
        { ...defaultInitOptions(), componentFile: 'ui/icon.tsx' },
        facts({ usesAstro: true }),
      ),
    ).toContain('ui/icon.tsx');
  });

  it('accepts matching and absent files', () => {
    expect(
      frameworkProblem(
        { ...defaultInitOptions(), componentFile: 'ui/Icon.astro' },
        facts({ usesAstro: true }),
      ),
    ).toBeUndefined();
    expect(
      frameworkProblem(defaultInitOptions(), facts({ usesAstro: true })),
    ).toBeUndefined();
    expect(
      frameworkProblem(
        { ...defaultInitOptions(), componentFile: 'ui/anything.ts' },
        facts(),
      ),
    ).toBeUndefined();
  });
});

describe('planInit: sample icon', () => {
  it('adds a sample icon to the first source when no source has an SVG yet', () => {
    const plan = planInit(
      { ...defaultInitOptions(), sources: ['assets/icons/', 'brand'] },
      facts({ usesReact: true, sourcesHaveIcons: false }),
    );
    expect(statusOf(plan, 'assets/icons/svgworm.svg')).toMatchObject({
      status: InitStatus.CREATED,
      content: SAMPLE_ICON_SVG,
    });
    expect(plan.nextSteps).toContain(
      'Replace the sample assets/icons/svgworm.svg with your own SVG files; svgworm runs before dev and build (or run: npx svgworm)',
    );
    expect(plan.nextSteps.join('\n')).toContain('<Icon name="svgworm" />');
  });

  it('adds no sample when a source already has an SVG', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ usesReact: true, sourcesHaveIcons: true }),
    );
    expect(statusOf(plan, 'icons/svgworm.svg')).toBeUndefined();
    expect(plan.nextSteps.join('\n')).toContain('<Icon name="…" />');
  });

  it('adds no sample when the existing config differs, since it may point elsewhere', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({
        sourcesHaveIcons: false,
        existing: { 'svgworm.config.json': '{ "sources": ["svg"] }\n' },
      }),
    );
    expect(statusOf(plan, 'svgworm.config.json')?.status).toBe(
      InitStatus.SKIPPED,
    );
    expect(statusOf(plan, 'icons/svgworm.svg')).toBeUndefined();
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
