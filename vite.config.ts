import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    target: "es2015",          // ensure compatibility
    outDir: "dist-singlefile",
    assetsInlineLimit: 1000000, // inline big assets
    rollupOptions: {
      input: "index.html",      // entry HTML
      output: {
        format: "iife",         // single-file IIFE
        entryFileNames: "bundle.js", // fixed name
        inlineDynamicImports: true,  // include all chunks
        assetFileNames: "[name].[ext]", 
      },
    },
  },
});
