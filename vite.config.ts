import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Inline all CSS into the JS bundle so there is only one file to host
    cssInjectedByJsPlugin(),
  ],
  build: {
    outDir: "dist-singlefile",
    assetsInlineLimit: 100_000_000, // inline all assets (images, fonts)
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/main.tsx",
      output: {
        format: "iife",
        entryFileNames: "bundle.js",
        chunkFileNames: "bundle.js",
        assetFileNames: "bundle.[ext]",
        inlineDynamicImports: true,
        // Expose global so host pages can call CorsaEmbed.mount(...)
        name: "CorsaEmbed",
      },
    },
    // Produce one minified JS file
    minify: true,
    // Suppress expected size warning for a single-file bundle
    chunkSizeWarningLimit: 2000,
  },
});

