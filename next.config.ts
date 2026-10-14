import type { NextConfig } from "next";

const isDocker = process.env.DOCKER_BUILD === 'true';

const nextConfig: NextConfig = {
  ...(isDocker ? { output: "standalone" } : { output: "export" }),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
