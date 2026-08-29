import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared package ships TypeScript source rather than a build artefact, so Next has to
  // compile it along with the app.
  transpilePackages: ["@patchlet/shared"],
};

export default nextConfig;
