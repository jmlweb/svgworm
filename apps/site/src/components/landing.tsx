import { manifest } from '../../svgworm/icons.js';
import { Icon, type IconName } from './icon';

const REPO = 'https://github.com/jmlweb/svgworm';
const docs = (path: string) => `${REPO}/blob/main/${path}`;

// The page shows the real sprite it was built with, so the samples are the live output.
const spriteUrl = manifest.sprites.icons?.sprite?.url ?? '/icons/icons.svg';
const iconNames = Object.keys(manifest.icons) as IconName[];
const monoIcons = iconNames.filter(
  (name) => manifest.icons[name].color === 'mono',
);
const multicolorIcons = iconNames.filter(
  (name) => manifest.icons[name].color === 'multicolor',
);
const countDelivery = (delivery: 'use' | 'img' | 'mask') =>
  iconNames.filter((name) => manifest.icons[name].delivery === delivery).length;
const terminalId = manifest.icons.terminal.id;

const formatKib = (bytes: number) => `${(bytes / 1024).toFixed(1)} KiB`;

type Feature = {
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
};

const features: readonly Feature[] = [
  {
    icon: 'layers',
    title: 'Right colors, per icon',
    body: 'Mono icons follow currentColor, multicolor icons keep their colors. Gradients, masks and filters render in Chromium, Firefox and WebKit.',
  },
  {
    icon: 'package',
    title: 'No bundler plugin',
    body: 'A CLI that writes files. Turbopack, webpack and Vite all just see static assets.',
  },
  {
    icon: 'git-branch',
    title: 'Deterministic',
    body: 'Byte-identical output on Linux, macOS and Windows. svgworm check fails CI when it is stale.',
  },
  {
    icon: 'gauge',
    title: 'Cacheable for a year',
    body: 'File names are content hashes, so the sprite is served immutable. Change an icon, get a new URL.',
  },
];

type Pebble = {
  readonly icon: IconName;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly tilt: number;
};

// Icons buried in the soil band, in percent of the band. They come from the sprite too.
const pebbles: readonly Pebble[] = [
  { icon: 'folder-open', x: 8, y: 62, size: 30, tilt: -12 },
  { icon: 'file-code', x: 22, y: 82, size: 26, tilt: 9 },
  { icon: 'server', x: 63, y: 74, size: 28, tilt: -6 },
  { icon: 'package', x: 78, y: 58, size: 32, tilt: 14 },
  { icon: 'layers', x: 91, y: 84, size: 26, tilt: -10 },
  { icon: 'zap', x: 45, y: 88, size: 22, tilt: 18 },
];

const swatches = ['#933a43', '#b07a52', '#3d7a5c', '#3b5f9a'] as const;

const Soil = () => (
  <div aria-hidden="true" className="soil">
    <svg
      className="soil-art"
      focusable="false"
      preserveAspectRatio="xMidYMin slice"
      viewBox="0 0 1440 320"
    >
      <path
        className="stratum stratum-1"
        d="M0 40 C 240 8, 480 72, 720 40 S 1200 8, 1440 44 V320 H0Z"
      />
      <path
        className="stratum stratum-2"
        d="M0 112 C 300 82, 540 146, 820 108 S 1250 84, 1440 118 V320 H0Z"
      />
      <path
        className="stratum stratum-3"
        d="M0 196 C 280 172, 620 226, 900 190 S 1270 164, 1440 200 V320 H0Z"
      />
      <path
        className="tunnel"
        d="M-20 168 C 120 128, 220 200, 340 160 S 520 120, 600 158"
      />
      <g className="worm">
        <path
          className="worm-body"
          d="M420 158 C 470 122, 520 196, 580 158 S 680 122, 730 152"
          pathLength="100"
        />
        <path
          className="worm-rings"
          d="M420 158 C 470 122, 520 196, 580 158 S 680 122, 730 152"
          pathLength="100"
        />
        <path
          className="worm-saddle"
          d="M420 158 C 470 122, 520 196, 580 158 S 680 122, 730 152"
          pathLength="100"
        />
      </g>
    </svg>
    {pebbles.map((pebble) => (
      <span
        key={pebble.icon}
        className="pebble"
        style={{
          left: `${String(pebble.x)}%`,
          top: `${String(pebble.y)}%`,
          transform: `translate(-50%, -50%) rotate(${String(pebble.tilt)}deg)`,
        }}
      >
        <Icon height={pebble.size} name={pebble.icon} width={pebble.size} />
      </span>
    ))}
  </div>
);

type LandingProps = {
  readonly logoLight: string;
  readonly logoDark: string;
  readonly spriteBytes: number;
};

export const Landing = ({ logoLight, logoDark, spriteBytes }: LandingProps) => (
  <>
    <a className="skip-link" href="#content">
      Skip to content
    </a>
    <header className="site-header">
      <div className="wrap header-row">
        <a aria-label="svgworm home" className="brand" href="/">
          <picture>
            <source media="(prefers-color-scheme: dark)" srcSet={logoDark} />
            <img alt="svgworm" height="40" src={logoLight} width="180" />
          </picture>
        </a>
        <nav aria-label="Project links">
          <a href={docs('docs/nextjs.md')}>Docs</a>
          <a href={docs('docs/comparison.md')}>Compare</a>
          <a href="https://www.npmjs.com/package/svgworm">npm</a>
          <a className="nav-cta" href={REPO}>
            GitHub
          </a>
        </nav>
      </div>
    </header>

    <main id="content">
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" /> v0.1 on npm · MIT · Node 22.20+
            </p>
            <h1>
              One sprite.
              <br />
              <span className="squiggle">Zero client JS.</span>
            </h1>
            <p className="lede">
              svgworm digs through your folder of SVG files and leaves one
              type-safe, content-hashed sprite behind. Render it from React
              Server Components in the Next.js App Router, and ship no icon code
              to the browser.
            </p>
            <div className="actions">
              <a className="button" href={docs('README.md#get-started')}>
                Get started <Icon name="arrow-right" />
              </a>
              <a className="button button-ghost" href={docs('docs/nextjs.md')}>
                <Icon name="book-open" /> Next.js guide
              </a>
            </div>
          </div>

          <figure aria-label="svgworm build output" className="terminal">
            <div className="terminal-bar">
              <span />
              <span />
              <span />
              <code>~/my-app</code>
            </div>
            <pre>
              <code>
                <span className="t-prompt">$</span> pnpm svgworm{'\n'}
                <span className="t-ok">svgworm: build done</span>
                {'\n'}
                {'  '}icons{'     '}
                <span className="t-num">{iconNames.length}</span> (
                {monoIcons.length} mono, {multicolorIcons.length} multicolor)
                {'\n'}
                {'  '}delivery{'  '}use {countDelivery('use')}, img{' '}
                {countDelivery('img')}, mask {countDelivery('mask')}
                {'\n'}
                {'  '}output{'    '}
                <span className="t-num">{formatKib(spriteBytes)}</span>
                {'\n'}
                {'  '}write{'     '}
                <span className="t-path">public{spriteUrl}</span>
                {'\n\n'}
                <span className="t-prompt">$</span> pnpm tsc{'\n'}
                <span className="t-err">error</span> TS2322: Type
                &apos;&quot;termnial&quot;&apos; is not assignable to type
                &apos;IconName&apos;.
              </code>
            </pre>
          </figure>
        </div>
      </section>

      <Soil />

      <section aria-label="This page in numbers" className="stats">
        <div className="wrap stats-grid">
          <div>
            <strong>0 B</strong>
            <span>JavaScript on this page</span>
          </div>
          <div>
            <strong>1</strong>
            <span>sprite request for every icon</span>
          </div>
          <div>
            <strong>{formatKib(spriteBytes)}</strong>
            <span>for all {iconNames.length} icons</span>
          </div>
          <div>
            <strong>1 year</strong>
            <span>immutable browser cache</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="why" className="section">
        <div className="wrap">
          <p className="kicker">Why svgworm</p>
          <h2 id="why">Icons that stay out of your bundle.</h2>
          <div className="bento">
            <article className="tile tile-wide">
              <div className="tile-head">
                <span className="badge">
                  <Icon name="zap" />
                </span>
                <h3>Zero client JS</h3>
              </div>
              <p>
                Each icon renders on the server as a tiny{' '}
                <code>&lt;use href&gt;</code>. The browser fetches one hashed
                sprite and keeps it.
              </p>
              <pre className="code">
                <code>
                  <span className="c-tag">&lt;Icon</span>{' '}
                  <span className="c-attr">name</span>=
                  <span className="c-str">&quot;terminal&quot;</span>{' '}
                  <span className="c-tag">/&gt;</span>
                  {'\n'}
                  <span className="c-comment">
                    {`// <svg aria-hidden="true"><use href="${spriteUrl}#${terminalId}"/></svg>`}
                  </span>
                </code>
              </pre>
            </article>
            <article className="tile tile-tall">
              <div className="tile-head">
                <span className="badge">
                  <Icon name="shield-check" />
                </span>
                <h3>Type-safe names</h3>
              </div>
              <p>
                The generated types list every icon. A typo fails{' '}
                <code>tsc</code>, not production.
              </p>
              <pre className="code">
                <code>
                  <span className="c-tag">&lt;Icon</span>{' '}
                  <span className="c-attr">name</span>=
                  <span className="c-str c-error">&quot;termnial&quot;</span>{' '}
                  <span className="c-tag">/&gt;</span>
                </code>
              </pre>
              <div aria-hidden="true" className="suggest">
                <p className="suggest-input">
                  <span className="c-tag">&lt;Icon</span>{' '}
                  <span className="c-attr">name</span>=
                  <span className="c-str">&quot;te</span>
                  <span className="caret" />
                </p>
                <ul>
                  {(['terminal', 'shield-check', 'server'] as const).map(
                    (name, index) => (
                      <li
                        key={name}
                        className={index === 0 ? 'active' : undefined}
                      >
                        <Icon name={name} />
                        <code>{name}</code>
                        <small>IconName</small>
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <ul className="checks">
                <li>
                  <Icon name="check" /> Autocomplete in your editor
                </li>
                <li>
                  <Icon name="check" /> Checked with TypeScript 6 and 7
                </li>
                <li>
                  <Icon name="check" /> Clear errors for collisions
                </li>
              </ul>
            </article>
            {features.map((feature) => (
              <article key={feature.title} className="tile">
                <div className="tile-head">
                  <span className="badge">
                    <Icon name={feature.icon} />
                  </span>
                  <h3>{feature.title}</h3>
                </div>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="start" className="section section-raised">
        <div className="wrap">
          <p className="kicker">Get started in Next.js</p>
          <h2 id="start">Three steps, no config.</h2>
          <ol className="steps">
            <li>
              <h3>Install and set up</h3>
              <p>
                <code>init</code> writes the config, the <code>predev</code>/
                <code>prebuild</code> scripts and the component.
              </p>
              <pre className="code">
                <code>
                  pnpm add -D svgworm{'\n'}pnpm add @svgworm/react{'\n'}pnpm
                  svgworm init
                </code>
              </pre>
            </li>
            <li>
              <h3>Drop SVGs in icons/</h3>
              <p>
                Each run writes a hashed sprite to <code>public/icons/</code>{' '}
                and a typed manifest to <code>svgworm/</code>.
              </p>
              <pre className="code">
                <code>
                  icons/{'\n'}├── home.svg{'\n'}├── search.svg{'\n'}└──
                  brand/logo.svg
                </code>
              </pre>
            </li>
            <li>
              <h3>Render in a Server Component</h3>
              <p>
                Decorative by default. Pass <code>title</code> or{' '}
                <code>label</code> for an accessible name.
              </p>
              <pre className="code">
                <code>
                  <span className="c-tag">&lt;Icon</span>{' '}
                  <span className="c-attr">name</span>=
                  <span className="c-str">&quot;home&quot;</span>{' '}
                  <span className="c-attr">title</span>=
                  <span className="c-str">&quot;Go home&quot;</span>{' '}
                  <span className="c-tag">/&gt;</span>
                </code>
              </pre>
            </li>
          </ol>
          <p className="more">
            Caching, <code>basePath</code> and manual setup are in the{' '}
            <a href={docs('docs/nextjs.md')}>Next.js guide</a>. A complete app
            lives in{' '}
            <a href={`${REPO}/tree/main/examples/next-app-router`}>
              examples/next-app-router
            </a>
            .
          </p>
        </div>
      </section>

      <section aria-labelledby="proof" className="section section-dark">
        <div className="wrap">
          <p className="kicker">This page is the demo</p>
          <h2 id="proof">Every icon here is one sprite.</h2>
          <p className="section-lede">
            <code>{spriteUrl}</code>, rendered by <code>@svgworm/react</code> at
            build time and served with <code>Cache-Control: immutable</code>.
            Open your network panel: no JavaScript, one SVG.
          </p>
          <div className="showcase-group">
            <h3>
              Multicolor{' '}
              <small>{multicolorIcons.length} icons, colors kept</small>
            </h3>
            <ul
              aria-label="Multicolor icons from the sprite"
              className="showcase showcase-multi"
            >
              {multicolorIcons.map((name) => (
                <li key={name}>
                  <Icon height={48} name={name} width={48} />
                  <code>{name}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="showcase-group">
            <h3>
              Mono <small>{monoIcons.length} icons, follow currentColor</small>
            </h3>
            <ul aria-label="Mono icons from the sprite" className="showcase">
              {monoIcons.map((name) => (
                <li key={name}>
                  <Icon height={32} name={name} width={32} />
                  <code>{name}</code>
                </li>
              ))}
            </ul>
          </div>
          <div className="color-demo">
            <p>
              Same sprite, same <code>&lt;use href&gt;</code>, decided per icon.
              Change the text color: the mono folder follows it, the multicolor
              snail keeps its own colors.
            </p>
            <div className="swatches">
              {swatches.map((color) => (
                <span key={color} style={{ color }}>
                  <Icon height={36} name="folder-open" width={36} />
                  <Icon height={36} name="emoji/snail" width={36} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="agents" className="section">
        <div className="wrap agents">
          <div>
            <p className="kicker">Built for AI agents too</p>
            <h2 id="agents">Your agent can set it up.</h2>
            <p>
              Everything works without a prompt: flags, <code>--json</code>,
              stable exit codes, a JSON Schema for the config, and{' '}
              <a href={`${REPO}/blob/main/llms.txt`}>llms.txt</a>. The agent
              skill installs svgworm in a Next.js app and fixes every error
              code.
            </p>
          </div>
          <figure className="terminal terminal-small">
            <div className="terminal-bar">
              <span />
              <span />
              <span />
              <Icon name="terminal" />
            </div>
            <pre>
              <code>
                <span className="t-prompt">$</span> npx skills add
                jmlweb/svgworm --skill svgworm-nextjs
              </code>
            </pre>
          </figure>
        </div>
      </section>
    </main>

    <footer className="site-footer">
      <div className="wrap footer-row">
        <img
          alt=""
          className="footer-mark"
          height="32"
          src="/favicon.svg"
          width="32"
        />
        <p>
          MIT licensed. Icons on this page are from{' '}
          <a href="https://lucide.dev">Lucide</a> (ISC) and{' '}
          <a href="https://github.com/microsoft/fluentui-emoji">Fluent Emoji</a>{' '}
          (MIT).
        </p>
        <nav aria-label="Docs">
          <a href={docs('docs/cli.md')}>CLI</a>
          <a href={docs('docs/config.md')}>Config</a>
          <a href={docs('docs/output-contract.md')}>Output contract</a>
          <a href={`${REPO}/tree/main/docs/adr`}>Decisions</a>
        </nav>
      </div>
    </footer>
  </>
);
