import { resolve } from "path";
import ui5ViteApp from "@cpro-js/ui5-vite-app-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import manifest from "./ui5/manifest.json";

const appId = manifest["sap.app"].id;

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: [
        // entry point for plain react
        resolve(__dirname, "src/index.html"),
        // entry point for UI5
        resolve(__dirname, "src/main.tsx"),
      ],
    },
  },
  envDir: __dirname,
  plugins: [
    react(),
    ui5ViteApp({
      appId: appId,
    }),
    cssInjectedByJsPlugin({
      relativeCSSInjection: false,
      styleId: `${appId}-style`,
    }),
  ],
});
