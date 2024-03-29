import { ConfigEnv, Plugin, PreviewServer, UserConfig, ViteDevServer } from "vite";
import { ViteUI5IntegrationPluginOptions } from "../types.ts";
import { BuildPlugin } from "./BuildPlugin.ts";
import { ServePlugin } from "./ServePlugin.ts";

export default (options: ViteUI5IntegrationPluginOptions): Plugin => {
  let plugin: BuildPlugin | ServePlugin, userConfig: UserConfig, configEnv: ConfigEnv;
  return {
    name: "vite-ui5-integration-plugin",
    config(config: UserConfig, env: ConfigEnv) {
      userConfig = config;
      configEnv = env;
      if (configEnv.command === "build") {
        plugin = new BuildPlugin(config, configEnv, options);
      } else if (configEnv.command == "serve") {
        plugin = new ServePlugin(config, configEnv, options);
      }

      return plugin?.config();
    },
    configResolved(config) {
      return plugin && "configResolved" in plugin ? plugin.configResolved(config) : undefined;
    },
    load(id) {
      return plugin?.load(id);
    },
    transform: {
      // our transform needs to run at first, cause UI5 transformation needs raw files (e.g. namespace determination)
      order: "pre",
      handler(code, id) {
        return plugin && "transform" in plugin ? plugin.transform(code, id) : undefined;
      },
    },
    resolveId(id) {
      return plugin?.resolveId(this, id);
    },
    buildStart(options) {
      return plugin && "buildStart" in plugin ? plugin.buildStart(this, options) : undefined;
    },
    generateBundle: {
      order: "post", // needs to run as last to generate proper Component.preload and cache buster files
      handler(options, bundle, isWrite) {
        return plugin && "generateBundle" in plugin ? plugin.generateBundle(this, options, bundle, isWrite) : undefined;
      },
    },
    watchChange(id, change) {
      return plugin && "watchChange" in plugin ? plugin.watchChange(this, id) : undefined;
    },
    handleHotUpdate(context) {
      return plugin && "handleHotUpdate" in plugin ? plugin.handleHotUpdate(context) : undefined;
    },
    configureServer(server: ViteDevServer) {
      return plugin && "configureServer" in plugin ? plugin.configureServer(server) : undefined;
    },
    configurePreviewServer(server: PreviewServer) {
      return plugin && "configurePreviewServer" in plugin ? plugin.configurePreviewServer(server) : undefined;
    },
  };
};
