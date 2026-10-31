import { createSpriteLoader } from '@svgworm/react';
import { mkdir, rm, writeFile } from 'node:fs/promises';
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
  svelteLoaderContent,
  vueLoaderContent,
} from '../../../packages/svgworm/src/cli/init/plan.ts';
import { normalize } from '../normalize.ts';

// The SvgwormLoader.vue and SvgwormLoader.svelte that `svgworm init --cdn-url` writes
// (ADR-0036) must render the tags createSpriteLoader renders: the same loaders, each with
// async, crossorigin, integrity and src. Spike TSK-099 checked that the tags run in browsers.
const root = fileURLToPath(new URL('..', import.meta.url));
const scratch = join(root, '.generated-loader');

const loader = (name: string) => ({
  file: `${name}.loader.0a1b2c3d.js`,
  url: `https://cdn.example.com/icons/${name}.loader.0a1b2c3d.js`,
  integrity: `sha384-${name.toUpperCase()}`,
});
const sprite = (name: string, withLoader: boolean) => ({
  sprite: {
    file: `${name}.1a2b3c4d.svg`,
    url: `https://cdn.example.com/icons/${name}.1a2b3c4d.svg`,
    integrity: 'sha384-SPRITE',
  },
  stack: null,
  loader: withLoader ? loader(name) : null,
});
const icons = {
  home: {
    sprite: 'icons',
    id: 'i-home',
    viewBox: '0 0 24 24',
    color: 'mono',
    delivery: 'use',
  },
};
const manifests = {
  // Two groups with a loader, and one with only stack icons (its loader is null).
  inject: {
    version: 2,
    crossOrigin: 'inject',
    sprites: {
      icons: sprite('icons', true),
      flags: sprite('flags', true),
      photos: sprite('photos', false),
    },
    icons,
  },
  sameOrigin: {
    version: 1,
    sprites: {
      icons: {
        sprite: {
          file: 'icons.1a2b3c4d.svg',
          url: '/icons/icons.1a2b3c4d.svg',
        },
        stack: null,
      },
    },
    icons,
  },
} as const;
type Variant = keyof typeof manifests;

const load = async <T>(file: string, code: string): Promise<T> => {
  await writeFile(join(scratch, file), code);
  const module = (await import(
    /* @vite-ignore */ pathToFileURL(join(scratch, file)).href
  )) as { default: T };
  return module.default;
};

const compileVue = (source: string): string => {
  const { descriptor, errors } = parse(source, {
    filename: 'SvgwormLoader.vue',
  });
  if (errors.length > 0) throw new AggregateError(errors, 'SvgwormLoader.vue');
  const script = compileScript(descriptor, { id: 'svgworm-loader' });
  return ts.transpileModule(script.content, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2024,
      verbatimModuleSyntax: true,
    },
  }).outputText;
};

const rendered: Record<Variant, { vue: string; svelte: string }> = {
  inject: { vue: '', svelte: '' },
  sameOrigin: { vue: '', svelte: '' },
};

beforeAll(async () => {
  await rm(scratch, { recursive: true, force: true });
  for (const variant of Object.keys(manifests) as Variant[]) {
    const dir = join(scratch, variant);
    await mkdir(join(dir, 'svgworm'), { recursive: true });
    await writeFile(
      join(dir, 'svgworm/icons.js'),
      `export const manifest = ${JSON.stringify(manifests[variant])};\n`,
    );
    const vueLoader = await load<VueComponent>(
      `${variant}/SvgwormLoader.vue.js`,
      compileVue(vueLoaderContent('SvgwormLoader.vue', 'svgworm')),
    );
    const svelteLoader = await load<Parameters<typeof renderSvelteServer>[0]>(
      `${variant}/SvgwormLoader.svelte.js`,
      compile(svelteLoaderContent('SvgwormLoader.svelte', 'svgworm'), {
        filename: 'SvgwormLoader.svelte',
        generate: 'server',
      }).js.code,
    );
    rendered[variant] = {
      vue: await renderVueServer(createSSRApp({ render: () => h(vueLoader) })),
      // <svelte:head> renders into the document head, not the body.
      svelte: renderSvelteServer(svelteLoader, { props: {} }).head,
    };
  }
});

afterAll(async () => {
  await rm(scratch, { recursive: true, force: true });
});

const renderReact = (variant: Variant): string =>
  renderToStaticMarkup(
    createElement(createSpriteLoader(manifests[variant] as never)),
  );

describe.each(['vue', 'svelte'] as const)(
  'SvgwormLoader.%s matches createSpriteLoader',
  (framework) => {
    it('renders one pinned script per loader in inject mode', () => {
      const html = rendered.inject[framework];
      expect(normalize(html)).toBe(normalize(renderReact('inject')));
      expect(html.match(/<script/g)).toHaveLength(2);
      expect(html).toContain('crossorigin="anonymous"');
      expect(html).toContain('integrity="sha384-FLAGS"');
      expect(html).toContain(
        'src="https://cdn.example.com/icons/icons.loader.0a1b2c3d.js"',
      );
    });

    it('renders nothing for a same-origin build', () => {
      expect(normalize(rendered.sameOrigin[framework])).toBe('');
      expect(renderReact('sameOrigin')).toBe('');
    });
  },
);
