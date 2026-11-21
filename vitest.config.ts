import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mirrors the "@/*" -> "src/*" path alias from tsconfig.json so component modules that import
// from "@/lib/utils" can be unit-tested.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
