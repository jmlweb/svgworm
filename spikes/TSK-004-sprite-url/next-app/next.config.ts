import type { NextConfig } from 'next';

// SPIKE_BASE_PATH lets check.mjs build the same app with and without a Next basePath.
const basePath = process.env.SPIKE_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  distDir: basePath ? '.next-basepath' : '.next',
  // Next serves public/ with `max-age=0`. svgworm file names are content-hashed, so the
  // recipe marks them immutable. `source` is relative to basePath.
  async headers() {
    return [
      {
        source: '/icons/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      }
    ];
  }
};

export default nextConfig;
