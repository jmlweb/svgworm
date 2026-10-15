import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // SVGR variant: the Turbopack loader setup the Next.js docs describe.
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [{ loader: '@svgr/webpack', options: { icon: true } }],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
