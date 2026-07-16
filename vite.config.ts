import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

// Keep `npm run dev` (HMR) out of dist/ so store builds aren't polluted with
// Vite client loaders and broad web_accessible_resources.
export default defineConfig(({ command }) => ({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: command === "serve" ? "dist-dev" : "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        options: "src/options/index.html",
        onboarding: "src/onboarding/index.html",
        offscreen: "src/offscreen/index.html",
      },
    },
  },
  optimizeDeps: {
    exclude: ["@mlc-ai/web-llm"],
  },
}));
