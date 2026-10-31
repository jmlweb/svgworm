import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  defaultInitOptions,
  detectedFrameworks,
  Framework,
  frameworkProblem,
  FrameworkSource,
  InitStatus,
  inspectProject,
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
  usesNext: false,
  usesAstro: false,
  usesVue: false,
  usesNuxt: false,
  usesSvelte: false,
  usesSvelteKit: false,
  hasSrcFolder: false,
  usesNuxtAppDir: false,
  usesNuxtIcon: false,
  packageManager: PackageManager.NPM,
  runsScriptHooks: true,
  existing: {},
  sourcesHaveIcons: true,
  packageJsonAbove: undefined,
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
      'Commit public/icons/ and svgworm/ and run in CI: npx svgworm check --config config/svgworm.json (or add both folders to .gitignore and rely on the scripts that run svgworm)',
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
      'Import { Icon } from components/icon in a component and render <Icon name="…" />',
      'Commit public/icons/ and svgworm/ and run in CI: pnpm svgworm check (or add both folders to .gitignore and rely on the scripts that run svgworm)',
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
    // RPT-006: like createIcon, the consumer svg gets only the viewBox size.
    expect(content).toContain('viewBox={viewBoxSize}');
    expect(content).not.toContain('viewBox={icon.viewBox}');
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
    expect(steps).toContain('"publicPath": "<base>/icons"');
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

describe('planInit: prompts and monorepos', () => {
  it('reports a framework chosen at a prompt as such, not as a flag', () => {
    const plan = planInit(
      {
        ...defaultInitOptions(),
        framework: Framework.REACT,
        frameworkSource: FrameworkSource.PROMPT,
      },
      facts({ usesReact: true, usesAstro: true }),
    );
    expect(plan.framework).toBe(Framework.REACT);
    expect(plan.frameworkSource).toBe(FrameworkSource.PROMPT);
  });

  it('never writes the sample icon into a source folder outside the project', () => {
    const plan = planInit(
      { ...defaultInitOptions(), sources: ['../shared/icons'] },
      facts({ sourcesHaveIcons: false }),
    );
    expect(plan.actions.map((action) => action.path)).not.toContainEqual(
      expect.stringContaining('svgworm.svg'),
    );
    expect(plan.nextSteps.join('\n')).toContain(
      'Put SVG files in ../shared/icons/',
    );
  });

  it('says Server Component only when next is a dependency', () => {
    const next = planInit(
      defaultInitOptions(),
      facts({ usesReact: true, usesNext: true }),
    );
    expect(next.nextSteps.join('\n')).toContain('in a Server Component');
    const vite = planInit(defaultInitOptions(), facts({ usesReact: true }));
    expect(vite.nextSteps.join('\n')).toContain('in a component and render');
    expect(vite.nextSteps.join('\n')).not.toContain('Server Component');
  });
});

describe('planInit: Vue and Svelte (ADR-0034)', () => {
  it('writes Icon.vue for a vue dependency, typed with IconName, with no React', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ usesVue: true, hasSrcFolder: true }),
    );
    expect(plan.framework).toBe(Framework.VUE);
    expect(plan.frameworkSource).toBe(FrameworkSource.DETECTED);
    const action = statusOf(plan, 'src/components/Icon.vue');
    expect(action?.status).toBe(InitStatus.CREATED);
    expect(action?.content).toContain(
      "import { manifest, type IconName } from '../../svgworm/icons.js';",
    );
    expect(action?.content).toContain('name: IconName;');
    expect(action?.content).toContain('<script setup lang="ts">');
    expect(action?.content).not.toMatch(/import .*react/i);
  });

  it('writes Icon.svelte for a svelte dependency, with Svelte 5 props', () => {
    const plan = planInit(defaultInitOptions(), facts({ usesSvelte: true }));
    expect(plan.framework).toBe(Framework.SVELTE);
    const action = statusOf(plan, 'components/Icon.svelte');
    expect(action?.status).toBe(InitStatus.CREATED);
    expect(action?.content).toContain(
      "import { manifest, type IconName } from '../svgworm/icons.js';",
    );
    expect(action?.content).toContain('$props()');
    expect(action?.content).toContain('name: IconName;');
  });

  it.each([
    ['vue', facts({ usesVue: true })],
    ['svelte', facts({ usesSvelte: true })],
  ])(
    '%s mirrors the createIcon contract: version check, unknown name, a11y defaults',
    (_label, projectFacts) => {
      const content =
        planInit(defaultInitOptions(), projectFacts).actions.at(-1)?.content ??
        '';
      expect(content).toContain('!== 1');
      expect(content).toContain('Object.hasOwn(');
      expect(content).toContain('Unknown icon');
      expect(content).toContain("'1em'");
      expect(content).toContain('focusable="false"');
      expect(content).toContain("'aria-hidden': true");
      expect(content).toContain("delivery === 'img'");
      expect(content).toContain("delivery === 'mask'");
      // RPT-006: like createIcon, the consumer svg gets only the viewBox size.
      expect(content).toContain('`0 0 ${');
      // A bare number is pixels in the mask style, as in React.
      expect(content).toContain('px');
    },
  );

  it('puts Icon.vue in app/components for Nuxt 4, where Nuxt auto-imports it', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ usesVue: true, usesNuxt: true, usesNuxtAppDir: true }),
    );
    expect(statusOf(plan, 'app/components/Icon.vue')?.status).toBe(
      InitStatus.CREATED,
    );
    expect(plan.nextSteps.join('\n')).toContain(
      'Nuxt auto-imports app/components/Icon.vue: render <Icon name="…" /> in any page or component',
    );
  });

  it('names it SvgIcon.vue when @nuxt/icon or Nuxt UI already registers <Icon>', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({
        usesVue: true,
        usesNuxt: true,
        usesNuxtAppDir: true,
        usesNuxtIcon: true,
      }),
    );
    expect(statusOf(plan, 'app/components/SvgIcon.vue')?.status).toBe(
      InitStatus.CREATED,
    );
    expect(plan.nextSteps.join('\n')).toContain(
      'Nuxt auto-imports app/components/SvgIcon.vue: render <SvgIcon name="…" /> in any page or component (<Icon> is taken by @nuxt/icon)',
    );
  });

  it('puts Icon.vue in components/ for Nuxt without an app/ folder', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ usesVue: true, usesNuxt: true, hasSrcFolder: true }),
    );
    expect(statusOf(plan, 'components/Icon.vue')?.status).toBe(
      InitStatus.CREATED,
    );
  });

  it('puts Icon.svelte in src/lib/components for SvelteKit and imports it through $lib', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ usesSvelte: true, usesSvelteKit: true, hasSrcFolder: true }),
    );
    const action = statusOf(plan, 'src/lib/components/Icon.svelte');
    expect(action?.status).toBe(InitStatus.CREATED);
    expect(action?.content).toContain(
      "import { manifest, type IconName } from '../../../svgworm/icons.js';",
    );
    expect(plan.nextSteps.join('\n')).toContain(
      `In a .svelte file, import Icon from '$lib/components/Icon.svelte' and render <Icon name="…" />`,
    );
  });

  it('writes the SvelteKit sprites to static/, which SvelteKit serves, not public/', () => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ usesSvelte: true, usesSvelteKit: true, hasSrcFolder: true }),
    );
    expect(
      JSON.parse(statusOf(plan, 'svgworm.config.json')?.content ?? '{}'),
    ).toMatchObject({ outDir: 'static/icons', publicPath: '/icons' });
    expect(plan.nextSteps.join('\n')).toContain('Commit static/icons/');
    const custom = planInit(
      {
        ...defaultInitOptions(),
        outDir: 'static/sprites',
        publicPath: '/sprites',
      },
      facts({ usesSvelte: true, usesSvelteKit: true }),
    );
    expect(
      JSON.parse(statusOf(custom, 'svgworm.config.json')?.content ?? '{}'),
    ).toMatchObject({ outDir: 'static/sprites', publicPath: '/sprites' });
  });

  it('names the import in the next steps and installs no React adapter', () => {
    const vue = planInit(
      defaultInitOptions(),
      facts({ usesVue: true, hasSrcFolder: true }),
    ).nextSteps.join('\n');
    expect(vue).toContain(
      'In a .vue file, import Icon from the path of src/components/Icon.vue and render <Icon name="…" />',
    );
    expect(vue).not.toContain('@svgworm/react');
    const svelte = planInit(
      defaultInitOptions(),
      facts({ usesSvelte: true }),
    ).nextSteps.join('\n');
    expect(svelte).toContain(
      'In a .svelte file, import Icon from the path of components/Icon.svelte and render <Icon name="…" />',
    );
    expect(svelte).not.toContain('@svgworm/react');
  });

  it.each([
    [facts({ usesAstro: true, usesVue: true }), Framework.ASTRO],
    [facts({ usesVue: true, usesSvelte: true }), Framework.VUE],
    [facts({ usesSvelte: true, usesReact: true }), Framework.SVELTE],
    [facts({ usesVue: true, usesReact: true }), Framework.VUE],
  ])(
    'picks by precedence when several are dependencies (%#)',
    (projectFacts, framework) => {
      const plan = planInit(defaultInitOptions(), projectFacts);
      expect(plan.framework).toBe(framework);
      expect(plan.frameworkSource).toBe(FrameworkSource.DETECTED);
    },
  );

  it('lists every detected framework in precedence order, for the prompt', () => {
    expect(
      detectedFrameworks(
        facts({
          usesReact: true,
          usesSvelte: true,
          usesVue: true,
          usesAstro: true,
        }),
      ),
    ).toEqual([
      Framework.ASTRO,
      Framework.VUE,
      Framework.SVELTE,
      Framework.REACT,
    ]);
    expect(detectedFrameworks(facts())).toEqual([]);
  });

  it('names every supported dependency when no framework is found', () => {
    expect(
      statusOf(planInit(defaultInitOptions(), facts()), 'components/icon.tsx')
        ?.reason,
    ).toBe(
      'no react, next, astro, vue, nuxt, svelte or @sveltejs/kit dependency found; pass --component to write it anyway',
    );
  });
});

describe('inspectProject: framework detection', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'svgworm-framework-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it.each([
    [{ vue: '^3.5.0' }, { usesVue: true, usesNuxt: false }],
    [{ nuxt: '^4.0.0' }, { usesVue: true, usesNuxt: true }],
    [{ svelte: '^5.0.0' }, { usesSvelte: true, usesSvelteKit: false }],
    [{ '@sveltejs/kit': '^3.0.0' }, { usesSvelte: true, usesSvelteKit: true }],
  ])('reads %o', async (dependencies, expected) => {
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ devDependencies: dependencies }),
    );
    expect(await inspectProject(root, defaultInitOptions())).toMatchObject(
      expected,
    );
  });

  // Nuxt 4 resolves components from app/ unless the project keeps the Nuxt 3 layout (a root
  // app.vue). Nuxt 3 uses app/ only for router.options.ts and the like.
  it.each([
    ['^4.6.2', ['app/app.vue'], true],
    ['latest', ['app/app.vue'], true],
    ['^4.6.2', [], false],
    ['^4.6.2', ['app/router.options.ts', 'app.vue'], false],
    ['^3.17.0', ['app/router.options.ts'], false],
  ])('nuxt %s with %j: srcDir app/ is %s', async (version, files, expected) => {
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ dependencies: { nuxt: version } }),
    );
    for (const file of files) {
      await mkdir(dirname(join(root, file)), { recursive: true });
      await writeFile(join(root, file), '');
    }
    expect(
      (await inspectProject(root, defaultInitOptions())).usesNuxtAppDir,
    ).toBe(expected);
  });

  it.each(['@nuxt/icon', '@nuxt/ui'])(
    'notices %s, which registers a global <Icon>',
    async (name) => {
      await writeFile(
        join(root, 'package.json'),
        JSON.stringify({ dependencies: { nuxt: '^4.6.2', [name]: '1.0.0' } }),
      );
      expect(
        (await inspectProject(root, defaultInitOptions())).usesNuxtIcon,
      ).toBe(true);
    },
  );
});

describe('frameworkProblem', () => {
  it.each([
    [Framework.ASTRO, 'ui/icon.tsx'],
    [Framework.ASTRO, 'ui/icon.jsx'],
    [Framework.REACT, 'ui/Icon.astro'],
    [Framework.REACT, 'ui/Icon.vue'],
    [Framework.VUE, 'ui/Icon.svelte'],
    [Framework.VUE, 'ui/icon.tsx'],
    [Framework.SVELTE, 'ui/Icon.vue'],
  ])('rejects --framework %s with --component-file %s', (framework, file) => {
    expect(
      frameworkProblem(
        { ...defaultInitOptions(), framework, componentFile: file },
        facts(),
      ),
    ).toContain(file);
  });

  // ADR-0036: every framework now gets a generated sprite loader.
  it.each([Framework.VUE, Framework.SVELTE])(
    'accepts --cdn-url for %s',
    (framework) => {
      expect(
        frameworkProblem(
          {
            ...defaultInitOptions(),
            framework,
            cdnUrl: 'https://cdn.example.com/icons',
          },
          facts(),
        ),
      ).toBeUndefined();
    },
  );

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
      facts({
        usesReact: true,
        sourcesHaveIcons: false,
        packageJson: pkg({ name: 'app' }),
      }),
    );
    expect(statusOf(plan, 'assets/icons/svgworm.svg')).toMatchObject({
      status: InitStatus.CREATED,
      content: SAMPLE_ICON_SVG,
    });
    expect(plan.nextSteps).toContain(
      'Replace the sample assets/icons/svgworm.svg with your own SVG files; svgworm runs before dev and build (or run: npx svgworm)',
    );
    // Without a package.json no script runs svgworm, so the step must not claim one does.
    expect(
      planInit(
        defaultInitOptions(),
        facts({ usesReact: true, sourcesHaveIcons: false }),
      ).nextSteps,
    ).toContain(
      'Replace the sample icons/svgworm.svg with your own SVG files and run: npx svgworm',
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
    [{ sources: ['/shared/icons'] }, '--source', 'relative'],
    [{ sources: ["ic'ons"] }, '--source', 'quotes'],
    [{ moduleDir: 'a`b' }, '--module-dir', 'quotes'],
    // Scripts and next steps interpolate the path into a shell line without quoting it.
    [{ configFile: 'my icons.json' }, '--config', 'spaces'],
    [{ sources: ['icons;rm'] }, '--source', 'shell'],
    [{ outDir: 'public/$x', publicPath: '/x' }, '--out-dir', 'shell'],
  ])('rejects %j', (overrides, flag, word) => {
    const issues = validateInitOptions(
      { ...defaultInitOptions(), ...overrides },
      cwd,
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain(flag);
    expect(issues[0]).toContain(word);
  });

  it('accepts a source folder outside the project, as build does (monorepos)', () => {
    expect(
      validateInitOptions(
        { ...defaultInitOptions(), sources: ['../../packages/icons/svg'] },
        cwd,
      ),
    ).toEqual([]);
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

const scriptsOf = (plan: ReturnType<typeof planInit>) =>
  (
    JSON.parse(statusOf(plan, 'package.json')?.content ?? '') as {
      scripts: Record<string, string>;
    }
  ).scripts;

describe('planInit: package.json scripts per package manager', () => {
  const app = {
    name: 'app',
    scripts: { dev: 'next dev', build: 'next build' },
  };

  it.each([
    ['npm', PackageManager.NPM],
    ['pnpm', PackageManager.PNPM],
    ['yarn 1', PackageManager.YARN],
  ])('runs svgworm from predev and prebuild with %s', (_, packageManager) => {
    const plan = planInit(
      defaultInitOptions(),
      facts({ packageJson: pkg(app), packageManager, runsScriptHooks: true }),
    );
    expect(scriptsOf(plan)).toEqual({
      ...app.scripts,
      predev: 'svgworm',
      prebuild: 'svgworm',
    });
    expect(statusOf(plan, 'package.json')?.warning).toBeUndefined();
  });

  const berry = (value: Record<string, unknown>) =>
    facts({
      sourcesHaveIcons: false,
      packageJson: pkg(value),
      packageManager: PackageManager.YARN,
      runsScriptHooks: false,
    });

  it('puts svgworm in front of dev and build with yarn 4, which skips pre scripts', () => {
    const plan = planInit(defaultInitOptions(), berry(app));
    const action = statusOf(plan, 'package.json');
    expect(action?.status).toBe(InitStatus.UPDATED);
    expect(action?.warning).toBeUndefined();
    expect(scriptsOf(plan)).toEqual({
      dev: 'svgworm && next dev',
      build: 'svgworm && next build',
    });
    expect(plan.nextSteps.join('\n')).toContain(
      'svgworm runs before dev and build',
    );
  });

  it('is idempotent with yarn 4, and fixes a project an earlier init gave pre scripts', () => {
    const first = planInit(defaultInitOptions(), berry(app));
    const again = planInit(
      defaultInitOptions(),
      berry({ ...app, scripts: scriptsOf(first) }),
    );
    expect(statusOf(again, 'package.json')?.status).toBe(InitStatus.UNCHANGED);

    const earlier = planInit(
      defaultInitOptions(),
      berry({
        ...app,
        scripts: { ...app.scripts, predev: 'svgworm', prebuild: 'svgworm' },
      }),
    );
    expect(scriptsOf(earlier)).toEqual({
      dev: 'svgworm && next dev',
      build: 'svgworm && next build',
      predev: 'svgworm',
      prebuild: 'svgworm',
    });
  });

  it('passes a custom config file to the yarn 4 scripts', () => {
    const plan = planInit(
      { ...defaultInitOptions(), configFile: 'config/icons.json' },
      berry(app),
    );
    expect(scriptsOf(plan)['build']).toBe(
      'svgworm --config config/icons.json && next build',
    );
  });

  it('warns with yarn 4 when a script is missing or cannot be prefixed safely', () => {
    const plan = planInit(
      { ...defaultInitOptions(), addAgentsMd: true },
      berry({
        name: 'app',
        scripts: { build: 'tsc || echo failed', start: 'node .' },
      }),
    );
    const action = statusOf(plan, 'package.json');
    expect(action?.status).toBe(InitStatus.UNCHANGED);
    expect(action?.warning).toBe(
      'Yarn 2+ does not run predev or prebuild, and there is no "dev" script and "build" uses ||, ; or & and cannot be prefixed safely: run `svgworm` before your dev server and build by hand',
    );
    expect(plan.nextSteps.join('\n')).not.toContain('runs before dev');
    expect(statusOf(plan, 'AGENTS.md')?.content).not.toContain('runs before');
  });

  it.each(['a; b', 'a & b', 'a\nb'])(
    'does not prefix "%s" with yarn 4',
    (build) => {
      const plan = planInit(
        defaultInitOptions(),
        berry({ scripts: { dev: 'vite', build } }),
      );
      expect(scriptsOf(plan)).toEqual({ dev: 'svgworm && vite', build });
      expect(statusOf(plan, 'package.json')?.warning).toContain('"build"');
    },
  );

  it('prefixes && chains, pipes and redirects with yarn 4', () => {
    const plan = planInit(
      defaultInitOptions(),
      berry({
        scripts: {
          dev: 'vite 2>&1 | tee log',
          build: 'tsc && vite build &>out',
        },
      }),
    );
    expect(scriptsOf(plan)).toEqual({
      dev: 'svgworm && vite 2>&1 | tee log',
      build: 'svgworm && tsc && vite build &>out',
    });
  });
});

describe('inspectProject: Yarn 2+ detection', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'svgworm-yarn-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  const put = async (path: string, content = '') => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  };

  const inspect = (dir = '') =>
    inspectProject(join(root, dir), defaultInitOptions());

  const BERRY_LOCK =
    '# This file is generated by running "yarn install" inside your project.\n# Manual changes might be lost - proceed with caution!\n\n__metadata:\n  version: 8\n  cacheKey: 10c0\n';
  const CLASSIC_LOCK =
    '# THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.\n# yarn lockfile v1\n';

  it.each([
    ['yarn@4.9.0', false],
    ['yarn@4.9.0+sha512.abc', false],
    ['yarn@1.22.22', true],
    ['pnpm@10.34.0', true],
  ])('reads packageManager %s', async (packageManager, runsScriptHooks) => {
    await put('package.json', JSON.stringify({ name: 'app', packageManager }));
    // The declared version wins over any file.
    await put('.yarnrc.yml', 'nodeLinker: pnp\n');
    expect((await inspect()).runsScriptHooks).toBe(runsScriptHooks);
  });

  it('reads .yarnrc.yml and the lockfile format', async () => {
    await put('package.json', '{ "name": "app" }');
    await put('yarn.lock', CLASSIC_LOCK);
    expect(await inspect()).toMatchObject({
      packageManager: PackageManager.YARN,
      runsScriptHooks: true,
    });
    await put('yarn.lock', BERRY_LOCK);
    expect((await inspect()).runsScriptHooks).toBe(false);
    await put('yarn.lock', CLASSIC_LOCK);
    await put('.yarnrc.yml', 'nodeLinker: node-modules\n');
    expect((await inspect()).runsScriptHooks).toBe(false);
  });

  it('follows the Yarn 2+ root of a workspace package', async () => {
    await put('package.json', JSON.stringify({ packageManager: 'yarn@4.9.0' }));
    await put('yarn.lock', BERRY_LOCK);
    await put('apps/web/package.json', '{ "name": "web" }');
    expect(await inspect('apps/web')).toMatchObject({
      packageManager: PackageManager.YARN,
      runsScriptHooks: false,
    });
  });

  it('stops at the repository root and at another lockfile', async () => {
    await put('.yarnrc.yml', 'nodeLinker: pnp\n');
    await put('repo/.git/HEAD', 'ref: refs/heads/main\n');
    await put('repo/package.json', '{ "name": "app" }');
    expect(await inspect('repo')).toMatchObject({
      packageManager: PackageManager.NPM,
      runsScriptHooks: true,
    });
    await put('other/package-lock.json', '{}');
    expect((await inspect('other')).runsScriptHooks).toBe(true);
    expect((await inspect()).runsScriptHooks).toBe(false);
  });
});

describe('planInit: CDN on another origin (--cdn-url, ADR-0027)', () => {
  const cdn = {
    ...defaultInitOptions(),
    cdnUrl: 'https://cdn.example.com/icons',
  };

  it('writes crossOrigin inject with the CDN url as publicPath', () => {
    const plan = planInit(cdn, facts({ usesReact: true }));
    expect(
      JSON.parse(statusOf(plan, 'svgworm.config.json')?.content ?? ''),
    ).toEqual({
      $schema: 'https://unpkg.com/svgworm/svgworm.schema.json',
      sources: ['icons'],
      outDir: 'public/icons',
      publicPath: 'https://cdn.example.com/icons',
      crossOrigin: 'inject',
    });
  });

  it('exports a SpriteLoader from the React wiring', () => {
    const plan = planInit(cdn, facts({ usesReact: true }));
    const content = statusOf(plan, 'components/icon.tsx')?.content ?? '';
    expect(content).toContain(
      "import { createIcon, createSpriteLoader } from '@svgworm/react';",
    );
    expect(content).toContain(
      'export const SpriteLoader = createSpriteLoader(manifest);',
    );
    expect(
      statusOf(
        planInit(defaultInitOptions(), facts({ usesReact: true })),
        'components/icon.tsx',
      )?.content,
    ).not.toContain('SpriteLoader');
  });

  it('writes SvgwormLoader.astro next to Icon.astro for Astro', () => {
    const plan = planInit(cdn, facts({ usesAstro: true }));
    const loader = statusOf(plan, 'components/SvgwormLoader.astro');
    expect(loader).toMatchObject({ status: InitStatus.CREATED });
    expect(loader?.content).toContain('crossorigin="anonymous"');
    expect(loader?.content).toContain('integrity={loader.integrity}');
    expect(
      statusOf(
        planInit(defaultInitOptions(), facts({ usesAstro: true })),
        'components/SvgwormLoader.astro',
      ),
    ).toBeUndefined();
  });

  it.each([
    ['vue', facts({ usesVue: true }), 'components/SvgwormLoader.vue'],
    [
      'nuxt 4',
      facts({ usesVue: true, usesNuxt: true, usesNuxtAppDir: true }),
      'app/components/SvgwormLoader.vue',
    ],
    ['svelte', facts({ usesSvelte: true }), 'components/SvgwormLoader.svelte'],
    [
      'sveltekit',
      facts({ usesSvelte: true, usesSvelteKit: true, hasSrcFolder: true }),
      'src/lib/components/SvgwormLoader.svelte',
    ],
  ])(
    'writes the loader next to the %s component (ADR-0036)',
    (_label, projectFacts, file) => {
      const loader = statusOf(planInit(cdn, projectFacts), file);
      expect(loader).toMatchObject({ status: InitStatus.CREATED });
      // Same order as createSpriteLoader: a connected script starts loading once src is set.
      expect(loader?.content).toMatch(/crossorigin[^]*integrity[^]*src/);
      expect(
        statusOf(planInit(defaultInitOptions(), projectFacts), file),
      ).toBeUndefined();
    },
  );

  it('imports the manifest from the loader of a nested component', () => {
    const plan = planInit(
      { ...cdn, componentFile: 'src/ui/icons/Icon.vue' },
      facts({ usesVue: true }),
    );
    expect(statusOf(plan, 'src/ui/icons/SvgwormLoader.vue')?.content).toContain(
      "from '../../../svgworm/icons.js'",
    );
  });

  it.each([
    [
      'vue',
      facts({ usesVue: true }),
      'Render <SvgwormLoader /> (components/SvgwormLoader.vue) once, in the root component',
    ],
    [
      'sveltekit',
      facts({ usesSvelte: true, usesSvelteKit: true, hasSrcFolder: true }),
      'Render <SvgwormLoader /> (src/lib/components/SvgwormLoader.svelte) once, in the root layout',
    ],
  ])('tells where the %s loader goes', (_label, projectFacts, step) => {
    expect(planInit(cdn, projectFacts).nextSteps.join('\n')).toContain(step);
  });

  it('renders use icons by id from a version 2 manifest in Icon.astro', () => {
    const content =
      statusOf(
        planInit(defaultInitOptions(), facts({ usesAstro: true })),
        'components/Icon.astro',
      )?.content ?? '';
    expect(content).toContain('version !== 1 && version !== 2');
    expect(content).toContain("kind === 'sprite' && version === 2");
  });

  it('prints the CDN steps and where the loader goes', () => {
    const steps = planInit(
      cdn,
      facts({ usesReact: true, usesNext: true }),
    ).nextSteps.join('\n');
    expect(steps).toContain(
      'Upload public/icons/ to https://cdn.example.com/icons',
    );
    expect(steps).toContain('Access-Control-Allow-Origin');
    expect(steps).toContain('<SpriteLoader />');
    expect(steps).toContain('connect-src');
  });

  it('rejects an http CDN url and --public-path together with --cdn-url', () => {
    expect(
      validateInitOptions(
        { ...cdn, cdnUrl: 'http://cdn.example.com/icons' },
        '/p',
      ).join('\n'),
    ).toContain('the config would be invalid');
    expect(
      validateInitOptions({ ...cdn, publicPath: '/icons' }, '/p').join('\n'),
    ).toContain('--cdn-url replaces --public-path');
  });
});

// RPT-007: generated code lands in the user's repo under their linter. ESLint's default max-len
// is 80, and a 110-character comment in icon.tsx broke `next build` in a real starter.
describe('planInit: generated components fit in 80 columns', () => {
  const cdnOptions = {
    ...defaultInitOptions(),
    cdnUrl: 'https://cdn.example.com/icons',
  };
  it.each([
    ['next', defaultInitOptions(), facts({ usesReact: true, usesNext: true })],
    ['react', defaultInitOptions(), facts({ usesReact: true })],
    ['astro', defaultInitOptions(), facts({ usesAstro: true })],
    ['react cdn', cdnOptions, facts({ usesReact: true })],
    ['astro cdn', cdnOptions, facts({ usesAstro: true })],
    ['vue cdn', cdnOptions, facts({ usesVue: true })],
    ['svelte cdn', cdnOptions, facts({ usesSvelte: true })],
    ['vue', defaultInitOptions(), facts({ usesVue: true })],
    ['svelte', defaultInitOptions(), facts({ usesSvelte: true })],
  ])('%s', (_label, options, projectFacts) => {
    const long = planInit(options, projectFacts)
      .actions.filter((action) =>
        /\.(?:tsx?|jsx?|astro|vue|svelte)$/.test(action.path),
      )
      .flatMap((action) =>
        (action.content ?? '')
          .split('\n')
          .map((line, index) => ({ path: action.path, index, line }))
          .filter(({ line }) => line.length > 80),
      )
      .map(({ path, index, line }) => `${path}:${String(index + 1)}: ${line}`);
    expect(long).toEqual([]);
  });
});
