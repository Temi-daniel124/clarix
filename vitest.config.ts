import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The same `@/` alias tsconfig.json declares, so a test can import the code it covers the way the
// app does.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
