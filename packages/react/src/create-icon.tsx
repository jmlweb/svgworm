import type { CSSProperties, ReactElement, SVGProps } from 'react';

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

export type IconManifest = {
  readonly version: number;
  readonly sprites: Readonly<
    Record<
      string,
      {
        readonly sprite: ManifestFile | null;
        readonly stack: ManifestFile | null;
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

export class SvgwormReactError extends Error {
  override readonly name = 'SvgwormReactError';
}

const SUPPORTED_VERSION = 1;
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
  return `${file.url}#${icon.id}`;
};

export const createIcon = <const M extends IconManifest>(
  manifest: M,
): ((props: IconProps<Extract<keyof M['icons'], string>>) => ReactElement) => {
  if (manifest.version !== SUPPORTED_VERSION) {
    throw new SvgwormReactError(
      `Unsupported svgworm manifest version ${String(manifest.version)}; this adapter reads version ${String(SUPPORTED_VERSION)}. Update @svgworm/react.`,
    );
  }

  return function Icon({
    name,
    title,
    label,
    width = DEFAULT_SIZE,
    height = DEFAULT_SIZE,
    ...rest
  }) {
    const icon = manifest.icons[name];
    if (!icon) {
      throw new SvgwormReactError(
        `Unknown icon "${name}". It is not in the svgworm manifest.`,
      );
    }

    const accessibleName = title ?? label;
    const a11y =
      accessibleName === undefined
        ? ({ 'aria-hidden': true } as const)
        : ({ role: 'img' } as const);

    if (icon.delivery === 'img') {
      return (
        <img
          alt={accessibleName ?? ''}
          className={rest.className}
          height={height}
          src={resolveFileUrl(manifest, name, icon, 'stack')}
          style={rest.style}
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
        ...rest.style,
      };
      return (
        <span
          {...a11y}
          aria-label={accessibleName}
          className={rest.className}
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
