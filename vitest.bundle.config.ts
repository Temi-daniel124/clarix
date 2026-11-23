import { defineConfig } from "vitest/config";

// The post-build check only (`npm run test:bundle`): it reads .next/static, so it cannot run with
// the unit tests, which CI runs before the build.
export default defineConfig({
  test: { include: ["tests/**/*.bundle.test.ts"] },
});
