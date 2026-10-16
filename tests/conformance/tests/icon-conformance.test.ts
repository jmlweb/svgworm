import { createIcon } from '@svgworm/react';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compile } from 'svelte/compiler';
import { render as renderSvelteServer } from 'svelte/server';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSSRApp, h, type Component as VueComponent } from 'vue';
import { compileScript, parse } from 'vue/compiler-sfc';
import { renderToString as renderVueServer } from 'vue/server-renderer';

import {
  svelteComponentContent,
  vueComponentContent,
} from '../../../packages/svgworm/src/cli/init/plan.ts';
import { normalize } from '../normalize.ts';

// The Icon.vue and Icon.svelte that `svgworm init` writes (ADR-0034) must render what
// createIcon renders. Each comes from its template in plan.ts, compiled for the server the way
// a bundler would, next to a fixture manifest with every delivery.
const root = fileURLToPath(new URL('..', import.meta.url));
const scratch = join(root, '.generated');
const fixture = join(root, '../../apps/site/tests/fixtures/icons.js');

const compileVue = (source: string): string => {
  const { descriptor, errors } = parse(source, { filename: 'Icon.vue' });
  if (errors.length > 0) throw new AggregateError(errors, 'Icon.vue');
  const script = compileScript(descriptor, {
    id: 'svgworm-icon',
    inlineTemplate: true,
    templateOptions: { ssr: true },
  });
  return ts.transpileModule(script.content, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2024,
      verbatimModuleSyntax: true,
    },
  }).outputText;
};

const compileSvelte = (source: string): string =>
  compile(source, { filename: 'Icon.svelte', generate: 'server' }).js.code;

type Props = Record<string, unknown>;
type Renderer = (props: Props) => Promise<string>;

let renderVue: Renderer;
let renderSvelte: Renderer;
let ReactIcon: ReturnType<typeof createIcon>;

const load = async <T>(file: string, code: string): Promise<T> => {
  await writeFile(join(scratch, file), code);
  const module = (await import(
    /* @vite-ignore */ pathToFileURL(join(scratch, file)).href
  )) as { default: T };
  return module.default;
};

beforeAll(async () => {
  await rm(scratch, { recursive: true, force: true });
  await mkdir(join(scratch, 'src/components'), { recursive: true });
  await mkdir(join(scratch, 'svgworm'), { recursive: true });
  await cp(fixture, join(scratch, 'svgworm/icons.js'));
  const { manifest } = (await import(
    /* @vite-ignore */ pathToFileURL(join(scratch, 'svgworm/icons.js')).href
  )) as { manifest: Parameters<typeof createIcon>[0] };
  ReactIcon = createIcon(manifest);

  const vueIcon = await load<VueComponent>(
    'src/components/Icon.vue.js',
    compileVue(vueComponentContent('src/components/Icon.vue', 'svgworm')),
  );
  renderVue = (props) =>
    renderVueServer(createSSRApp({ render: () => h(vueIcon, props) }));

  const svelteIcon = await load<Parameters<typeof renderSvelteServer>[0]>(
    'src/components/Icon.svelte.js',
    compileSvelte(
      svelteComponentContent('src/components/Icon.svelte', 'svgworm'),
    ),
  );
  // A promise, like the Vue renderer: a render that throws becomes a rejection.
  renderSvelte = (props) =>
    new Promise((resolve) => {
      resolve(renderSvelteServer(svelteIcon, { props: props as never }).body);
    });
});

afterAll(async () => {
  await rm(scratch, { recursive: true, force: true });
});

const renderReact = (props: Props): string =>
  renderToStaticMarkup(createElement(ReactIcon as never, props));

type Case = {
  readonly label: string;
  readonly name: string;
  readonly react: Props;
  /** Vue and Svelte both take `class` and a string `style`, unless a case says otherwise. */
  readonly other: Props;
  readonly vue?: Props;
};

const cases: readonly Case[] = [
  { label: 'use, defaults', name: 'home', react: {}, other: {} },
  { label: 'use, other sprite', name: 'snail', react: {}, other: {} },
  {
    label: 'use, title',
    name: 'home',
    react: { title: 'Home' },
    other: { title: 'Home' },
  },
  {
    label: 'use, label, size, class and style',
    name: 'home',
    react: {
      label: 'Home',
      width: 32,
      height: 24,
      className: 'icon',
      style: { color: 'red' },
      'data-id': 'x',
    },
    other: {
      label: 'Home',
      width: 32,
      height: 24,
      class: 'icon',
      style: 'color:red',
      'data-id': 'x',
    },
  },
  {
    label: 'use, viewBox origin not 0 0',
    name: 'flag',
    react: {},
    other: {},
  },
  { label: 'img, defaults', name: 'photo', react: {}, other: {} },
  {
    label: 'img, label and class',
    name: 'photo',
    react: { label: 'Photo', className: 'icon' },
    other: { label: 'Photo', class: 'icon' },
  },
  {
    label: 'img, id, data and aria attributes',
    name: 'photo',
    react: { id: 'logo', 'data-testid': 'p', 'aria-describedby': 'd' },
    other: { id: 'logo', 'data-testid': 'p', 'aria-describedby': 'd' },
  },
  { label: 'mask, defaults', name: 'glyph', react: {}, other: {} },
  {
    label: 'mask, label, id and data attributes',
    name: 'glyph',
    react: { label: 'Glyph', id: 'g', 'data-testid': 'g', className: 'icon' },
    other: { label: 'Glyph', id: 'g', 'data-testid': 'g', class: 'icon' },
  },
  {
    label: 'mask, title, size and style',
    name: 'glyph',
    react: { title: 'Glyph', width: 20, height: 20, style: { opacity: 0.5 } },
    other: { title: 'Glyph', width: 20, height: 20, style: 'opacity:0.5' },
  },
  // Vue also takes object styles, with Vue's own rules: no unit is added to a bare number.
  {
    label: 'mask, object style',
    name: 'glyph',
    react: { style: { opacity: 0.5, marginTop: '4px', '--size': '2em' } },
    other: { style: 'opacity:0.5;margin-top:4px;--size:2em' },
    vue: { style: { opacity: 0.5, marginTop: '4px', '--size': '2em' } },
  },
];

// Known framework differences, adjusted here and nowhere else:
// - Vue's server renderer lowercases attribute names in a v-bind object, even on <svg>. The
//   HTML parser restores the SVG case ("adjust SVG attributes"), so the DOM has viewBox.
// - Svelte adds onload and onerror replay handlers to an <img> with spread attributes, for
//   hydration. They are inline handlers: a strict CSP blocks them, and the image still loads.
const frameworks = [
  {
    framework: 'Icon.vue',
    render: () => renderVue,
    key: 'vue',
    adjust: (html: string) => html.replaceAll(' viewbox=', ' viewBox='),
  },
  {
    framework: 'Icon.svelte',
    render: () => renderSvelte,
    key: 'svelte',
    adjust: (html: string) =>
      html.replace(/ on(?:load|error)="this\.__e=event"/g, ''),
  },
] as const;

describe.each(frameworks)(
  '$framework matches createIcon',
  ({ render, key, adjust }) => {
    it.each(cases)('$label', async (testCase) => {
      const props =
        (key === 'vue' ? testCase.vue : undefined) ?? testCase.other;
      const html = await render()({ name: testCase.name, ...props });
      expect(normalize(adjust(html))).toBe(
        normalize(renderReact({ name: testCase.name, ...testCase.react })),
      );
    });

    it('keeps the contract the normalizer must not hide', async () => {
      const html = await render()({ name: 'home' });
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('focusable="false"');
      expect(html).toContain('href="/icons/icons.1a2b3c4d.svg#home-9c8d"');
      expect(html).not.toContain('<script');
    });

    it('gives the svg only the viewBox size; the symbol keeps the origin (ADR-0030)', async () => {
      expect(adjust(await render()({ name: 'flag' }))).toContain(
        'viewBox="0 0 512 341.333"',
      );
    });

    it.each(['nope', 'constructor'])(
      'throws on the unknown name "%s"',
      async (name) => {
        await expect(render()({ name })).rejects.toThrow(/Unknown icon/);
      },
    );

    it('throws when the delivery needs a file the manifest lacks', async () => {
      await expect(render()({ name: 'broken' })).rejects.toThrow(/stack file/);
    });
  },
);
