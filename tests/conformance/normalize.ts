// Shared by every conformance test: apps/site (Icon.astro) and this workspace (Icon.vue,
// Icon.svelte) compare their markup with createIcon after the same normalization.

const decode = (value: string): string =>
  value
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');

const normalizeStyle = (style: string): string =>
  decode(style)
    .split(';')
    .map((declaration) => declaration.replace(/\s*:\s*/, ':').trim())
    .filter((declaration) => declaration !== '')
    .toSorted()
    .join(';');

// Attribute order, entity style, self-closing slashes, whitespace, framework comments (Vue and
// Svelte hydration markers) and React 19's hoisted <link rel="preload"> (LRN-027) are not part
// of the contract; everything else is.
export const normalize = (html: string): string =>
  html
    .replace(/<link rel="preload"[^>]*>/g, '')
    .replace(/<!--.*?-->/gs, '')
    // Dev-only attributes the Astro container adds to every element.
    .replace(/\sdata-astro-source-(?:file|loc)="[^"]*"/g, '')
    .replace(
      /<(\w+)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*\/?>/g,
      (_, tag: string, attrs: string) => {
        const pairs = [...attrs.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)]
          .map(
            ([, name = '', value = '']) =>
              [
                name,
                name === 'style' ? normalizeStyle(value) : decode(value),
              ] as const,
          )
          .toSorted(([a], [b]) => (a < b ? -1 : 1));
        return `<${tag}${pairs.map(([n, v]) => ` ${n}="${v}"`).join('')}>`;
      },
    )
    .replace(/>\s+</g, '><')
    .trim();
