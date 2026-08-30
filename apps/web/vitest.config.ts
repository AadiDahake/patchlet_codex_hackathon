import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "@patchlet/shared": fileURLToPath(new URL("../../packages/shared/src/index.ts", import.meta.url)),
      "@patchlet/capability": fileURLToPath(new URL("../../packages/capability/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // The integration suite talks to the real API and needs a key; it skips itself without one.
    testTimeout: 60_000,
  },
});
