import { resolve } from "path";
import { format as formatUrl, parse as parseUrl } from "url";
import ui5ViteApp from "@cpro-js/vite-ui5-integration-plugin";
import viteUI5MockserverPlugin from "@cpro-js/vite-ui5-mockserver-plugin";
import viteUI5ResourcesProxyPlugin from "@cpro-js/vite-ui5-resources-proxy-plugin";
import { MockserverConfiguration } from "@sap-ux/fe-mockserver-core";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export interface CommonConfigOptions {
  /**
   * ID of UI5 app as it is usually written in manifest.json (prop "sap.app.id")
   */
  appId: string;
  /**
   * UI5 version as it is usually written in manifest.json (prop "sap.ui5.dependencies.minUI5Version")
   */
  ui5Version: string;
  /**
   * Mock server configuration. If not passed we assume, that no mock server is active.
   */
  mockServerConfig?: MockserverConfiguration;
  /**
   * Proxy settings are only applied when mock server is not used.
   */
  proxy?: {
    /**
     * Complete & valid URL with protocol & host & everything
     */
    url: string;
    /**
     * Basic auth credentials
     */
    username?: string;
    /**
     * Basic auth credentials
     */
    password?: string;
    /**
     * Additional query params that are added by the proxy.
     */
    queryParams?: Record<string, string>;
  };
  debug?: boolean;
}
export function createCommonConfig(options: CommonConfigOptions) {
  const { appId, ui5Version, mockServerConfig, proxy, debug = false } = options;

  return defineConfig({
    appType: "mpa", // disables history api fallback to index.html
    base: "",
    root: resolve("./src"),
    publicDir: resolve("./public"),
    build: {
      outDir: resolve("./dist"),
      emptyOutDir: true,
      commonjsOptions: {
        // resolves 'require is not defined'
        transformMixedEsModules: true,
      },
      rollupOptions: {
        input: [
          // entry point for plain react
          "./src/index.html",
          // entry point for UI5
          "./src/main.tsx",
          "./ui5/Component.ts",
        ],
      },
    },
    envDir: resolve("./"),
    // clearScreen: false,
    plugins: [
      react({
        babel: {
          plugins: [
            "babel-plugin-transform-typescript-metadata",
            ["@babel/plugin-proposal-decorators", { legacy: true }],
            ["@babel/plugin-proposal-class-properties", { loose: true }],
          ],
        },
      }),
      ui5ViteApp({
        appId: appId,
      }),
      mockServerConfig && viteUI5MockserverPlugin(mockServerConfig),
      viteUI5ResourcesProxyPlugin({
        version: ui5Version,
        debug,
      }),
    ],
    server: {
      proxy: {
        ...(!mockServerConfig && proxy
          ? {
              [new URL(proxy.url).pathname]: {
                secure: false,
                changeOrigin: true,
                cookieDomainRewrite: "",
                target: new URL(proxy.url).origin,
                auth: proxy.username && proxy.password ? `${proxy.username}:${proxy.password}` : undefined,
                ws: true,
                configure: (proxy, options) => {
                  if (!debug) {
                    return;
                  }

                  proxy.on("proxyReq", (proxyReq, req, _res) => {
                    console.log("PROXY: Sending Request to Target:", req.method, req.url);
                  });
                  proxy.on("proxyRes", (proxyRes, req, _res) => {
                    console.log("PROXY: Received Response from Target:", proxyRes.statusCode, req.url);
                  });
                },
                rewrite: (path) => {
                  if (proxy?.queryParams) {
                    const url = parseUrl(path);
                    // @ts-ignore
                    delete url.query;
                    const searchParams = new URLSearchParams(url.search!);
                    Object.entries(proxy.queryParams).forEach(([key, value]) => searchParams.set(key, value));
                    url.search = searchParams.toString();
                    return formatUrl(url);
                  }
                  return path;
                },
              },
            }
          : {}),
      },
    },
  });
}
