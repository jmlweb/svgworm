// A manifest with all three deliveries and two sprites, in the shape svgworm writes (docs/output-contract.md).
export const manifest = {
  version: 1,
  sprites: {
    icons: {
      sprite: { url: '/icons/icons.1a2b3c4d.svg' },
      stack: { url: '/icons/icons.stack.1a2b3c4d.svg' },
    },
    emoji: {
      sprite: { url: '/icons/emoji.5e6f7a8b.svg' },
      stack: null,
    },
  },
  icons: {
    home: {
      sprite: 'icons',
      id: 'home-9c8d',
      viewBox: '0 0 24 24',
      delivery: 'use',
    },
    snail: {
      sprite: 'emoji',
      id: 'snail-77aa',
      viewBox: '0 0 32 32',
      delivery: 'use',
    },
    // A viewBox origin other than 0 0, as in cropped logos and flags (RPT-006).
    flag: {
      sprite: 'icons',
      id: 'flag-5b6a',
      viewBox: '0 85.333 512 341.333',
      delivery: 'use',
    },
    photo: {
      sprite: 'icons',
      id: 'photo-1f2e',
      viewBox: '0 0 24 24',
      delivery: 'img',
    },
    glyph: {
      sprite: 'icons',
      id: 'glyph-3d4c',
      viewBox: '0 0 24 24',
      delivery: 'mask',
    },
    broken: {
      sprite: 'emoji',
      id: 'broken-0000',
      viewBox: '0 0 24 24',
      delivery: 'img',
    },
  },
};
