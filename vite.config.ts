import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [react(), cssInjectedByJs()],
  // Do not copy the public/ directory into the embed bundle output.
  // The favicon and icons SVGs are only used by the dev-mode HTML page.
  publicDir: false,
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  build: {
    target: "es2015",          // ensure compatibility
    outDir: "dist-singlefile",
    assetsInlineLimit: 1000000, // inline big assets
    lib: {
      entry: "src/main.tsx",   // embed entry point
      formats: ["iife"],        // single-file IIFE for <script> tag embeds
      name: "CorsaEmbed",       // IIFE global; also exposed as window.CorsaEmbed by main.tsx
      fileName: () => "bundle.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // include all chunks in one file
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
