# Vite UI5 Resources Proxy

A custom Vite plugin to configure Vite's proxy for loading UI5 sources from Content Delivery Network (CDN).
All requests to `/resources ` and `/test-resources` will be proxied to the configured CDN (default: https://ui5.sap.com).

## Setup

```bash
npm install --save-dev @cpro-js/vite-ui5-resources-proxy
```

**vite.config.ts**

```ts
import { defineConfig } from "vite";
import viteUI5ResourcesProxyPlugin from "@cpro-js/vite-ui5-resources-proxy";

return defineConfig({
  // ...
  plugins: [
    // ...
    viteUI5ResourcesProxyPlugin({
      version: "1.120.6",
      url: "https://ui5.sap.com",
      debug: false
    }),
  ],
});

```

## License

MIT - see [License](./LICENSE.md).
