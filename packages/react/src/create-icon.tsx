import type {
  CSSProperties,
  HTMLAttributes,
  ReactElement,
  SVGProps,
} from 'react';

// Structural copy of the output contract (docs/output-contract.md). The adapter may not import
// `svgworm`, so it depends on the shape of the generated manifest, not on its package.
type ManifestFile = {
  readonly url: string;
};

type ManifestIcon = {
  readonly sprite: string;
  readonly id: string;
  readonly viewBox: string;
  readonly delivery: 'use' | 'img' | 'mask';
};

type ManifestIntegrityFile = ManifestFile & {
  readonly integrity: string;
};

export type IconManifest = {
  readonly version: number;
  /** `"inject"` in a version 2 manifest (ADR-0027): the sprite is on another origin. */
  readonly crossOrigin?: string;
  readonly sprites: Readonly<
    Record<
      string,
      {
        readonly sprite: ManifestFile | null;
        readonly stack: ManifestFile | null;
        readonly loader?: ManifestIntegrityFile | null;
      }
    >
  >;
  readonly icons: Readonly<Record<string, ManifestIcon>>;
};

export type IconProps<Name extends string> = Omit<
  SVGProps<SVGSVGElement>,
  'children' | 'name' | 'ref' | 'title'
> & {
  readonly name: Name;
  /** Accessible name rendered as a `<title>`; makes the icon non-decorative. */
  readonly title?: string;
  /** Accessible name as `aria-label`; makes the icon non-decorative. */
  readonly label?: string;
};

import { didYouMean, suggestClosest } from './suggest.js';

export class SvgwormReactError extends Error {
  override readonly name = 'SvgwormReactError';
}

const SUPPORTED_VERSIONS: readonly number[] = [1, 2];
// Version 2 is only written with crossOrigin "inject": the loader puts the sprite in the page.
const INJECT_VERSION = 2;
const DEFAULT_SIZE = '1em';

const resolveFileUrl = (
  manifest: IconManifest,
  name: string,
  icon: ManifestIcon,
  kind: 'sprite' | 'stack',
): string => {
  const file = manifest.sprites[icon.sprite]?.[kind];
  if (!file) {
    throw new SvgwormReactError(
      `Icon "${name}" needs the ${kind} file of "${icon.sprite}", but the manifest has none. Run svgworm again.`,
    );
  }
  const isInjected = kind === 'sprite' && manifest.version === INJECT_VERSION;
  return isInjected ? `#${icon.id}` : `${file.url}#${icon.id}`;
};

const assertVersion = (manifest: IconManifest): void => {
  if (!SUPPORTED_VERSIONS.includes(manifest.version)) {
    throw new SvgwormReactError(
      `Unsupported svgworm manifest version ${String(manifest.version)}; this adapter reads versions ${SUPPORTED_VERSIONS.join(' and ')}. Update @svgworm/react.`,
    );
  }
};

/**
 * The loader tag for `crossOrigin: "inject"` (ADR-0027): render it once, in the root layout.
 * It renders nothing for a same-origin manifest, so it is safe to keep in any app. React
 * dedupes and hoists an async script by its src, and the loader injects the sprite only once.
 */
export const createSpriteLoader = (
  manifest: IconManifest,
): (() => ReactElement | null) => {
  assertVersion(manifest);
  const loaders =
    manifest.version === INJECT_VERSION
      ? Object.values(manifest.sprites).flatMap((group) =>
          group.loader ? [group.loader] : [],
        )
      : [];
  return function SpriteLoader() {
    if (loaders.length === 0) return null;
    return (
      <>
        {loaders.map((loader) => (
          <script
            key={loader.url}
            async
            crossOrigin="anonymous"
            integrity={loader.integrity}
            src={loader.url}
          />
        ))}
      </>
    );
  };
};

export const createIcon = <const M extends IconManifest>(
  manifest: M,
): ((props: IconProps<Extract<keyof M['icons'], string>>) => ReactElement) => {
  assertVersion(manifest);

  return function Icon({
    name,
    title,
    label,
    width = DEFAULT_SIZE,
    height = DEFAULT_SIZE,
    ...rest
  }) {
    // An own property only: a runtime name such as "constructor" must not find Object.prototype.
    const icon = Object.hasOwn(manifest.icons, name)
      ? manifest.icons[name]
      : undefined;
    if (!icon) {
      throw new SvgwormReactError(
        `Unknown icon "${name}". It is not in the svgworm manifest.${didYouMean(suggestClosest(name, Object.keys(manifest.icons)))}`,
      );
    }

    const accessibleName = title ?? label;
    const a11y =
      accessibleName === undefined
        ? ({ 'aria-hidden': true } as const)
        : ({ role: 'img' } as const);
    // The non-svg deliveries render HTML elements; id, class, style, data-* and aria-* carry
    // over, and the element's own attributes come last so the icon stays intact.
    const { style, ...htmlRest } = rest as HTMLAttributes<HTMLElement>;

    if (icon.delivery === 'img') {
      return (
        <img
          {...htmlRest}
          alt={accessibleName ?? ''}
          height={height}
          src={resolveFileUrl(manifest, name, icon, 'stack')}
          style={style}
          width={width}
        />
      );
    }

    if (icon.delivery === 'mask') {
      const maskStyle: CSSProperties = {
        display: 'inline-block',
        width,
        height,
        backgroundColor: 'currentColor',
        mask: `url("${resolveFileUrl(manifest, name, icon, 'stack')}") center / contain no-repeat`,
        ...style,
      };
      return (
        <span
          {...htmlRest}
          {...a11y}
          aria-label={accessibleName}
          style={maskStyle}
        />
      );
    }

    return (
      <svg
        focusable="false"
        height={height}
        viewBox={icon.viewBox}
        width={width}
        {...a11y}
        aria-label={label}
        {...rest}
      >
        {title === undefined ? null : <title>{title}</title>}
        <use href={resolveFileUrl(manifest, name, icon, 'sprite')} />
      </svg>
    );
  };
};
