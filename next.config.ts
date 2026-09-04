import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { authInterrupts: true },
  // The repository-wide legacy backlog is not part of this bounded release.
  // Release scope is enforced by the explicit `lint:practical` gate.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
