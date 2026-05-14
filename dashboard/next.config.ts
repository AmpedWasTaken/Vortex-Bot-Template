import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path to this app — keeps `next build` route resolution stable inside `dashboard/`. */
const dashboardRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: dashboardRoot,
  output: 'standalone',
};

export default nextConfig;
