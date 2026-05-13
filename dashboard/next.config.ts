import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(fileURLToPath(new URL('.', import.meta.url)), '..');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
