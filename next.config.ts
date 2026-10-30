import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';
const isDocker = process.env.DOCKER_BUILD === 'true';

const nextConfig: NextConfig = {
  ...(isDocker ? { output: "standalone" } : isDev ? {} : { output: "export" }),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isDev
    ? {
        async rewrites() {
          return [
            {
              source: '/api/upload/:path*',
              destination: 'http://127.0.0.1:3005/api/upload/:path*',
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
