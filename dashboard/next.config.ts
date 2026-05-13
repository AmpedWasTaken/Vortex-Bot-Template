import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dashboardDir = path.dirname(fileURLToPath(import.meta.url));
/** Monorepo root (parent of `dashboard/`) — avoids Next picking an unrelated lockfile higher in the tree. */
const repoRoot = path.resolve(dashboardDir, '..');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
