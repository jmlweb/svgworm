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
