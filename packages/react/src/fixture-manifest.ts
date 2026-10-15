// Mirrors docs/samples/output-contract-v0.1/svgworm/icons.js. The adapter may not import
// `svgworm`, so tests carry a copy of the contract shape.
export const manifest = {
  version: 1,
  sprites: {
    icons: {
      sprite: { file: 'icons.d907d82b.svg', url: '/icons/icons.d907d82b.svg' },
      stack: {
        file: 'icons.stack.91bff0b3.svg',
        url: '/icons/icons.stack.91bff0b3.svg',
      },
    },
  },
  icons: {
    'brand/sunset': {
      sprite: 'icons',
      id: 'i-brand--sunset',
      viewBox: '0 0 24 24',
      color: 'multicolor',
      delivery: 'img',
    },
    café: {
      sprite: 'icons',
      id: 'i-caf_e9_',
      viewBox: '0 0 24 24',
      color: 'mono',
      delivery: 'mask',
    },
    home: {
      sprite: 'icons',
      id: 'i-home',
      viewBox: '0 0 24 24',
      color: 'mono',
      delivery: 'use',
    },
  },
} as const;

// The crossOrigin "inject" form of the same manifest (ADR-0027).
export const injectManifest = {
  version: 2,
  crossOrigin: 'inject',
  sprites: {
    icons: {
      sprite: {
        file: 'icons.d907d82b.svg',
        url: 'https://cdn.example.com/icons/icons.d907d82b.svg',
        integrity: 'sha384-SPRITE',
      },
      stack: {
        file: 'icons.stack.91bff0b3.svg',
        url: 'https://cdn.example.com/icons/icons.stack.91bff0b3.svg',
      },
      loader: {
        file: 'icons.loader.0a1b2c3d.js',
        url: 'https://cdn.example.com/icons/icons.loader.0a1b2c3d.js',
        integrity: 'sha384-LOADER',
      },
    },
  },
  icons: manifest.icons,
} as const;
