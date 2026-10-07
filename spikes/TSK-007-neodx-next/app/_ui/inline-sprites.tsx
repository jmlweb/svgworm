import { sprites, type SpriteAssetMeta } from '../sprite.gen';

type AnySprite = { assets: readonly { meta: SpriteAssetMeta }[] };

// Workaround: neodx's 'inject' assets only mount in the browser, so render them on the server.
export function InlineSprites() {
  const content = (sprites.all as readonly AnySprite[])
    .flatMap(sprite => sprite.assets)
    .flatMap(asset => (asset.meta.type === 'inject' ? [asset.meta.content] : []))
    .join('');
  return (
    <div
      aria-hidden
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
