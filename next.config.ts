import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'applausejobs.com',
          },
        ],
        destination: 'https://www.applausejobs.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
