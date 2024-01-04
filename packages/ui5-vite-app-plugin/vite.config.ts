import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    ssr: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
    },
    sourcemap: "inline",
    minify: false,
  },
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
});
