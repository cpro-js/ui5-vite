import { resolve } from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import ui5RegisterAppPlugin from "./plugin/ui5-register-app";
import manifest from "./ui5/manifest.json";

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: [resolve(__dirname, "src/index.html"), resolve(__dirname, "src/main.tsx")],
    },
  },
  envDir: __dirname,
  plugins: [
    react(),
    ui5RegisterAppPlugin({
      appId: manifest["sap.app"].id,
    }),
    cssInjectedByJsPlugin({
      relativeCSSInjection: false,
      styleId: "foo",
    }),
  ],
});
