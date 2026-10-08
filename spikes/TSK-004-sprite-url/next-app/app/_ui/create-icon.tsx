// Throwaway stand-in for @svgworm/react (TSK-012): a factory that binds the generated
// manifest and returns a hook-free, context-free Server Component. Spike code.
import type { CSSProperties } from 'react';

interface FileRef {
  readonly url: string;
}

interface ManifestShape<Name extends string> {
  readonly sprites: Readonly<Record<string, { readonly sprite: FileRef | null; readonly stack: FileRef | null }>>;
  readonly icons: Readonly<Record<Name, { readonly sprite: string; readonly id: string; readonly viewBox: string; readonly delivery: 'use' | 'img' | 'mask' }>>;
}

export interface IconProps<Name extends string> {
  readonly name: Name;
  readonly size?: number;
  readonly title?: string;
}

export const createIcon = <Name extends string>(manifest: ManifestShape<Name>) =>
  function Icon({ name, size = 48, title }: IconProps<Name>) {
    if (!Object.hasOwn(manifest.icons, name)) throw new Error(`svgworm: unknown icon "${name}"`);
    const icon = manifest.icons[name];
    const group = manifest.sprites[icon.sprite];
    const file = icon.delivery === 'use' ? group?.sprite : group?.stack;
    if (!file) throw new Error(`svgworm: no file for icon "${name}"`);
    const href = `${file.url}#${icon.id}`;
    const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };

    if (icon.delivery === 'img') {
      return <img src={href} width={size} height={size} alt={title ?? ''} data-icon={name} />;
    }
    if (icon.delivery === 'mask') {
      const style: CSSProperties = {
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: 'currentColor',
        mask: `url("${href}") center / contain no-repeat`
      };
      return <span style={style} {...a11y} data-icon={name} />;
    }
    return (
      <svg width={size} height={size} viewBox={icon.viewBox} focusable="false" {...a11y} data-icon={name}>
        {title ? <title>{title}</title> : null}
        <use href={href} />
      </svg>
    );
  };
