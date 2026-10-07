import { forwardRef, useMemo, type SVGProps } from 'react';
import { sprites, type SpritesMeta } from '../sprite.gen';

export type IconName = {
  [Key in keyof SpritesMeta]: `${Key}:${SpritesMeta[Key]}`;
}[keyof SpritesMeta];

// Mirrors the docs' "writing an icon component" example: forwardRef + useMemo, no 'use client'.
export const DocsIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { name: IconName }>(
  ({ name, ...props }, ref) => {
    const item = useMemo(() => {
      const [spriteName, iconName] = name.split(':');
      return sprites.experimental_get(spriteName, iconName, { baseUrl: '/sprites/' });
    }, [name]);
    if (!item) return null;
    return (
      <svg ref={ref} viewBox={item.symbol.viewBox} focusable="false" aria-hidden width={48} height={48} {...props}>
        <use href={item.href} />
      </svg>
    );
  }
);
DocsIcon.displayName = 'DocsIcon';

// Hook-free variant: what an RSC-first user would write.
export function PlainIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  const [spriteName, iconName] = name.split(':');
  const item = sprites.experimental_get(spriteName, iconName, { baseUrl: '/sprites/' });
  if (!item) return null;
  return (
    <svg viewBox={item.symbol.viewBox} focusable="false" aria-hidden width={48} height={48} {...props}>
      <use href={item.href} />
    </svg>
  );
}
