import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    emptyOutDir: true,
    ssr: true,

    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
    },
    sourcemap: "inline",
    minify: false,
    rollupOptions: { external: /^@cpro-js.*/ },
  },
  plugins: [
    dts({
      rollupTypes: true,
    }),
  ],
});
