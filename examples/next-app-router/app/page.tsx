import { Icon, type IconName } from '../components/icon';
import { manifest } from '../svgworm/icons.js';

// The manifest keys are the typed icon names, so the page lists every icon the build produced.
const names = Object.keys(manifest.icons) as IconName[];

export default function Page() {
  return (
    <main>
      <h1>
        <Icon name="ui/home" title="svgworm" /> svgworm in Next.js App Router
      </h1>
      <p>
        Every icon below is rendered on the server from a content-hashed sprite
        in <code>public/icons/</code>. No icon code reaches the browser, and a
        name that is not in the manifest is a type error.
      </p>

      <h2>All icons, following the text color</h2>
      <ul className="grid accent">
        {names.map((name) => (
          <li key={name}>
            <Icon name={name} />
            <code>{name}</code>
            <small>
              {manifest.icons[name].color} / {manifest.icons[name].delivery}
            </small>
          </li>
        ))}
      </ul>

      <h2>Sizes, colors and accessible names</h2>
      <ul className="grid">
        <li>
          <Icon height={24} name="ui/house" width={24} />
          <code>width/height 24</code>
        </li>
        <li>
          <Icon name="ui/github" style={{ color: 'rebeccapurple' }} />
          <code>style color</code>
        </li>
        <li>
          <Icon name="brand/kotlin" title="Kotlin" />
          <code>title (role=img)</code>
        </li>
        <li>
          <Icon label="About" name="brand/about" />
          <code>label (aria-label)</code>
        </li>
      </ul>
    </main>
  );
}
