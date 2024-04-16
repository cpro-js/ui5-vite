# Vite UI5 Common Config

## Setup

```bash
npm install --save-dev @cpro-js/vite-ui5-common-config
```

**vite.config.ts**

```ts
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
```

## License

MIT - see [License](./LICENSE.md).
