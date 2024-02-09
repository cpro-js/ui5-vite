import type { Logger, Plugin } from "vite";
import { ViteUI5ResourcesProxyPluginOptions } from "./types.ts";

export default ({
  version = "latest",
  url = "https://ui5.sap.com",
  debug = false,
}: ViteUI5ResourcesProxyPluginOptions): Plugin => {
  let logger: Logger;
  const ui5Version = !version || version === "latest" ? "" : version;

  return {
    name: "vite-ui5-resources-proxy-plugin",
    config(config, env) {
      return {
        ...config,
        server: {
          ...config.server,
          proxy: {
            // matches /1.96.2/resources or /resources
            "^(?:\\/(\\d+\\.)?(\\d+\\.)?(\\*|\\d+))?\\/resources\\/.*": {
              target: url,
              changeOrigin: true,
              followRedirects: true,
              rewrite: (path) => `${ui5Version === "" || /^\/\d+/.test(path) ? "" : `/${ui5Version}`}${path}`,
              configure: (proxy, options) => {
                if (debug) {
                  proxy.on("proxyReq", (proxyReq, req, _res) => {
                    logger.info(`UI5-Proxy: Sending Request to: ${req.method} ${req.url}`);
                  });
                  proxy.on("proxyRes", (proxyRes, req, _res) => {
                    logger.info(`UI5-Proxy: Received Response from: ${proxyRes.statusCode} ${req.url}`);
                  });
                }
              },
            },
            // matches /1.96.2/test-resources or /test-resources
            "^(?:\\/(\\d+\\.)?(\\d+\\.)?(\\*|\\d+))?\\/test-resources\\/.*": {
              target: url,
              changeOrigin: true,
              followRedirects: true,
              rewrite: (path) => `${ui5Version === "" || /^\/\d+/.test(path) ? "" : `/${ui5Version}`}${path}`,
              configure: (proxy, options) => {
                if (debug) {
                  proxy.on("proxyReq", (proxyReq, req, _res) => {
                    logger.info(`UI5-Proxy: Sending Request to: ${req.method} ${req.url}`);
                  });
                  proxy.on("proxyRes", (proxyRes, req, _res) => {
                    logger.info(`UI5-Proxy: Received Response from: ${proxyRes.statusCode} ${req.url}`);
                  });
                }
              },
            },
            ...config.server?.proxy,
          },
        },
      };
    },
    configResolved(resolvedConfig) {
      logger = resolvedConfig.logger;
    },
  };
};
