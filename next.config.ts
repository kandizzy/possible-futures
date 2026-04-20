import type { NextConfig } from "next";
import path from "node:path";

// Pin Turbopack root to this directory so auto-detection (which walks up
// looking for lockfiles) can't pick a parent directory in a nested layout.
// See https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
const PROJECT_ROOT = path.resolve(__dirname);

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    root: PROJECT_ROOT,
  },
  outputFileTracingRoot: PROJECT_ROOT,
};

export default nextConfig;
