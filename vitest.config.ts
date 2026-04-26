/** Vitest configuration for the Remix MSAL starter — wires up jsdom, the path alias `~`, and v8 coverage. */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./app/test/setup.ts"],
    include: ["app/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["app/**/*.{ts,tsx}"],
      exclude: [
        "app/**/*.d.ts",
        "app/test/**",
        "app/entry.client.tsx",
        "app/entry.server.tsx",
        "**/*.{test,spec}.{ts,tsx}",
      ],
    },
  },
});
