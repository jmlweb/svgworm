import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  createIcon,
  createSpriteLoader,
  SvgwormReactError,
} from './create-icon.js';
import { injectManifest, manifest } from './fixture-manifest.js';

const Icon = createIcon(manifest);
const render = (element: React.ReactElement) => renderToStaticMarkup(element);

describe('delivery use', () => {
  it('renders an svg that references the sprite by url and symbol id', () => {
    expect(render(<Icon name="home" />)).toBe(
      '<svg focusable="false" height="1em" viewBox="0 0 24 24" width="1em" aria-hidden="true">' +
        '<use href="/icons/icons.d907d82b.svg#i-home"></use></svg>',
    );
  });

  // RPT-006: <use> draws the symbol at 0,0, so a consumer viewBox with the icon's origin
  // shifts the icon by that origin. The symbol keeps the full viewBox.
  it('gives the svg only the viewBox size, so an offset origin stays in place', () => {
    const OffsetIcon = createIcon({
      ...manifest,
      icons: {
        rust: {
          ...manifest.icons.home,
          id: 'i-rust',
          viewBox: '19 19 106 106',
        },
        flag: {
          ...manifest.icons.home,
          id: 'i-flag',
          viewBox: '0,85.333,512,341.333',
        },
      },
    });
    expect(render(<OffsetIcon name="rust" />)).toContain(
      'viewBox="0 0 106 106"',
    );
    expect(render(<OffsetIcon name="flag" />)).toContain(
      'viewBox="0 0 512 341.333"',
    );
  });

  it('uses the symbol id from the manifest, never one derived from the name', () => {
    expect(render(<Icon name="home" />)).not.toContain('#home');
  });

  it('with a title renders role img and a title element, without aria-hidden', () => {
    const html = render(<Icon name="home" title="Home" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('<title>Home</title>');
    expect(html).not.toContain('aria-hidden');
  });

  it('with a label renders role img and aria-label', () => {
    const html = render(<Icon label="Go home" name="home" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Go home"');
    expect(html).not.toContain('aria-hidden');
  });

  it('passes size, className and style through', () => {
    const html = render(
      <Icon
        className="x"
        height={16}
        name="home"
        style={{ color: 'red' }}
        width={32}
      />,
    );
    expect(html).toContain('width="32"');
    expect(html).toContain('height="16"');
    expect(html).toContain('class="x"');
    expect(html).toContain('style="color:red"');
  });
});

describe('delivery img', () => {
  it('renders an img from the stack url with an empty alt by default', () => {
    // React 19 prepends a preload hint for <img>, so match the element, not the whole string.
    expect(render(<Icon name="brand/sunset" />)).toContain(
      '<img alt="" height="1em" src="/icons/icons.stack.91bff0b3.svg#i-brand--sunset" width="1em"/>',
    );
  });

  it('uses the title or label as alt', () => {
    expect(render(<Icon name="brand/sunset" title="Sunset" />)).toContain(
      'alt="Sunset"',
    );
    expect(render(<Icon label="Sunset logo" name="brand/sunset" />)).toContain(
      'alt="Sunset logo"',
    );
  });

  it('passes id, className, data and aria attributes through like the svg delivery', () => {
    const html = render(
      <Icon
        aria-describedby="d"
        className="x"
        data-testid="sunset"
        id="logo"
        name="brand/sunset"
      />,
    );
    expect(html).toContain('id="logo"');
    expect(html).toContain('class="x"');
    expect(html).toContain('data-testid="sunset"');
    expect(html).toContain('aria-describedby="d"');
  });
});

describe('delivery mask', () => {
  it('renders an element masked by the stack url and filled with currentColor', () => {
    const html = render(<Icon name="café" />);
    expect(html).toContain('background-color:currentColor');
    expect(html).toContain(
      'mask:url(&quot;/icons/icons.stack.91bff0b3.svg#i-caf_e9_&quot;) center / contain no-repeat',
    );
    expect(html).toContain('aria-hidden="true"');
  });

  it('with a title renders role img and aria-label', () => {
    const html = render(<Icon name="café" title="Café" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Café"');
    expect(html).not.toContain('aria-hidden');
  });

  it('keeps the caller style next to the mask style', () => {
    expect(render(<Icon name="café" style={{ color: 'red' }} />)).toContain(
      'color:red',
    );
  });

  it('passes id and data attributes through', () => {
    const html = render(<Icon data-testid="cafe" id="c" name="café" />);
    expect(html).toContain('id="c"');
    expect(html).toContain('data-testid="cafe"');
  });
});

describe('failing loudly', () => {
  it('rejects an unknown manifest version', () => {
    expect(() => createIcon({ ...manifest, version: 99 } as never)).toThrow(
      SvgwormReactError,
    );
  });

  it('throws for a name missing from the manifest', () => {
    expect(() => render(<Icon name={'nope' as never} />)).toThrow(
      SvgwormReactError,
    );
  });

  it('suggests the closest names for an unknown one', () => {
    expect(() => render(<Icon name={'hom' as never} />)).toThrow(
      'Unknown icon "hom". It is not in the svgworm manifest. Did you mean "home"?',
    );
    expect(() => render(<Icon name={'zzzzzzzz' as never} />)).toThrow(
      /manifest\.$/,
    );
  });

  it('treats prototype keys from untyped runtime names as unknown icons', () => {
    for (const name of ['constructor', 'toString', '__proto__']) {
      expect(() => render(<Icon name={name as never} />)).toThrow(
        /Unknown icon/,
      );
    }
  });

  it('throws when the sprite file an icon needs is null', () => {
    const Broken = createIcon({
      ...manifest,
      sprites: { icons: { sprite: null, stack: null } },
    } as never) as typeof Icon;
    expect(() => render(<Broken name="home" />)).toThrow(SvgwormReactError);
  });
});

describe('server component safety', () => {
  it('has no client directive and no hooks in the source', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(
      new URL('./create-icon.tsx', import.meta.url),
      'utf8',
    );
    expect(source).not.toMatch(/['"]use client['"]/);
    expect(source).not.toMatch(
      /\buse(State|Effect|Context|Ref|Memo|Callback|Reducer|Id)\b/,
    );
  });
});

describe('crossOrigin inject (manifest version 2, ADR-0027)', () => {
  const Injected = createIcon(injectManifest);
  const Loader = createSpriteLoader(injectManifest);

  it('renders use icons against the injected sprite by id', () => {
    expect(render(<Injected name="home" />)).toBe(
      '<svg focusable="false" height="1em" viewBox="0 0 24 24" width="1em" aria-hidden="true">' +
        '<use href="#i-home"></use></svg>',
    );
  });

  it('keeps absolute stack urls for img and mask icons', () => {
    expect(render(<Injected name="brand/sunset" />)).toContain(
      'src="https://cdn.example.com/icons/icons.stack.91bff0b3.svg#i-brand--sunset"',
    );
    expect(render(<Injected name="café" />)).toContain(
      'https://cdn.example.com/icons/icons.stack.91bff0b3.svg#i-caf_e9_',
    );
  });

  it('renders the loader script with its integrity, once per render', () => {
    const html = render(
      <>
        <Loader />
        <Loader />
      </>,
    );
    expect(html).toContain(
      'src="https://cdn.example.com/icons/icons.loader.0a1b2c3d.js"',
    );
    expect(html).toContain('integrity="sha384-LOADER"');
    expect(html).toContain('crossorigin="anonymous"');
    expect(html.match(/<script/g)).toHaveLength(1);
  });

  it('renders no loader for a version 1 manifest', () => {
    const NoLoader = createSpriteLoader(manifest);
    expect(render(<NoLoader />)).toBe('');
  });

  it('renders no loader when the manifest has none', () => {
    const NoLoader = createSpriteLoader({
      ...injectManifest,
      sprites: { icons: { ...injectManifest.sprites.icons, loader: null } },
    });
    expect(render(<NoLoader />)).toBe('');
  });
});
