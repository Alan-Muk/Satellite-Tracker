import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const cesium = require("vite-plugin-cesium").default;

// GitHub Pages serves at /<repo>/, not /
const BASE = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base: BASE,
  plugins: [react(), cesium()],
  build: {
    outDir: "dist",
    // Cesium workers are large; silence the size warning
    chunkSizeWarningLimit: 5000,
  },
});
