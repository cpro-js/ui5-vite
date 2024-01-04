import { ConfigEnv, Plugin, UserConfig, ViteDevServer } from "vite";
import { BuildPlugin } from "./plugin/BuildPlugin.ts";
import { ServePlugin } from "./plugin/ServePlugin.ts";

export interface Ui5ViteAppPluginOptions {
  appId: string;
}

export default (options: Ui5ViteAppPluginOptions): Plugin => {
  let plugin: BuildPlugin | ServePlugin, userConfig: UserConfig, configEnv: ConfigEnv;
  return {
    name: "ui5-vite-app",
    config(config: UserConfig, env: ConfigEnv) {
      userConfig = config;
      configEnv = env;
      if (configEnv.command === "build") {
        plugin = new BuildPlugin(config, configEnv, options);
      } else if (configEnv.command == "serve") {
        plugin = new ServePlugin(config, configEnv, options);
      }

      plugin?.config();
    },
    load(id) {
      return plugin?.load(id);
    },
    resolveId(id) {
      return plugin?.resolveId(id);
    },
    generateBundle(options, bundle, isWrite) {
      return plugin && "generateBundle" in plugin ? plugin.generateBundle(this, options, bundle, isWrite) : undefined;
    },
    configureServer(server: ViteDevServer) {
      return plugin && "configureServer" in plugin ? plugin.configureServer(server) : undefined;
    },
  };
};
