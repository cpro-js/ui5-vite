import { createCommonConfig } from "@cpro-js/vite-ui5-common-config";
import { defineConfig } from "vite";
import manifest from "./ui5/manifest.json";

const appId = manifest["sap.app"].id;

// https://vitejs.dev/config/
export default defineConfig(() => {
  return createCommonConfig({
    appId,
    ui5Version: "1.108.30",
  });
});
