import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,
  },
  experimental: {
    workerThreads: false,
    cpus: 1
  }
};

export default nextConfig;
