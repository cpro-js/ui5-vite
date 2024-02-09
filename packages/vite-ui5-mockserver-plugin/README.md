# Vite UI5 Mockserver Plugin

Integrates [@sap-ux/fe-mockserver-core](https://github.com/SAP/open-ux-odata/tree/main/packages/fe-mockserver-core) into
Vite and reloads your application on mock data changes.

> The SAP Fiori - UI5 middleware for the Fiori elements mock server is a middleware extension.... As an
> alternative to proxying OData requests to a live backend, it supports loading mock data for OData v2/v4 requests for
> supported Fiori elements templates. As the mock server runs locally without requiring a network connection to a
> backend
> system, it is useful for development and test scenarios.
>
> <cite>see https://github.com/SAP/open-ux-odata/tree/main/packages/ui5-middleware-fe-mockserver</cite>

## Setup

```bash
npm install --save-dev @cpro-js/vite-ui5-mockserver-plugin
```

**vite.config.ts**

```ts
import { resolve } from "path";
import { defineConfig } from "vite";
import viteUI5MockserverPlugin from "@cpro-js/vite-ui5-mockserver-plugin";

return defineConfig({
  // ...
  plugins: [
    // ...
    viteUI5MockserverPlugin({
      // accepts same options as @sap-ux/fe-mockserver-core
      services: [
        {
          urlPath: "/sap/opu/odata/CPRO/TEST_SRV",
          metadataPath: resolve(__dirname, "src/localService/metadata.xml"),
          mockdataPath: resolve(__dirname, "src/localService/mockdata"),
          watch: true,
        },
      ],
    }),
  ],
});

```

## License

MIT - see [License](./LICENSE.md).
