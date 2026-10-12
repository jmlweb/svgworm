import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next serves public/ with max-age=0. The sprite file names are content-hashed, so a
  // year-long immutable cache is safe (README, "Cache the hashed files").
  headers: () =>
    Promise.resolve([
      {
        source: '/icons/:file*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // The sprite is served as image/svg+xml; never let a browser guess otherwise.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]),
};

export default nextConfig;
